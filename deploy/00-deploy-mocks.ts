import { DeployFunction } from "hardhat-deploy/types"
import { HardhatRuntimeEnvironment } from "hardhat/types"

const DECIMALS = "18"
const INITIAL_ANSWER = "2000000000000000000000" // 2000

const deployMocks: DeployFunction = async function (
  hre: HardhatRuntimeEnvironment
) {
  const { getNamedAccounts, deployments, network } = hre
  const { deploy, log } = deployments
  const { deployer } = await getNamedAccounts()
  const chainId = network.config.chainId

  if (chainId === 31337) {
    log("Local network detected, deploying mocks")
    await deploy("MockV3Aggregator", {
      contract: "MockV3Aggregator",
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    })
    log("Mocks Deployed")
    log("--------------------------------")
  }
}

export default deployMocks
deployMocks.tags = ["all", "mocks"]
