// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BrandRegistry
/// @notice ENS-style hierarchical registry per brand namespace
contract BrandRegistry {
    struct Record {
        address owner;
        address resolver;
        uint64 ttl;
    }

    mapping(bytes32 => Record) private records;
    address public brand;
    string public brandName;

    event Transfer(bytes32 indexed node, address owner);
    event NewResolver(bytes32 indexed node, address resolver);
    event NewTTL(bytes32 indexed node, uint64 ttl);

    modifier onlyNodeOwner(bytes32 node) {
        require(records[node].owner == msg.sender, "BrandRegistry: not node owner");
        _;
    }

    constructor(address _brand, string memory _brandName) {
        brand = _brand;
        brandName = _brandName;

        // Set root node owner to brand address
        bytes32 rootNode = keccak256(abi.encodePacked(bytes32(0), keccak256(bytes(_brandName))));
        records[rootNode].owner = _brand;
    }

    function setRecord(
        bytes32 node,
        address _owner,
        address _resolver,
        uint64 _ttl
    ) external onlyNodeOwner(node) {
        records[node] = Record({owner: _owner, resolver: _resolver, ttl: _ttl});
        emit Transfer(node, _owner);
        emit NewResolver(node, _resolver);
        emit NewTTL(node, _ttl);
    }

    function setOwner(bytes32 node, address _owner) external onlyNodeOwner(node) {
        records[node].owner = _owner;
        emit Transfer(node, _owner);
    }

    function setResolver(bytes32 node, address _resolver) external onlyNodeOwner(node) {
        records[node].resolver = _resolver;
        emit NewResolver(node, _resolver);
    }

    function setTTL(bytes32 node, uint64 _ttl) external onlyNodeOwner(node) {
        records[node].ttl = _ttl;
        emit NewTTL(node, _ttl);
    }

    function owner(bytes32 node) external view returns (address) {
        return records[node].owner;
    }

    function resolver(bytes32 node) external view returns (address) {
        return records[node].resolver;
    }

    function ttl(bytes32 node) external view returns (uint64) {
        return records[node].ttl;
    }

    function recordExists(bytes32 node) external view returns (bool) {
        return records[node].owner != address(0);
    }
}
