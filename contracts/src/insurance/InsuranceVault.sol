// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @title InsuranceVault
/// @notice Decentralized insurance pools for EV vehicles
contract InsuranceVault is Ownable, ReentrancyGuard {
    struct Pool {
        uint256 vehicleClass;
        uint256 premiumBps;
        uint256 totalFunds;
        bool active;
    }

    struct Membership {
        uint256 vehicleId;
        uint256 paidPremium;
        uint256 joinedAt;
    }

    struct Claim {
        uint256 poolId;
        uint256 vehicleId;
        uint256 amount;
        bytes32 evidenceHash;
        address claimant;
        bool approved;
        bool paid;
        uint256 createdAt;
        uint256 approvals;
    }

    address public insurer;
    address public arbitrator;

    Pool[] public pools;
    Claim[] public claims;

    mapping(uint256 => mapping(uint256 => Membership)) public memberships;
    mapping(uint256 => mapping(address => bool)) public claimApprovedBy;

    event PoolCreated(uint256 indexed poolId, uint256 vehicleClass, uint256 premiumBps);
    event MemberJoined(uint256 indexed poolId, uint256 vehicleId, uint256 premium);
    event ClaimFiled(uint256 indexed claimId, uint256 poolId, uint256 vehicleId, uint256 amount);
    event ClaimApproved(uint256 indexed claimId);
    event ClaimPaid(uint256 indexed claimId, uint256 amount);
    event PremiumWithdrawn(uint256 indexed poolId, address member, uint256 amount);

    constructor(address _insurer, address _arbitrator) Ownable(msg.sender) {
        insurer = _insurer;
        arbitrator = _arbitrator;
    }

    function createPool(uint256 vehicleClass, uint256 premiumBps)
        external
        onlyOwner
        returns (uint256 poolId)
    {
        poolId = pools.length;
        pools.push(Pool({
            vehicleClass: vehicleClass,
            premiumBps: premiumBps,
            totalFunds: 0,
            active: true
        }));
        emit PoolCreated(poolId, vehicleClass, premiumBps);
    }

    function joinPool(uint256 poolId, uint256 vehicleId) external payable nonReentrant {
        require(poolId < pools.length && pools[poolId].active, "InsuranceVault: invalid pool");
        require(msg.value > 0, "InsuranceVault: premium required");
        require(memberships[poolId][vehicleId].joinedAt == 0, "InsuranceVault: already member");

        memberships[poolId][vehicleId] = Membership({
            vehicleId: vehicleId,
            paidPremium: msg.value,
            joinedAt: block.timestamp
        });
        pools[poolId].totalFunds += msg.value;
        emit MemberJoined(poolId, vehicleId, msg.value);
    }

    function fileClaim(
        uint256 poolId,
        uint256 vehicleId,
        uint256 amount,
        bytes32 evidenceHash
    ) external {
        require(memberships[poolId][vehicleId].joinedAt > 0, "InsuranceVault: not a member");
        require(amount <= pools[poolId].totalFunds, "InsuranceVault: amount exceeds pool");

        claims.push(Claim({
            poolId: poolId,
            vehicleId: vehicleId,
            amount: amount,
            evidenceHash: evidenceHash,
            claimant: msg.sender,
            approved: false,
            paid: false,
            createdAt: block.timestamp,
            approvals: 0
        }));
        emit ClaimFiled(claims.length - 1, poolId, vehicleId, amount);
    }

    function approveClaim(uint256 claimId) external {
        require(
            msg.sender == insurer || msg.sender == owner() || msg.sender == arbitrator,
            "InsuranceVault: unauthorized approver"
        );
        Claim storage claim = claims[claimId];
        require(!claim.approved, "InsuranceVault: already approved");
        require(!claimApprovedBy[claimId][msg.sender], "InsuranceVault: already approved by you");

        claimApprovedBy[claimId][msg.sender] = true;
        claim.approvals++;

        if (claim.approvals >= 2) {
            claim.approved = true;
            emit ClaimApproved(claimId);
            _payClaim(claimId);
        }
    }

    function _payClaim(uint256 claimId) internal nonReentrant {
        Claim storage claim = claims[claimId];
        require(claim.approved && !claim.paid, "InsuranceVault: cannot pay");
        require(pools[claim.poolId].totalFunds >= claim.amount, "InsuranceVault: insufficient pool");

        claim.paid = true;
        pools[claim.poolId].totalFunds -= claim.amount;

        (bool ok, ) = claim.claimant.call{value: claim.amount}("");
        require(ok, "InsuranceVault: payment failed");
        emit ClaimPaid(claimId, claim.amount);
    }

    function withdrawPremium(uint256 poolId) external onlyOwner {
        uint256 balance = pools[poolId].totalFunds;
        pools[poolId].totalFunds = 0;
        (bool ok, ) = owner().call{value: balance}("");
        require(ok, "InsuranceVault: withdraw failed");
        emit PremiumWithdrawn(poolId, owner(), balance);
    }
}
