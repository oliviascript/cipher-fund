import { FhevmType } from "@fhevm/hardhat-plugin";
import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:addresses", "Prints deployed fundraising and token addresses").setAction(async (_args, hre) => {
  const { deployments } = hre;
  const fundraising = await deployments.get("ConfidentialFundraising");
  const token = await deployments.get("ERC7984ETH");

  console.log(`ConfidentialFundraising: ${fundraising.address}`);
  console.log(`ERC7984ETH: ${token.address}`);
});

task("task:create-campaign", "Creates a new fundraising campaign")
  .addParam("title", "Campaign title")
  .addParam("description", "Campaign description")
  .addParam("goal", "Goal amount in cETH smallest units")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments } = hre;
    const fundraisingDeployment = await deployments.get("ConfidentialFundraising");
    const fundraising = await ethers.getContractAt("ConfidentialFundraising", fundraisingDeployment.address);

    const goalBigInt = BigInt(taskArguments.goal);
    const tx = await fundraising.createCampaign(taskArguments.title, taskArguments.description, goalBigInt);
    console.log(`Creating campaign... tx: ${tx.hash}`);
    const receipt = await tx.wait();
    console.log(`Campaign created (status: ${receipt?.status})`);
  });

task("task:decrypt-raised", "Decrypts total raised amount for a campaign")
  .addParam("campaignId", "Campaign identifier")
  .addOptionalParam("address", "Optional fundraising contract address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const campaignId = Number(taskArguments.campaignId);
    const deployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("ConfidentialFundraising");

    const [signer] = await ethers.getSigners();
    const contract = await ethers.getContractAt("ConfidentialFundraising", deployment.address);
    const encryptedRaised = await contract.getCampaignRaised(campaignId);

    const decrypted = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedRaised,
      deployment.address,
      signer,
    );

    console.log(`Campaign #${campaignId} raised: ${decrypted.toString()} (cETH base units)`);
  });

task("task:decrypt-points", "Decrypts user points for a campaign")
  .addParam("campaignId", "Campaign identifier")
  .addOptionalParam("user", "User address (defaults to first signer)")
  .addOptionalParam("address", "Optional fundraising contract address")
  .setAction(async (taskArguments: TaskArguments, hre) => {
    const { ethers, deployments, fhevm } = hre;
    await fhevm.initializeCLIApi();

    const campaignId = Number(taskArguments.campaignId);
    const deployment = taskArguments.address
      ? { address: taskArguments.address as string }
      : await deployments.get("ConfidentialFundraising");

    const [defaultSigner] = await ethers.getSigners();
    const targetUser = (taskArguments.user as string | undefined) ?? defaultSigner.address;
    const signer = await ethers.getSigner(targetUser);

    const contract = await ethers.getContractAt("ConfidentialFundraising", deployment.address);
    const encryptedPoints = await contract.getUserPoints(campaignId, targetUser);

    const decrypted = await fhevm.userDecryptEuint(
      FhevmType.euint64,
      encryptedPoints,
      deployment.address,
      signer,
    );

    console.log(`User ${targetUser} has ${decrypted.toString()} points in campaign #${campaignId}`);
  });
