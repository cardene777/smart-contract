import { expect } from "chai";
import { ethers } from "hardhat";
import { Create2Factory } from "../types";

describe("Create2Factory", function () {
  let factory: Create2Factory;
  let owner: any;
  let otherAccount: any;
  let salt: string;
  let bytecode: string;

  beforeEach(async function () {
    [owner, otherAccount] = await ethers.getSigners();

    // Create2Factoryをデプロイ
    const Factory = await ethers.getContractFactory("Create2Factory");
    factory = await Factory.deploy();
    await factory.waitForDeployment();

    // SampleContract のバイトコードと constructor 引数をエンコード
    const SampleContract = await ethers.getContractFactory("SampleContract");
    const constructorArgs = ["Hello, World!"]; // ここにデプロイ時の引数を設定
    bytecode = ethers.concat([
      SampleContract.bytecode,
      SampleContract.interface.encodeDeploy(constructorArgs), // Constructor 引数をエンコード
    ]);

    // 固定のsalt（任意の値）
    salt = ethers.keccak256(ethers.toUtf8Bytes("test_salt"));
  });

  it("should deploy a contract using CREATE2", async function () {
    const predictedAddress = await factory.computeAddress(salt, bytecode);
    
    // すでにアドレスにコードが存在していないか確認
    const code = await ethers.provider.getCode(predictedAddress);
    expect(code).to.equal("0x");

    // CREATE2を使用してデプロイ
    const tx = await factory.deploy(salt, bytecode);
    await expect(tx)
      .to.emit(factory, "ContractDeployed")
      .withArgs(predictedAddress, salt);

    // デプロイされたコントラクトの `getMessage()` を確認
    const sampleContract = await ethers.getContractAt(
      "SampleContract",
      predictedAddress
    );
    expect(await sampleContract.getMessage()).to.equal("Hello, World!");
    expect(await sampleContract.getAddress()).to.equal(predictedAddress);
  });

  it("should revert when deploying with empty bytecode", async function () {
    await expect(factory.deploy(salt, "0x")).to.be.revertedWith(
      "Bytecode cannot be empty"
    );
  });

  it("should correctly compute the deployment address", async function () {
    const computedAddress = await factory.computeAddress(salt, bytecode);
    const FactoryAddress = await factory.getAddress();

    const expectedAddress = ethers.getCreate2Address(
      FactoryAddress,
      salt,
      ethers.keccak256(bytecode)
    );

    expect(computedAddress).to.equal(expectedAddress);
  });

  it("should receive ETH correctly", async function () {
    // 1 ETH 送信
    const sendAmount = ethers.parseEther("1");
    await owner.sendTransaction({
      to: await factory.getAddress(),
      value: sendAmount,
    });

    // コントラクトの残高確認
    const balance = await ethers.provider.getBalance(
      await factory.getAddress()
    );
    expect(balance).to.equal(sendAmount);
  });
});
