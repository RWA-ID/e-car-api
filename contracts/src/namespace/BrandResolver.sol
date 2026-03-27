// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title BrandResolver
/// @notice Custom ENS resolver with vehicle/battery/payment records
contract BrandResolver {
    mapping(bytes32 => address) private _addresses;
    mapping(bytes32 => mapping(string => string)) private _textRecords;
    mapping(bytes32 => bytes) private _contenthashes;

    event AddrChanged(bytes32 indexed node, address addr);
    event TextChanged(bytes32 indexed node, string indexed key, string value);
    event ContenthashChanged(bytes32 indexed node, bytes hash);

    function setAddr(bytes32 node, address newAddr) external {
        _addresses[node] = newAddr;
        emit AddrChanged(node, newAddr);
    }

    function addr(bytes32 node) external view returns (address) {
        return _addresses[node];
    }

    function setText(bytes32 node, string calldata key, string calldata value) external {
        _textRecords[node][key] = value;
        emit TextChanged(node, key, value);
    }

    function text(bytes32 node, string calldata key) external view returns (string memory) {
        return _textRecords[node][key];
    }

    function setContenthash(bytes32 node, bytes calldata hash) external {
        _contenthashes[node] = hash;
        emit ContenthashChanged(node, hash);
    }

    function contenthash(bytes32 node) external view returns (bytes memory) {
        return _contenthashes[node];
    }

    function supportsInterface(bytes4 interfaceId) external pure returns (bool) {
        return
            interfaceId == 0x3b3b57de || // addr(bytes32)
            interfaceId == 0x59d1d43c || // text(bytes32,string)
            interfaceId == 0xbc1c58d1 || // contenthash(bytes32)
            interfaceId == 0x01ffc9a7;   // supportsInterface
    }
}
