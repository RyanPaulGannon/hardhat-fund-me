import { ethers, getNamedAccounts } from "hardhat"

async function main() {
  const { deployer } = await getNamedAccounts()
  const fundMe = await ethers.getContract("FundMe", deployer)
  console.log("Funding ...")
  const transactionResponse = await fundMe.withdraw()
  await transactionResponse.wait(1)
  console.log("Got it back!")
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
