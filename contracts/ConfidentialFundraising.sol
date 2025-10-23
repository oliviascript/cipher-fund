// SPDX-License-Identifier: MIT
pragma solidity ^0.8.27;

import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";
import {FHE, ebool, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {IERC7984} from "@openzeppelin/confidential-contracts/interfaces/IERC7984.sol";
import {IERC7984Receiver} from "@openzeppelin/confidential-contracts/interfaces/IERC7984Receiver.sol";

/// @title ConfidentialFundraising
/// @notice Manages encrypted fundraising campaigns that reward encrypted points for every cETH donated.
contract ConfidentialFundraising is SepoliaConfig, IERC7984Receiver {
    struct Campaign {
        address creator;
        string title;
        string description;
        uint256 goal;
        bool active;
        euint64 encryptedRaised;
    }

    struct CampaignInfo {
        uint256 id;
        address creator;
        string title;
        string description;
        uint256 goal;
        bool active;
    }

    error UnsupportedToken(address token);
    error CampaignDoesNotExist(uint256 campaignId);
    error CampaignInactive(uint256 campaignId);
    error InvalidDonationPayload();
    error Unauthorized(address account);
    error InvalidCampaignGoal();
    error EmptyTitle();
    error EmptyDescription();

    event CampaignCreated(
        uint256 indexed campaignId,
        address indexed creator,
        string title,
        string description,
        uint256 goal
    );
    event CampaignStatusUpdated(uint256 indexed campaignId, bool active);
    event DonationReceived(
        uint256 indexed campaignId,
        address indexed donor,
        euint64 amount,
        euint64 totalRaised
    );
    event PointsUpdated(uint256 indexed campaignId, address indexed donor, euint64 totalPoints);

    IERC7984 public immutable cEthToken;

    uint256 private _nextCampaignId;
    mapping(uint256 => Campaign) private _campaigns;
    mapping(uint256 => mapping(address => euint64)) private _userPoints;

    constructor(address tokenAddress) {
        if (tokenAddress == address(0)) {
            revert UnsupportedToken(tokenAddress);
        }
        cEthToken = IERC7984(tokenAddress);
    }

    modifier campaignExists(uint256 campaignId) {
        if (campaignId >= _nextCampaignId) {
            revert CampaignDoesNotExist(campaignId);
        }
        _;
    }

    /// @notice Creates a new fundraising campaign.
    /// @param title Campaign title.
    /// @param description Campaign description.
    /// @param goal Target amount denominated in cETH smallest units.
    /// @return campaignId Newly created campaign identifier.
    function createCampaign(
        string calldata title,
        string calldata description,
        uint256 goal
    ) external returns (uint256 campaignId) {
        if (bytes(title).length == 0) {
            revert EmptyTitle();
        }
        if (bytes(description).length == 0) {
            revert EmptyDescription();
        }
        if (goal == 0) {
            revert InvalidCampaignGoal();
        }

        campaignId = _nextCampaignId;
        _nextCampaignId += 1;

        Campaign storage campaign = _campaigns[campaignId];
        campaign.creator = msg.sender;
        campaign.title = title;
        campaign.description = description;
        campaign.goal = goal;
        campaign.active = true;
        campaign.encryptedRaised = FHE.asEuint64(0);
        FHE.allowThis(campaign.encryptedRaised);
        FHE.allow(campaign.encryptedRaised, msg.sender);

        emit CampaignCreated(campaignId, msg.sender, title, description, goal);
        emit CampaignStatusUpdated(campaignId, true);
    }

    /// @notice Returns the number of campaigns ever created.
    function getCampaignCount() external view returns (uint256) {
        return _nextCampaignId;
    }

    /// @notice Retrieves public information for a campaign.
    function getCampaign(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (CampaignInfo memory)
    {
        Campaign storage campaign = _campaigns[campaignId];
        return
            CampaignInfo({
                id: campaignId,
                creator: campaign.creator,
                title: campaign.title,
                description: campaign.description,
                goal: campaign.goal,
                active: campaign.active
            });
    }

    /// @notice Returns metadata for every created campaign.
    function getCampaigns() external view returns (CampaignInfo[] memory campaigns) {
        uint256 total = _nextCampaignId;
        campaigns = new CampaignInfo[](total);
        for (uint256 i = 0; i < total; i++) {
            Campaign storage campaign = _campaigns[i];
            campaigns[i] = CampaignInfo({
                id: i,
                creator: campaign.creator,
                title: campaign.title,
                description: campaign.description,
                goal: campaign.goal,
                active: campaign.active
            });
        }
    }

    /// @notice Returns the encrypted amount raised by a campaign.
    function getCampaignRaised(uint256 campaignId)
        external
        view
        campaignExists(campaignId)
        returns (euint64)
    {
        return _campaigns[campaignId].encryptedRaised;
    }

    /// @notice Returns the encrypted points for a user in a specific campaign.
    function getUserPoints(uint256 campaignId, address user)
        external
        view
        campaignExists(campaignId)
        returns (euint64)
    {
        return _userPoints[campaignId][user];
    }

    /// @notice View helper exposing the cETH token address.
    function getToken() external view returns (address) {
        return address(cEthToken);
    }

    /// @inheritdoc IERC7984Receiver
    function onConfidentialTransferReceived(
        address /* operator */,
        address from,
        euint64 amount,
        bytes calldata data
    ) external override returns (ebool) {
        if (msg.sender != address(cEthToken)) {
            revert UnsupportedToken(msg.sender);
        }

        if (data.length == 0) {
            revert InvalidDonationPayload();
        }

        uint256 campaignId = abi.decode(data, (uint256));
        if (campaignId >= _nextCampaignId) {
            revert CampaignDoesNotExist(campaignId);
        }

        Campaign storage campaign = _campaigns[campaignId];
        if (!campaign.active) {
            revert CampaignInactive(campaignId);
        }

        FHE.allowThis(amount);
        FHE.allow(amount, address(this));
        FHE.allow(amount, from);
        FHE.allow(amount, campaign.creator);

        euint64 updatedRaised = FHE.add(campaign.encryptedRaised, amount);
        FHE.allowThis(updatedRaised);
        FHE.allow(updatedRaised, campaign.creator);
        FHE.allow(updatedRaised, from);
        campaign.encryptedRaised = updatedRaised;

        euint64 pointsIncrease = FHE.mul(amount, uint64(100));
        FHE.allowThis(pointsIncrease);
        FHE.allow(pointsIncrease, address(this));
        FHE.allow(pointsIncrease, from);

        euint64 currentPoints = _userPoints[campaignId][from];
        if (!FHE.isInitialized(currentPoints)) {
            currentPoints = FHE.asEuint64(0);
        }

        euint64 updatedPoints = FHE.add(currentPoints, pointsIncrease);
        FHE.allowThis(updatedPoints);
        FHE.allow(updatedPoints, from);
        _userPoints[campaignId][from] = updatedPoints;

        emit DonationReceived(campaignId, from, amount, updatedRaised);
        emit PointsUpdated(campaignId, from, updatedPoints);

        return FHE.asEbool(true);
    }

    /// @notice Allows the campaign creator to deactivate or reactivate a campaign.
    /// @param campaignId Identifier of the campaign to update.
    /// @param active Desired active state.
    function setCampaignActive(uint256 campaignId, bool active) external campaignExists(campaignId) {
        Campaign storage campaign = _campaigns[campaignId];
        if (campaign.creator != msg.sender) {
            revert Unauthorized(msg.sender);
        }
        if (campaign.active == active) {
            return;
        }
        campaign.active = active;
        emit CampaignStatusUpdated(campaignId, active);
    }
}
