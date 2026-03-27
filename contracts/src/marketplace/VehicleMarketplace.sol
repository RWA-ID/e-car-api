// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721.sol";

/// @title VehicleMarketplace
/// @notice Decentralized marketplace for buying and selling EV NFTs
contract VehicleMarketplace is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct Listing {
        address seller;
        uint256 tokenId;
        uint256 price;
        address token;
        bool active;
        uint256 listedAt;
    }

    IERC721 public vehicleNFT;
    uint256 public feeBps = 250; // 2.5%
    address public treasury;

    mapping(uint256 => Listing) private listings;
    uint256 public listingCount;

    event VehicleListed(uint256 indexed listingId, address seller, uint256 tokenId, uint256 price, address token);
    event VehiclePurchased(uint256 indexed listingId, address buyer, uint256 tokenId, uint256 price);
    event ListingCancelled(uint256 indexed listingId);
    event FeeUpdated(uint256 newFeeBps);

    constructor(address _vehicleNFT, address _treasury) Ownable(msg.sender) {
        vehicleNFT = IERC721(_vehicleNFT);
        treasury = _treasury;
    }

    function listVehicle(
        uint256 tokenId,
        uint256 price,
        address token
    ) external returns (uint256 listingId) {
        require(vehicleNFT.ownerOf(tokenId) == msg.sender, "VehicleMarketplace: not owner");
        require(vehicleNFT.isApprovedForAll(msg.sender, address(this)) ||
            vehicleNFT.getApproved(tokenId) == address(this),
            "VehicleMarketplace: not approved"
        );
        require(price > 0, "VehicleMarketplace: price must be > 0");

        listingId = ++listingCount;
        listings[listingId] = Listing({
            seller: msg.sender,
            tokenId: tokenId,
            price: price,
            token: token,
            active: true,
            listedAt: block.timestamp
        });

        emit VehicleListed(listingId, msg.sender, tokenId, price, token);
    }

    function purchaseVehicle(uint256 listingId) external payable nonReentrant {
        Listing storage listing = listings[listingId];
        require(listing.active, "VehicleMarketplace: not active");

        listing.active = false;
        uint256 fee = (listing.price * feeBps) / 10000;
        uint256 sellerAmount = listing.price - fee;

        if (listing.token == address(0)) {
            require(msg.value == listing.price, "VehicleMarketplace: wrong ETH amount");
            if (fee > 0) {
                (bool ok1, ) = treasury.call{value: fee}("");
                require(ok1, "VehicleMarketplace: fee transfer failed");
            }
            (bool ok2, ) = listing.seller.call{value: sellerAmount}("");
            require(ok2, "VehicleMarketplace: seller payment failed");
        } else {
            require(msg.value == 0, "VehicleMarketplace: ETH not accepted");
            if (fee > 0) IERC20(listing.token).safeTransferFrom(msg.sender, treasury, fee);
            IERC20(listing.token).safeTransferFrom(msg.sender, listing.seller, sellerAmount);
        }

        vehicleNFT.safeTransferFrom(listing.seller, msg.sender, listing.tokenId);
        emit VehiclePurchased(listingId, msg.sender, listing.tokenId, listing.price);
    }

    function cancelListing(uint256 listingId) external {
        Listing storage listing = listings[listingId];
        require(listing.seller == msg.sender || owner() == msg.sender, "VehicleMarketplace: unauthorized");
        require(listing.active, "VehicleMarketplace: not active");
        listing.active = false;
        emit ListingCancelled(listingId);
    }

    function getListing(uint256 listingId)
        external
        view
        returns (address seller, uint256 tokenId, uint256 price, address token, bool active)
    {
        Listing storage l = listings[listingId];
        return (l.seller, l.tokenId, l.price, l.token, l.active);
    }

    function setFeeBps(uint256 newFee) external onlyOwner {
        require(newFee <= 1000, "VehicleMarketplace: fee too high");
        feeBps = newFee;
        emit FeeUpdated(newFee);
    }
}
