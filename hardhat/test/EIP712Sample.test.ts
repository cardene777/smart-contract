import { expect } from "chai";
import hre from "hardhat";
import { EIP712Contract } from "../types";
import { Signer } from "ethers";

describe("EIP712Contract", function () {
  let contract: EIP712Contract;
  let owner: Signer;
  let otherAccount: Signer;

  const domain = {
    name: "EIP712Demo",
    version: "1",
    chainId: 31337, // Hardhat network default
    verifyingContract: "",
  };

  const messageTypes = {
    Message: [
      { name: "sender", type: "address" },
      { name: "amount", type: "uint256" },
      { name: "message", type: "string" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const transactionTypes = {
    Transaction: [
      { name: "from", type: "address" },
      { name: "to", type: "address" },
      { name: "value", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const userInfoTypes = {
    UserInfo: [
      { name: "wallet", type: "address" },
      { name: "username", type: "string" },
      { name: "isVerified", type: "bool" },
      { name: "nonce", type: "uint256" },
    ],
  };

  const delegationTypes = {
    Delegation: [
      { name: "delegator", type: "address" },
      { name: "delegatee", type: "address" },
      { name: "expiration", type: "uint256" },
      { name: "nonce", type: "uint256" },
    ],
  };

  beforeEach(async function () {
    const signers = await hre.ethers.getSigners();
    owner = signers[0];
    otherAccount = signers[1];

    const EIP712Factory = await hre.ethers.getContractFactory("EIP712Contract");
    contract = await EIP712Factory.deploy();

    domain.verifyingContract = await contract.getAddress();
  });

  it("should verify a valid signed message", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const message = {
      sender: await owner.getAddress(),
      amount: hre.ethers.parseEther("1"),
      message: "Hello, EIP712!",
      nonce: Number(nonce),
    };

    const signature = await owner.signTypedData(domain, messageTypes, message);
    const tx = await contract.verify(
      message.sender,
      message.amount,
      message.message,
      message.nonce,
      signature
    );

    await expect(tx)
      .to.emit(contract, "MessageVerified")
      .withArgs(
        await owner.getAddress(),
        message.amount,
        message.message,
        message.nonce
      );
  });

  it("should verify a valid transaction", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const transaction = {
      from: await owner.getAddress(),
      to: await otherAccount.getAddress(),
      value: hre.ethers.parseEther("1"),
      nonce: Number(nonce),
    };

    const signature = await owner.signTypedData(
      domain,
      transactionTypes,
      transaction
    );
    const tx = await contract.verifyTransaction(
      transaction.from,
      transaction.to,
      transaction.value,
      transaction.nonce,
      signature
    );

    await expect(tx)
      .to.emit(contract, "TransactionVerified")
      .withArgs(
        transaction.from,
        transaction.to,
        transaction.value,
        transaction.nonce
      );
  });

  it("should verify valid user info", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const userInfo = {
      wallet: await owner.getAddress(),
      username: "TestUser",
      isVerified: true,
      nonce: Number(nonce),
    };

    const signature = await owner.signTypedData(
      domain,
      userInfoTypes,
      userInfo
    );
    const tx = await contract.verifyUserInfo(
      userInfo.wallet,
      userInfo.username,
      userInfo.isVerified,
      userInfo.nonce,
      signature
    );

    await expect(tx)
      .to.emit(contract, "UserInfoVerified")
      .withArgs(
        userInfo.wallet,
        userInfo.username,
        userInfo.isVerified,
        userInfo.nonce
      );
  });

  it("should fail with an invalid signature", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const message = {
      sender: await owner.getAddress(),
      amount: hre.ethers.parseEther("1"),
      message: "Invalid signature test",
      nonce: Number(nonce),
    };

    const fakeSignature = await otherAccount.signTypedData(
      domain,
      messageTypes,
      message
    );
    await expect(
      contract.verify(
        message.sender,
        message.amount,
        message.message,
        message.nonce,
        fakeSignature
      )
    ).to.be.revertedWith("Invalid signature");
  });

  it("should fail with an incorrect nonce", async function () {
    const nonce = Number(await contract.nonces(await owner.getAddress())) + 1;
    const message = {
      sender: await owner.getAddress(),
      amount: hre.ethers.parseEther("1"),
      message: "Wrong nonce test",
      nonce: nonce,
    };

    const signature = await owner.signTypedData(domain, messageTypes, message);
    await expect(
      contract.verify(
        message.sender,
        message.amount,
        message.message,
        message.nonce,
        signature
      )
    ).to.be.revertedWith("Invalid nonce");
  });

  it("should verify a valid delegation", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const delegation = {
      delegator: await owner.getAddress(),
      delegatee: await otherAccount.getAddress(),
      expiration: Math.floor(Date.now() / 1000) + 3600,
      nonce: Number(nonce),
    };

    const signature = await owner.signTypedData(
      domain,
      delegationTypes,
      delegation
    );
    const tx = await contract.verifyDelegation(
      delegation.delegator,
      delegation.delegatee,
      delegation.expiration,
      delegation.nonce,
      signature
    );

    await expect(tx)
      .to.emit(contract, "DelegationVerified")
      .withArgs(
        delegation.delegator,
        delegation.delegatee,
        delegation.expiration,
        delegation.nonce
      );
  });

  it("should fail with an invalid delegation signature", async function () {
    const nonce = await contract.nonces(await owner.getAddress());
    const delegation = {
      delegator: await owner.getAddress(),
      delegatee: await otherAccount.getAddress(),
      expiration: Math.floor(Date.now() / 1000) + 3600,
      nonce: Number(nonce),
    };

    const fakeSignature = await otherAccount.signTypedData(
      domain,
      delegationTypes,
      delegation
    );
    await expect(
      contract.verifyDelegation(
        delegation.delegator,
        delegation.delegatee,
        delegation.expiration,
        delegation.nonce,
        fakeSignature
      )
    ).to.be.revertedWith("Invalid signature");
  });

  it("should fail with an incorrect nonce for delegation", async function () {
    const nonce = Number(await contract.nonces(await owner.getAddress())) + 1;
    const delegation = {
      delegator: await owner.getAddress(),
      delegatee: await otherAccount.getAddress(),
      expiration: Math.floor(Date.now() / 1000) + 3600,
      nonce: nonce,
    };

    const signature = await owner.signTypedData(
      domain,
      delegationTypes,
      delegation
    );
    await expect(
      contract.verifyDelegation(
        delegation.delegator,
        delegation.delegatee,
        delegation.expiration,
        delegation.nonce,
        signature
      )
    ).to.be.revertedWith("Invalid nonce");
  });
});
