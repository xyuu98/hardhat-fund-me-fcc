const { assert, expect } = require("chai")
const { deployments, ethers, getNamedAccounts } = require("hardhat")

describe("FundMe", async () => {
    let fundMe
    let deployer
    let mockV3Aggregator
    const sendValue = ethers.utils.parseEther("1")
    beforeEach(async () => {
        // const accounts = await ethers.getSigner()
        deployer = (await getNamedAccounts()).deployer
        await deployments.fixture(["all"])
        fundMe = await ethers.getContract("FundMe", deployer)
        mockV3Aggregator = await ethers.getContract(
            "MockV3Aggregator",
            deployer
        )
    })

    describe("constructor", async () => {
        it("set the aggregator address correctly", async () => {
            const response = await fundMe.getPriceFeed()
            assert.equal(response, mockV3Aggregator.address)
        })
    })

    describe("fund", async () => {
        it("Fails if u dont send enough ETH", async () => {
            await expect(fundMe.fund()).to.be.revertedWith(
                "U need to send more ETH!"
            )
        })
        it("updated the amount funded data structure", async () => {
            await fundMe.fund({ value: sendValue })
            const response = await fundMe.getAddressToAmountFunded(deployer)
            assert.equal(response.toString(), sendValue.toString())
        })
        it("Add funder to array funders", async () => {
            await fundMe.fund({ value: sendValue })
            const funder = await fundMe.getFunder(0)
            assert.equal(funder, deployer)
        })
    })

    describe("withdraw", async () => {
        beforeEach(async () => {
            await fundMe.fund({ value: sendValue })
        })

        it("withdraw ETH from a single founder", async () => {
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingDeployerBalance.add(startingFundMeBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it("allows us to withdraw with multiple funders", async () => {
            const accounts = await ethers.getSigners()
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            const transactionResponse = await fundMe.withdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(
                startingDeployerBalance.add(startingFundMeBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )

            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })

        it("Only Owner can withdraw funds", async () => {
            const accounts = ethers.getSigners()
            const attacker = accounts[0]
            const attackerConnectedContract = await fundMe.connect(attacker)
            expect(attackerConnectedContract.withdraw()).to.be.revertedWith(
                "FundMe_notOwner"
            )
        })

        it("withdraw ETH from a single founder (cheaper)", async () => {
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(endingFundMeBalance, 0)
            assert.equal(
                startingDeployerBalance.add(startingFundMeBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )
        })

        it("CheaperWithdraw testing···", async () => {
            const accounts = await ethers.getSigners()
            for (i = 1; i < 6; i++) {
                const fundMeConnectedContract = await fundMe.connect(
                    accounts[i]
                )
                await fundMeConnectedContract.fund({ value: sendValue })
            }
            const startingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const startingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            const transactionResponse = await fundMe.cheaperWithdraw()
            const transactionReceipt = await transactionResponse.wait(1)

            const { gasUsed, effectiveGasPrice } = transactionReceipt
            const gasCost = gasUsed.mul(effectiveGasPrice)

            const endingFundMeBalance = await fundMe.provider.getBalance(
                fundMe.address
            )
            const endingDeployerBalance = await fundMe.provider.getBalance(
                deployer
            )

            assert.equal(
                startingDeployerBalance.add(startingFundMeBalance).toString(),
                endingDeployerBalance.add(gasCost).toString()
            )

            await expect(fundMe.getFunder(0)).to.be.reverted

            for (i = 1; i < 6; i++) {
                assert.equal(
                    await fundMe.getAddressToAmountFunded(accounts[i].address),
                    0
                )
            }
        })
    })
})
