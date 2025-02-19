// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

interface IEIP712Sample {
    // ========================================================
    //                          Event
    // ========================================================

    event MessageVerified(
        address indexed sender,
        uint256 amount,
        string message,
        uint256 nonce
    );

    event TransactionVerified(
        address indexed from,
        address indexed to,
        uint256 value,
        uint256 nonce
    );

    event UserInfoVerified(
        address indexed wallet,
        string username,
        bool isVerified,
        uint256 nonce
    );

    event ComplexDataVerified(
        uint256 timestamp,
        bytes data,
        bool flag,
        uint256 nonce
    );

    // ========================================================
    //                  EXTERNAL WRITE FUNCTIONS
    // ========================================================
    function verify(
        address sender,
        uint256 amount,
        string memory message,
        uint256 nonce,
        bytes memory signature
    ) external returns (bool);

    function verifyTransaction(
        address from,
        address to,
        uint256 value,
        uint256 nonce,
        bytes memory signature
    ) external returns (bool);

    function verifyUserInfo(
        address wallet,
        string memory username,
        bool isVerified,
        uint256 nonce,
        bytes memory signature
    ) external returns (bool);

    function verifyComplexData(
        uint256 timestamp,
        bytes memory data,
        bool flag,
        uint256 nonce,
        bytes memory signature
    ) external returns (bool);
}
