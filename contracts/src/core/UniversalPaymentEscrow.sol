// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title UniversalPaymentEscrow
/// @notice Multi-token escrow for EV payments (charging, toll, parking, marketplace, V2G, service)
contract UniversalPaymentEscrow is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum PaymentType { CHARGING, TOLL, PARKING, MARKETPLACE, V2G, SERVICE }
    enum EscrowStatus { PENDING, RELEASED, REFUNDED }

    struct Escrow {
        address payer;
        address payee;
        uint256 amount;
        address token;
        PaymentType pType;
        EscrowStatus status;
        uint256 createdAt;
    }

    mapping(uint256 => Escrow) public escrows;
    uint256 public escrowCount;
    uint256 public feeBps = 30;
    address public treasury;

    event EscrowCreated(uint256 indexed escrowId, address payer, address payee, uint256 amount, address token, PaymentType pType);
    event EscrowReleased(uint256 indexed escrowId, uint256 fee, uint256 payout);
    event EscrowRefunded(uint256 indexed escrowId);
    event FeeUpdated(uint256 newFeeBps);
    event TreasuryUpdated(address newTreasury);

    constructor(address _treasury) Ownable(msg.sender) {
        treasury = _treasury;
    }

    /// @notice Create a new escrow; use address(0) for ETH
    function createEscrow(
        address payee,
        uint256 amount,
        address token,
        PaymentType pType
    ) external payable nonReentrant returns (uint256 escrowId) {
        require(payee != address(0), "UniversalPaymentEscrow: invalid payee");
        require(amount > 0, "UniversalPaymentEscrow: amount must be > 0");

        if (token == address(0)) {
            require(msg.value == amount, "UniversalPaymentEscrow: ETH amount mismatch");
        } else {
            require(msg.value == 0, "UniversalPaymentEscrow: ETH not accepted for ERC20 escrow");
            IERC20(token).safeTransferFrom(msg.sender, address(this), amount);
        }

        escrowId = ++escrowCount;
        escrows[escrowId] = Escrow({
            payer: msg.sender,
            payee: payee,
            amount: amount,
            token: token,
            pType: pType,
            status: EscrowStatus.PENDING,
            createdAt: block.timestamp
        });

        emit EscrowCreated(escrowId, msg.sender, payee, amount, token, pType);
    }

    /// @notice Release escrow to payee (payer or owner can call)
    function releaseEscrow(uint256 escrowId) external nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.PENDING, "UniversalPaymentEscrow: not pending");
        require(
            msg.sender == escrow.payer || msg.sender == owner(),
            "UniversalPaymentEscrow: unauthorized"
        );

        escrow.status = EscrowStatus.RELEASED;
        uint256 fee = (escrow.amount * feeBps) / 10000;
        uint256 payout = escrow.amount - fee;

        if (escrow.token == address(0)) {
            if (fee > 0) _sendETH(treasury, fee);
            _sendETH(escrow.payee, payout);
        } else {
            if (fee > 0) IERC20(escrow.token).safeTransfer(treasury, fee);
            IERC20(escrow.token).safeTransfer(escrow.payee, payout);
        }

        emit EscrowReleased(escrowId, fee, payout);
    }

    /// @notice Refund escrow to payer (owner only)
    function refundEscrow(uint256 escrowId) external onlyOwner nonReentrant {
        Escrow storage escrow = escrows[escrowId];
        require(escrow.status == EscrowStatus.PENDING, "UniversalPaymentEscrow: not pending");

        escrow.status = EscrowStatus.REFUNDED;

        if (escrow.token == address(0)) {
            _sendETH(escrow.payer, escrow.amount);
        } else {
            IERC20(escrow.token).safeTransfer(escrow.payer, escrow.amount);
        }

        emit EscrowRefunded(escrowId);
    }

    function setFeeBps(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "UniversalPaymentEscrow: fee too high");
        feeBps = newFee;
        emit FeeUpdated(newFee);
    }

    function setTreasury(address newTreasury) external onlyOwner {
        require(newTreasury != address(0), "UniversalPaymentEscrow: zero address");
        treasury = newTreasury;
        emit TreasuryUpdated(newTreasury);
    }

    function _sendETH(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        require(ok, "UniversalPaymentEscrow: ETH transfer failed");
    }
}
