import { assert } from "chai"
import { ethers, getNamedAccounts, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"

developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe Staging Tests", function () {
      let deployer
      let fundMe: any
      const sendValue = ethers.utils.parseEther("0.1")
      beforeEach(async () => {
        deployer = (await getNamedAccounts()).deployer
        fundMe = await ethers.getContract("FundMe", deployer)
      })

      it("Allows people to fund and withdraw", async () => {
        await fundMe.fund({ value: sendValue })
        await fundMe.withdraw()
        const endingBalance = await fundMe.provider.getBalance(fundMe.address)
        assert.equal(endingBalance.toString(), "0")
      })
    })
