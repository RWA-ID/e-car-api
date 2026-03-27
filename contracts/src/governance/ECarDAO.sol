// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ECarDAO
/// @notice ERC20Votes-based DAO governance for the e-car.eth protocol
contract ECarDAO is Ownable {
    enum ProposalState { Pending, Active, Defeated, Succeeded, Executed }

    struct Proposal {
        uint256 id;
        address proposer;
        address[] targets;
        uint256[] values;
        bytes[] calldatas;
        string description;
        uint256 forVotes;
        uint256 againstVotes;
        uint256 abstainVotes;
        uint256 createdAt;
        uint256 deadline;
        bool executed;
        ProposalState state;
    }

    ERC20Votes public governanceToken;
    uint256 public votingPeriod = 3 days;
    uint256 public proposalThreshold = 1000e18;
    uint256 public quorumVotes = 10000e18;

    mapping(uint256 => Proposal) public proposals;
    mapping(uint256 => mapping(address => uint8)) public hasVoted;
    uint256 public proposalCount;

    event ProposalCreated(uint256 indexed proposalId, address proposer, string description);
    event VoteCast(uint256 indexed proposalId, address voter, uint8 support, uint256 weight);
    event ProposalExecuted(uint256 indexed proposalId);

    constructor(address _governanceToken) Ownable(msg.sender) {
        governanceToken = ERC20Votes(_governanceToken);
    }

    function propose(
        address[] memory targets,
        uint256[] memory values,
        bytes[] memory calldatas,
        string memory description
    ) external returns (uint256 proposalId) {
        require(
            governanceToken.getVotes(msg.sender) >= proposalThreshold,
            "ECarDAO: below proposal threshold"
        );
        require(targets.length == values.length && values.length == calldatas.length, "ECarDAO: length mismatch");

        proposalId = ++proposalCount;
        Proposal storage p = proposals[proposalId];
        p.id = proposalId;
        p.proposer = msg.sender;
        p.targets = targets;
        p.values = values;
        p.calldatas = calldatas;
        p.description = description;
        p.createdAt = block.timestamp;
        p.deadline = block.timestamp + votingPeriod;
        p.state = ProposalState.Active;

        emit ProposalCreated(proposalId, msg.sender, description);
    }

    function castVote(uint256 proposalId, uint8 support) external {
        require(support <= 2, "ECarDAO: invalid support value");
        Proposal storage p = proposals[proposalId];
        require(p.state == ProposalState.Active, "ECarDAO: not active");
        require(block.timestamp <= p.deadline, "ECarDAO: voting ended");
        require(hasVoted[proposalId][msg.sender] == 0, "ECarDAO: already voted");

        uint256 weight = governanceToken.getVotes(msg.sender);
        require(weight > 0, "ECarDAO: no voting power");

        hasVoted[proposalId][msg.sender] = support + 1;

        if (support == 0) p.againstVotes += weight;
        else if (support == 1) p.forVotes += weight;
        else p.abstainVotes += weight;

        emit VoteCast(proposalId, msg.sender, support, weight);
    }

    function execute(uint256 proposalId) external {
        Proposal storage p = proposals[proposalId];
        require(block.timestamp > p.deadline, "ECarDAO: voting not ended");
        require(!p.executed, "ECarDAO: already executed");
        require(p.forVotes > p.againstVotes, "ECarDAO: proposal defeated");
        require(p.forVotes + p.againstVotes + p.abstainVotes >= quorumVotes, "ECarDAO: quorum not reached");

        p.executed = true;
        p.state = ProposalState.Executed;

        for (uint256 i = 0; i < p.targets.length; i++) {
            (bool ok, ) = p.targets[i].call{value: p.values[i]}(p.calldatas[i]);
            require(ok, "ECarDAO: execution failed");
        }

        emit ProposalExecuted(proposalId);
    }

    function setVotingPeriod(uint256 newPeriod) external onlyOwner {
        votingPeriod = newPeriod;
    }

    function setQuorum(uint256 newQuorum) external onlyOwner {
        quorumVotes = newQuorum;
    }
}
