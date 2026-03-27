// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/// @title SimpleMultiSig
/// @notice Lightweight multi-signature wallet
contract SimpleMultiSig {
    struct Transaction {
        address to;
        uint256 value;
        bytes data;
        bool executed;
        uint256 confirmations;
    }

    address[] public owners;
    mapping(address => bool) public isOwner;
    uint256 public threshold;
    Transaction[] public transactions;
    mapping(uint256 => mapping(address => bool)) public confirmed;

    event TransactionSubmitted(uint256 indexed txId, address indexed submitter, address to, uint256 value);
    event TransactionConfirmed(uint256 indexed txId, address indexed confirmer);
    event TransactionExecuted(uint256 indexed txId);
    event ConfirmationRevoked(uint256 indexed txId, address indexed revoker);

    modifier onlyOwner() {
        require(isOwner[msg.sender], "SimpleMultiSig: not owner");
        _;
    }

    modifier txExists(uint256 txId) {
        require(txId < transactions.length, "SimpleMultiSig: tx does not exist");
        _;
    }

    modifier notExecuted(uint256 txId) {
        require(!transactions[txId].executed, "SimpleMultiSig: already executed");
        _;
    }

    constructor(address[] memory _owners, uint256 _threshold) {
        require(_owners.length >= _threshold, "SimpleMultiSig: invalid threshold");
        require(_threshold > 0, "SimpleMultiSig: threshold must be > 0");

        for (uint256 i = 0; i < _owners.length; i++) {
            require(_owners[i] != address(0), "SimpleMultiSig: zero address owner");
            require(!isOwner[_owners[i]], "SimpleMultiSig: duplicate owner");
            isOwner[_owners[i]] = true;
            owners.push(_owners[i]);
        }
        threshold = _threshold;
    }

    receive() external payable {}

    function submitTransaction(address to, uint256 value, bytes calldata data)
        external
        onlyOwner
        returns (uint256 txId)
    {
        txId = transactions.length;
        transactions.push(Transaction({
            to: to,
            value: value,
            data: data,
            executed: false,
            confirmations: 0
        }));
        emit TransactionSubmitted(txId, msg.sender, to, value);
    }

    function confirmTransaction(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        require(!confirmed[txId][msg.sender], "SimpleMultiSig: already confirmed");
        confirmed[txId][msg.sender] = true;
        transactions[txId].confirmations++;
        emit TransactionConfirmed(txId, msg.sender);
    }

    function executeTransaction(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        Transaction storage txn = transactions[txId];
        require(txn.confirmations >= threshold, "SimpleMultiSig: not enough confirmations");
        txn.executed = true;
        (bool ok, ) = txn.to.call{value: txn.value}(txn.data);
        require(ok, "SimpleMultiSig: execution failed");
        emit TransactionExecuted(txId);
    }

    function revokeConfirmation(uint256 txId)
        external
        onlyOwner
        txExists(txId)
        notExecuted(txId)
    {
        require(confirmed[txId][msg.sender], "SimpleMultiSig: not confirmed");
        confirmed[txId][msg.sender] = false;
        transactions[txId].confirmations--;
        emit ConfirmationRevoked(txId, msg.sender);
    }

    function getOwners() external view returns (address[] memory) {
        return owners;
    }

    function getTransactionCount() external view returns (uint256) {
        return transactions.length;
    }
}

/// @title MultiSigFactory
/// @notice Deploys SimpleMultiSig instances using CREATE2
contract MultiSigFactory {
    event MultiSigCreated(address indexed multiSig, address[] owners, uint256 threshold);

    function createMultiSig(address[] calldata owners, uint256 threshold)
        external
        returns (address multiSig)
    {
        bytes32 salt = keccak256(abi.encodePacked(owners, threshold, block.timestamp, msg.sender));
        bytes memory bytecode = abi.encodePacked(
            type(SimpleMultiSig).creationCode,
            abi.encode(owners, threshold)
        );
        assembly {
            multiSig := create2(0, add(bytecode, 32), mload(bytecode), salt)
        }
        require(multiSig != address(0), "MultiSigFactory: deployment failed");
        emit MultiSigCreated(multiSig, owners, threshold);
    }

    function computeAddress(address[] calldata owners, uint256 threshold, uint256 timestamp, address deployer)
        external
        view
        returns (address)
    {
        bytes32 salt = keccak256(abi.encodePacked(owners, threshold, timestamp, deployer));
        bytes memory bytecode = abi.encodePacked(
            type(SimpleMultiSig).creationCode,
            abi.encode(owners, threshold)
        );
        bytes32 hash = keccak256(
            abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode))
        );
        return address(uint160(uint256(hash)));
    }
}
