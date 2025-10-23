import * as dotenv from "dotenv";
import type { DeployFunction } from "hardhat-deploy/types";
import type { HardhatRuntimeEnvironment } from "hardhat/types";

dotenv.config();

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployments, getNamedAccounts } = hre;
  const { deploy, log } = deployments;
  const { deployer } = await getNamedAccounts();

  log(`Deployer: ${deployer}`);
  log(`INFURA key configured: ${process.env.INFURA_API_KEY ? "yes" : "no"}`);

  const tokenDeployment = await deploy("ERC7984ETH", {
    from: deployer,
    log: true,
  });

  const fundraisingDeployment = await deploy("ConfidentialFundraising", {
    from: deployer,
    args: [tokenDeployment.address],
    log: true,
  });

  log(`ConfidentialFundraising deployed at ${fundraisingDeployment.address}`);
  log(`ERC7984ETH deployed at ${tokenDeployment.address}`);
};

export default func;
func.id = "deploy_confidential_fundraising";
func.tags = ["Fundraising"];
