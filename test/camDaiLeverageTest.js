const { expect } = require("chai");

describe("camDaiLeverage", function () {

    let DAIAddr = "0x8f3Cf7ad23Cd3CaDbD9735AFf958023239c6A063";
    let MAIAddr = "0xa3Fa99A148fA48D14Ed51d610c367C61876997F1";
    let amDAIAddr = "0x27F8D03b3a2196956ED754baDc28D73be8830A6e";
    let camDAIAddr = "0xE6C23289Ba5A9F0Ef31b8EB36241D5c800889b7b";
    let VaultAddr = "0xD2FE44055b5C874feE029119f70336447c8e8827";
    let DAIWhaleAddr = "0x5a08B7D899b9B54f4f0Bb2C1DC62eD031aedC6D1";
    let MAIWhaleAddr = "0x25864a712C80d33Ba1ad7c23CffA18b46F2fc00c";

    before(async function () {
        //Deploy
        this.timeout(60000000);

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [DAIWhaleAddr],
        });

        await hre.network.provider.request({
            method: "hardhat_impersonateAccount",
            params: [MAIWhaleAddr],
        });

        [this.account, this.anotherAccount] = await ethers.getSigners();
        this.DAIWhaleSigner = await ethers.getSigner(DAIWhaleAddr);
        this.MAIWhaleSigner = await ethers.getSigner(MAIWhaleAddr);

        this.LeverageFactory = await ethers.getContractFactory("LeverageFactory");
        this.leverageFactory = await this.LeverageFactory.deploy();
        await this.leverageFactory.deployed();

        this.camDaiLeverage = await ethers.getContractFactory("camDaiLeverage");

        this.gERC20 = await ethers.getContractFactory("simpleErc20");
        await this.gERC20.attach(DAIAddr).connect(this.DAIWhaleSigner).transfer(this.account.address, ethers.utils.parseUnits("1000"));
        await this.gERC20.attach(DAIAddr).connect(this.DAIWhaleSigner).transfer(this.anotherAccount.address, ethers.utils.parseUnits("1000"));

        //Increasing debt ceiling
        await this.gERC20.attach(MAIAddr).connect(this.MAIWhaleSigner).transfer(VaultAddr, ethers.utils.parseUnits("50000"));
    });

    async function getbalances(context, camDaiLeverageAddr) {
        console.log("\tamDAI balance: ", ethers.utils.formatUnits(await context.gERC20.attach(amDAIAddr).balanceOf(camDaiLeverageAddr)));
        console.log("\tcamDAI balance: ", ethers.utils.formatUnits(await context.gERC20.attach(camDAIAddr).balanceOf(camDaiLeverageAddr)));
        console.log("\tMAI balance: ", ethers.utils.formatUnits(await context.gERC20.attach(MAIAddr).balanceOf(camDaiLeverageAddr)));
        console.log("\tDAI balance: ", ethers.utils.formatUnits(await context.gERC20.attach(DAIAddr).balanceOf(camDaiLeverageAddr)));
        console.log("\tDAI balance (owner): ", ethers.utils.formatUnits(await context.gERC20.attach(DAIAddr).balanceOf(context.account.address)));
        console.log("\tMAI balance (owner): ", ethers.utils.formatUnits(await context.gERC20.attach(MAIAddr).balanceOf(context.account.address)));
        console.log("\tCollateral balance: ", ethers.utils.formatUnits(await context.camDaiLeverage.attach(camDaiLeverageAddr).getVaultCollateral()));
        console.log("\tDebt balance: ", ethers.utils.formatUnits(await context.camDaiLeverage.attach(camDaiLeverageAddr).getVaultDebt()));
        console.log("\tCollateral percentage: ", ethers.utils.formatUnits(await context.camDaiLeverage.attach(camDaiLeverageAddr).getCollateralPercentage(), "wei"));
    }

    it("Should create from factory successfully, with `account`...", async function () {
        await this.leverageFactory.connect(this.account).createNew();
        this.contractAddress = await this.leverageFactory.connect(this.account).getContractAddresses(this.account.address);
    });

    it("Do rulo, with `account`...", async function () {
        this.timeout(60000000);
        let toDeposit = ethers.utils.parseUnits("1000");
        await this.gERC20.attach(DAIAddr).connect(this.account).approve(this.contractAddress[0], toDeposit);

        await this.camDaiLeverage.attach(this.contractAddress[0]).connect(this.account).doRulo(toDeposit);
        await getbalances(this, this.contractAddress[0]);
    });

    it("Undo rulo, with `account`...", async function () {
        this.timeout(60000000);
        await this.camDaiLeverage.attach(this.contractAddress[0]).connect(this.account).undoRulo();
        await getbalances(this, this.contractAddress[0]);
    });

    it("Should create from factory again successfully, with `account`...", async function () {
        await this.leverageFactory.connect(this.account).createNew();
        let newContractAddressArr = await this.leverageFactory.connect(this.account).getContractAddresses(this.account.address);
        expect(newContractAddressArr.length).greaterThan(this.contractAddress.length);
    });

    it("Should create from factory successfully, with `anotherAccount`...", async function () {
        await this.leverageFactory.connect(this.anotherAccount).createNew();
        this.contractAddress = await this.leverageFactory.connect(this.anotherAccount).getContractAddresses(this.anotherAccount.address);
    });

    it("Do rulo, with `anotherAccount`...", async function () {
        this.timeout(60000000);
        let toDeposit = ethers.utils.parseUnits("1000");
        await this.gERC20.attach(DAIAddr).connect(this.anotherAccount).approve(this.contractAddress[0], toDeposit);

        await this.camDaiLeverage.attach(this.contractAddress[0]).connect(this.anotherAccount).doRulo(toDeposit);
    });

    it("Undo rulo, with `anotherAccount`...", async function () {
        this.timeout(60000000);
        await this.camDaiLeverage.attach(this.contractAddress[0]).connect(this.anotherAccount).undoRulo();
    });

    it("Should create from factory again successfully, with `anotherAccount`...", async function () {
        await this.leverageFactory.connect(this.anotherAccount).createNew();
        let newContractAddressArr = await this.leverageFactory.connect(this.anotherAccount).getContractAddresses(this.anotherAccount.address);
        expect(newContractAddressArr.length).greaterThan(this.contractAddress.length);
    });

});