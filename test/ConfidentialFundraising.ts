import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { expect } from "chai";
import { FhevmType } from "@fhevm/hardhat-plugin";
import { ethers, fhevm } from "hardhat";
import {
  ConfidentialFundraising,
  ConfidentialFundraising__factory,
} from "../types";

type Signers = {
  deployer: HardhatEthersSigner;
  alice: HardhatEthersSigner;
  bob: HardhatEthersSigner;
};

async function deployFixture() {
  const tokenFactory = await ethers.getContractFactory("ERC7984ETH");
  const token = await tokenFactory.deploy();
  const tokenAddress = await token.getAddress();

  const fundraisingFactory = (await ethers.getContractFactory(
    "ConfidentialFundraising",
  )) as ConfidentialFundraising__factory;
  const fundraising = (await fundraisingFactory.deploy(tokenAddress)) as ConfidentialFundraising;
  const fundraisingAddress = await fundraising.getAddress();

  return { fundraising, fundraisingAddress };
}

describe("ConfidentialFundraising", function () {
  let signers: Signers;
  let fundraising: ConfidentialFundraising;
  let fundraisingAddress: string;

  before(async function () {
    const ethSigners = await ethers.getSigners();
    signers = { deployer: ethSigners[0], alice: ethSigners[1], bob: ethSigners[2] };
  });

  beforeEach(async function () {
    if (!fhevm.isMock) {
      console.warn("This hardhat test suite cannot run on Sepolia Testnet");
      this.skip();
    }

    ({ fundraising, fundraisingAddress } = await deployFixture());
  });

  it("stores campaign metadata", async function () {
    const goal = 1_000_000n;
    const title = "Save The Ocean";
    const description = "Funding coral reef restoration";

    const tx = await fundraising.createCampaign(title, description, goal);
    await tx.wait();

    const count = await fundraising.getCampaignCount();
    expect(count).to.equal(1);

    const campaign = await fundraising.getCampaign(0);
    expect(campaign.id).to.equal(0);
    expect(campaign.creator).to.equal(signers.deployer.address);
    expect(campaign.title).to.equal(title);
    expect(campaign.description).to.equal(description);
    expect(campaign.goal).to.equal(goal);
    expect(campaign.active).to.equal(true);
  });

  it("restricts status updates to campaign creators", async function () {
    await fundraising.createCampaign("Animals", "Wildlife rescue", 800_000n);

    await expect(fundraising.connect(signers.alice).setCampaignActive(0, false))
      .to.be.revertedWithCustomError(fundraising, "Unauthorized")
      .withArgs(signers.alice.address);

    await fundraising.setCampaignActive(0, false);
    let campaign = await fundraising.getCampaign(0);
    expect(campaign.active).to.equal(false);

    await fundraising.setCampaignActive(0, true);
    campaign = await fundraising.getCampaign(0);
    expect(campaign.active).to.equal(true);
  });
});
