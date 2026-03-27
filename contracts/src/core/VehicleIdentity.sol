// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/// @title VehicleIdentity
/// @notice ERC-721 + ERC-5192 soulbound NFT. Each token represents one vehicle.
contract VehicleIdentity is ERC721, AccessControl {
    bytes32 public constant REGISTRAR_ROLE = keccak256("REGISTRAR_ROLE");
    bytes32 public constant TRANSFER_ROLE = keccak256("TRANSFER_ROLE");

    bytes4 private constant _INTERFACE_ID_ERC5192 = 0xb45a3c0e;

    struct VehicleData {
        bytes32 vinHash;
        string manufacturer;
        string model;
        uint16 year;
        uint256 batteryCapacityKwh;
        uint256 registrationDate;
        bool transferApproved;
    }

    uint256 private _tokenIdCounter;
    mapping(uint256 => VehicleData) private vehicles;

    event VehicleRegistered(
        uint256 indexed tokenId,
        bytes32 vinHash,
        string manufacturer,
        string model,
        uint16 year
    );
    event VehicleTransferred(uint256 indexed tokenId, address newOwner);
    event Locked(uint256 indexed tokenId);
    event Unlocked(uint256 indexed tokenId);

    constructor(address admin) ERC721("Vehicle Identity", "VCID") {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(REGISTRAR_ROLE, admin);
    }

    /// @notice Register a new vehicle and mint a soulbound NFT
    function registerVehicle(
        bytes32 vinHash,
        string calldata manufacturer,
        string calldata model,
        uint16 year,
        uint256 batteryKwh
    ) external onlyRole(REGISTRAR_ROLE) returns (uint256 tokenId) {
        tokenId = ++_tokenIdCounter;
        vehicles[tokenId] = VehicleData({
            vinHash: vinHash,
            manufacturer: manufacturer,
            model: model,
            year: year,
            batteryCapacityKwh: batteryKwh,
            registrationDate: block.timestamp,
            transferApproved: false
        });
        _mint(msg.sender, tokenId);
        emit VehicleRegistered(tokenId, vinHash, manufacturer, model, year);
        emit Locked(tokenId);
    }

    /// @notice Transfer a vehicle — requires TRANSFER_ROLE, marks token as transferApproved
    function transferVehicle(uint256 tokenId, address newOwner) external onlyRole(TRANSFER_ROLE) {
        vehicles[tokenId].transferApproved = true;
        address currentOwner = ownerOf(tokenId);
        _transfer(currentOwner, newOwner, tokenId);
        vehicles[tokenId].transferApproved = false;
        emit VehicleTransferred(tokenId, newOwner);
        emit Locked(tokenId);
    }

    /// @notice Get vehicle data for a given tokenId
    function getVehicle(uint256 tokenId) external view returns (VehicleData memory) {
        require(_ownerOf(tokenId) != address(0), "VehicleIdentity: token does not exist");
        return vehicles[tokenId];
    }

    /// @notice ERC-5192: returns true when the token is locked (soulbound)
    function locked(uint256 tokenId) external view returns (bool) {
        require(_ownerOf(tokenId) != address(0), "VehicleIdentity: token does not exist");
        return !vehicles[tokenId].transferApproved;
    }

    /// @dev Override transferFrom to enforce soulbound logic
    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(
            vehicles[tokenId].transferApproved || hasRole(TRANSFER_ROLE, msg.sender),
            "VehicleIdentity: token is soulbound"
        );
        super.transferFrom(from, to, tokenId);
    }

    /// @dev Override safeTransferFrom to enforce soulbound logic
    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(
            vehicles[tokenId].transferApproved || hasRole(TRANSFER_ROLE, msg.sender),
            "VehicleIdentity: token is soulbound"
        );
        super.safeTransferFrom(from, to, tokenId, data);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return interfaceId == _INTERFACE_ID_ERC5192 || super.supportsInterface(interfaceId);
    }
}
