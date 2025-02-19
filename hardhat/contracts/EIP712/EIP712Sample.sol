// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {EIP712} from "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {SignatureChecker} from "@openzeppelin/contracts/utils/cryptography/SignatureChecker.sol";
import {IEIP712Sample} from "./interfaces/IEIP712Sample.sol";

contract EIP712Contract is EIP712, IEIP712Sample {
    using ECDSA for bytes32;

    bytes32 private constant MESSAGE_TYPEHASH =
        keccak256(
            "Message(address sender,uint256 amount,string message,uint256 nonce)"
        );
    bytes32 private constant TRANSACTION_TYPEHASH =
        keccak256(
            "Transaction(address from,address to,uint256 value,uint256 nonce)"
        );
    bytes32 private constant USERINFO_TYPEHASH =
        keccak256(
            "UserInfo(address wallet,string username,bool isVerified,uint256 nonce)"
        );
    bytes32 private constant COMPLEXDATA_TYPEHASH =
        keccak256(
            "ComplexData(uint256 timestamp,bytes data,bool flag,uint256 nonce)"
        );

    mapping(address => uint256) public nonces;

    constructor() EIP712("EIP712Demo", "1") {}

    function verify(
        address sender,
        uint256 amount,
        string memory message,
        uint256 nonce,
        bytes memory signature
    ) public override returns (bool) {
        require(nonce == nonces[sender], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                MESSAGE_TYPEHASH,
                sender,
                amount,
                keccak256(bytes(message)),
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        require(recovered == sender, "Invalid signature");

        nonces[sender] += 1;
        emit MessageVerified(sender, amount, message, nonce);
        return true;
    }

    function verifyTransaction(
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        bytes memory signature
    ) public override returns (bool) {
        require(nonce == nonces[from], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(TRANSACTION_TYPEHASH, from, to, value, nonce)
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        require(recovered == from, "Invalid signature");

        nonces[from] += 1;
        emit TransactionVerified(from, to, value, nonce);
        return true;
    }

    function verifyUserInfo(
        address wallet,
        string memory username,
        bool isVerified,
        uint256 nonce,
        bytes memory signature
    ) public override returns (bool) {
        require(nonce == nonces[wallet], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                USERINFO_TYPEHASH,
                wallet,
                keccak256(bytes(username)),
                isVerified,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        require(recovered == wallet, "Invalid signature");

        nonces[wallet] += 1;
        emit UserInfoVerified(wallet, username, isVerified, nonce);
        return true;
    }

    function verifyComplexData(
        uint256 timestamp,
        bytes memory data,
        bool flag,
        uint256 nonce,
        bytes memory signature
    ) public override returns (bool) {
        require(nonce == nonces[msg.sender], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                COMPLEXDATA_TYPEHASH,
                timestamp,
                keccak256(data),
                flag,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address recovered = digest.recover(signature);
        require(recovered == msg.sender, "Invalid signature");

        // **nonceを更新**
        nonces[msg.sender] += 1;

        emit ComplexDataVerified(timestamp, data, flag, nonce);
        return true;
    }

    function verifyDelegation(
        address delegator,
        address delegatee,
        uint256 expiration,
        uint256 nonce,
        bytes memory signature
    ) public returns (bool) {
        require(nonce == nonces[delegator], "Invalid nonce");

        bytes32 structHash = keccak256(
            abi.encode(
                keccak256(
                    "Delegation(address delegator,address delegatee,uint256 expiration,uint256 nonce)"
                ),
                delegator,
                delegatee,
                expiration,
                nonce
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        require(
            SignatureChecker.isValidSignatureNow(delegator, digest, signature),
            "Invalid signature"
        );

        nonces[delegator] += 1;
        emit DelegationVerified(delegator, delegatee, expiration, nonce);
        return true;
    }

    event DelegationVerified(
        address indexed delegator,
        address indexed delegatee,
        uint256 expiration,
        uint256 nonce
    );
}
