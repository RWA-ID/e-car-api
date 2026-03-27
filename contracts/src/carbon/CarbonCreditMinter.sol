// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title CarbonCreditMinter
/// @notice ERC-1155 carbon credits minted based on verified EV mileage
contract CarbonCreditMinter is ERC1155, AccessControl {
    bytes32 public constant ORACLE_ROLE = keccak256("ORACLE_ROLE");

    // 1 credit per 100 verified km
    uint256 public constant KM_PER_CREDIT = 100;

    mapping(uint256 => uint256) public totalMinted;
    mapping(uint256 => uint256) public totalRetired;

    event CreditsMinted(address indexed to, uint256 indexed vehicleId, uint256 amount, uint256 mileage);
    event CreditsRetired(address indexed owner, uint256 indexed tokenId, uint256 amount, string reason);

    constructor(address admin) ERC1155("https://api.e-car.eth/carbon/{id}.json") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ROLE, admin);
    }

    /// @notice Mint carbon credits based on verified mileage
    function mintCredits(
        address to,
        uint256 vehicleId,
        uint256 verifiedMileage
    ) external onlyRole(ORACLE_ROLE) returns (uint256 amount) {
        amount = verifiedMileage / KM_PER_CREDIT;
        require(amount > 0, "CarbonCreditMinter: no credits to mint");
        _mint(to, vehicleId, amount, "");
        totalMinted[vehicleId] += amount;
        emit CreditsMinted(to, vehicleId, amount, verifiedMileage);
    }

    /// @notice Retire (burn) carbon credits
    function retireCredits(
        uint256 tokenId,
        uint256 amount,
        string calldata reason
    ) external {
        _burn(msg.sender, tokenId, amount);
        totalRetired[tokenId] += amount;
        emit CreditsRetired(msg.sender, tokenId, amount, reason);
    }

    function getCreditBalance(address owner, uint256 vehicleId) external view returns (uint256) {
        return balanceOf(owner, vehicleId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC1155, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}
