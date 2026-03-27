// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title DataMarketplace
/// @notice Marketplace for EV data datasets with 70/20/10 revenue split
contract DataMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Dataset {
        bytes32 dataHash;
        uint256 price;
        address token;
        address dataOwner;
        address oemAddress;
        bool active;
        uint256 purchaseCount;
        uint256 listedAt;
    }

    mapping(uint256 => Dataset) public datasets;
    mapping(uint256 => mapping(address => bool)) public purchases;
    uint256 public datasetCount;

    address public protocolTreasury;

    // Revenue split: 70% owner, 20% protocol, 10% OEM
    uint256 public constant OWNER_BPS = 7000;
    uint256 public constant PROTOCOL_BPS = 2000;
    uint256 public constant OEM_BPS = 1000;

    event DatasetListed(uint256 indexed datasetId, bytes32 dataHash, uint256 price, address token, address owner);
    event DatasetPurchased(uint256 indexed datasetId, address buyer, uint256 price);

    constructor(address _treasury) Ownable(msg.sender) {
        protocolTreasury = _treasury;
    }

    function listDataset(
        bytes32 dataHash,
        uint256 price,
        address token
    ) external returns (uint256 datasetId) {
        datasetId = ++datasetCount;
        datasets[datasetId] = Dataset({
            dataHash: dataHash,
            price: price,
            token: token,
            dataOwner: msg.sender,
            oemAddress: msg.sender,
            active: true,
            purchaseCount: 0,
            listedAt: block.timestamp
        });
        emit DatasetListed(datasetId, dataHash, price, token, msg.sender);
    }

    function purchaseDataset(uint256 datasetId) external payable nonReentrant {
        Dataset storage dataset = datasets[datasetId];
        require(dataset.active, "DataMarketplace: not active");
        require(!purchases[datasetId][msg.sender], "DataMarketplace: already purchased");

        uint256 ownerAmount = (dataset.price * OWNER_BPS) / 10000;
        uint256 protocolAmount = (dataset.price * PROTOCOL_BPS) / 10000;
        uint256 oemAmount = dataset.price - ownerAmount - protocolAmount;

        if (dataset.token == address(0)) {
            require(msg.value == dataset.price, "DataMarketplace: wrong ETH amount");
            (bool ok1, ) = dataset.dataOwner.call{value: ownerAmount}("");
            require(ok1, "DataMarketplace: owner payment failed");
            (bool ok2, ) = protocolTreasury.call{value: protocolAmount}("");
            require(ok2, "DataMarketplace: protocol payment failed");
            (bool ok3, ) = dataset.oemAddress.call{value: oemAmount}("");
            require(ok3, "DataMarketplace: OEM payment failed");
        } else {
            require(msg.value == 0, "DataMarketplace: ETH not accepted");
            IERC20(dataset.token).safeTransferFrom(msg.sender, dataset.dataOwner, ownerAmount);
            IERC20(dataset.token).safeTransferFrom(msg.sender, protocolTreasury, protocolAmount);
            IERC20(dataset.token).safeTransferFrom(msg.sender, dataset.oemAddress, oemAmount);
        }

        purchases[datasetId][msg.sender] = true;
        dataset.purchaseCount++;
        emit DatasetPurchased(datasetId, msg.sender, dataset.price);
    }

    function verifyPurchase(uint256 datasetId, address buyer) external view returns (bool) {
        return purchases[datasetId][buyer];
    }
}
