// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "./BrandRegistry.sol";
import "./BrandResolver.sol";
import "./MultiSigFactory.sol";

/// @title NamespaceGovernorFactory
/// @notice Factory for deploying per-brand namespaces under e-car.eth
contract NamespaceGovernorFactory is Ownable {
    struct BrandInfo {
        address registry;
        address resolver;
        address multiSig;
        bool reserved;
        bool claimed;
        address claimedBy;
    }

    uint256 public constant CLAIM_FEE = 10 ether;

    mapping(string => BrandInfo) public brands;
    string[] public reservedBrands;

    MultiSigFactory public immutable multiSigFactory;

    event NamespaceCreated(string brand, address registry, address resolver, address multiSig);
    event BrandReserved(string brand);

    constructor() Ownable(msg.sender) {
        multiSigFactory = new MultiSigFactory();

        string[35] memory _reserved = [
            "tesla", "ford", "rivian", "byd", "lucid", "bmw", "mercedes", "gm",
            "hyundai", "nio", "polestar", "volkswagen", "audi", "porsche", "volvo",
            "kia", "toyota", "honda", "chevrolet", "cadillac", "genesis", "fisker",
            "vinfast", "xpeng", "zeekr", "lotus", "maserati", "jaguar", "mini",
            "smart", "cupra", "renault", "peugeot", "citroen", "opel"
        ];

        for (uint256 i = 0; i < _reserved.length; i++) {
            brands[_reserved[i]].reserved = true;
            reservedBrands.push(_reserved[i]);
        }
    }

    function reserveBrand(string calldata brand) external onlyOwner {
        require(!brands[brand].reserved, "NamespaceGovernorFactory: already reserved");
        brands[brand].reserved = true;
        reservedBrands.push(brand);
        emit BrandReserved(brand);
    }

    /// @notice Claim a brand namespace by paying 10 ETH
    function claimBrand(string calldata brand, address[] calldata signers) external payable {
        require(msg.value == CLAIM_FEE, "NamespaceGovernorFactory: wrong fee");
        require(!brands[brand].claimed, "NamespaceGovernorFactory: already claimed");
        require(signers.length >= 2, "NamespaceGovernorFactory: need >= 2 signers");

        (address registry, address resolver, address multiSig) = deployNamespace(brand, signers);

        brands[brand].registry = registry;
        brands[brand].resolver = resolver;
        brands[brand].multiSig = multiSig;
        brands[brand].claimed = true;
        brands[brand].claimedBy = msg.sender;

        // Forward fee to owner (treasury)
        (bool ok, ) = owner().call{value: msg.value}("");
        require(ok, "NamespaceGovernorFactory: fee transfer failed");

        emit NamespaceCreated(brand, registry, resolver, multiSig);
    }

    function deployNamespace(string calldata brand, address[] calldata signers)
        internal
        returns (address registry, address resolver, address multiSig)
    {
        uint256 threshold = signers.length >= 3 ? 2 : 1;
        multiSig = multiSigFactory.createMultiSig(signers, threshold);

        BrandRegistry reg = new BrandRegistry(multiSig, brand);
        BrandResolver res = new BrandResolver();

        registry = address(reg);
        resolver = address(res);
    }

    function getBrandInfo(string calldata brand) external view returns (BrandInfo memory) {
        return brands[brand];
    }

    function isReserved(string calldata brand) external view returns (bool) {
        return brands[brand].reserved;
    }

    function getReservedBrands() external view returns (string[] memory) {
        return reservedBrands;
    }
}
