import { assert, expect } from "chai"
import { deployments, ethers, network } from "hardhat"
import { developmentChains } from "../../helper-hardhat-config"
import { FundMe, MockV3Aggregator } from "../../typechain-types"
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers"

!developmentChains.includes(network.name)
  ? describe.skip
  : describe("FundMe", () => {
      let fundMe: FundMe
      let deployer: SignerWithAddress
      let mockV3Aggregator: MockV3Aggregator
      const sendValue = ethers.utils.parseEther("1")
      beforeEach(async () => {
        // A way to get accounts (using config):
        // const accounts = await ethers.getSigners()
        // const accountZero = accounts[0]
        const accounts = await ethers.getSigners()
        deployer = accounts[0]
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
          "MockV3Aggregator",
          deployer
        )
      })
      describe("Constructor", async () => {
        it("Sets the aggregator addresses correctly", async () => {
          const response = await fundMe.getPriceFeed()
          assert.equal(response, mockV3Aggregator.address)
        })
      })

      describe("Fund", () => {
        it("Fails if you don't send enough ETH", async () => {
          await expect(fundMe.fund()).to.be.revertedWith(
            "You need to spend more ETH!"
          ) // Need to make work with revert
        })
        it("Updates the amount funded data structure", async () => {
          await fundMe.fund({ value: sendValue })
          const response = await fundMe.getAddressToAmountFunded(
            deployer.address
          )
          assert.equal(response.toString(), sendValue.toString())
        })
        it("Adds funder to array of funders", async () => {
          await fundMe.fund({ value: sendValue })
          const funder = await fundMe.getFunders(0)
          assert.equal(funder, deployer.address)
        })
      })

      // Need to figure out receive and fallback

      describe("Withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single funder", async () => {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )

          // Act
          const transactionReponse = await fundMe.withdraw()
          const transactionReceipt = await transactionReponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance: any = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )

          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })
        it("Allows us to withdraw with multiple funders", async () => {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i <= fundMe.getFunders.length; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )
          // Act
          const transactionReponse = await fundMe.withdraw()
          const transactionReceipt = await transactionReponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance: any = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
          await expect(fundMe.getFunders(0)).to.be.reverted

          for (let i = 1; i < fundMe.getFunders.length; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const fundMeConnectedContract = fundMe.connect(accounts[1])
          await expect(fundMeConnectedContract.withdraw()).to.be.revertedWith(
            "FundMe__NotOwner"
          )
        })
      })

      describe("Cheaper Withdraw", () => {
        beforeEach(async () => {
          await fundMe.fund({ value: sendValue })
        })
        it("Withdraw ETH from a single funder", async () => {
          // Arrange
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )

          // Act
          const transactionReponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionReponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance: any = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )

          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
        })
        it("Allows us to withdraw with multiple funders", async () => {
          // Arrange
          const accounts = await ethers.getSigners()
          for (let i = 1; i <= fundMe.getFunders.length; i++) {
            const fundMeConnectedContract = fundMe.connect(accounts[i])
            await fundMeConnectedContract.fund({ value: sendValue })
          }
          const startingFundMeBalance = await fundMe.provider.getBalance(
            fundMe.address
          )
          const startingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )
          // Act
          const transactionReponse = await fundMe.cheaperWithdraw()
          const transactionReceipt = await transactionReponse.wait(1)

          const { gasUsed, effectiveGasPrice } = transactionReceipt
          const gasCost = gasUsed.mul(effectiveGasPrice)

          const endingFundMeBalance: any = await fundMe.provider.getBalance(
            fundMe.address
          )
          const endingDeployerBalance = await fundMe.provider.getBalance(
            deployer.address
          )
          // Assert
          assert.equal(endingFundMeBalance, 0)
          assert.equal(
            startingFundMeBalance.add(startingDeployerBalance).toString(),
            endingDeployerBalance.add(gasCost).toString()
          )
          await expect(fundMe.getFunders(0)).to.be.reverted

          for (let i = 1; i < fundMe.getFunders.length; i++) {
            assert.equal(
              await fundMe.getAddressToAmountFunded(accounts[i].address),
              0
            )
          }
        })
        it("Only allows the owner to withdraw", async () => {
          const accounts = await ethers.getSigners()
          const fundMeConnectedContract = fundMe.connect(accounts[1])
          await expect(
            fundMeConnectedContract.cheaperWithdraw()
          ).to.be.revertedWith("FundMe__NotOwner")
        })
      })
    })
