// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/**
 * @title Create2Factory
 * @dev This contract allows deploying contracts using the CREATE2 opcode.
 *      It supports deterministic deployment, making it possible to predict
 *      the contract's address before deployment.
 */
contract Create2Factory {
    event ContractDeployed(
        address indexed contractAddress,
        bytes32 indexed salt
    );

    /**
     * @dev Deploys a contract using CREATE2 with a given bytecode and constructor arguments.
     * @param salt A unique salt to determine the deployed address.
     * @param bytecode The contract creation bytecode (including constructor arguments).
     * @return deployedAddress The address of the deployed contract.
     */
    function deploy(
        bytes32 salt,
        bytes memory bytecode
    ) external payable returns (address deployedAddress) {
        require(bytecode.length > 0, "Bytecode cannot be empty");

        assembly {
            deployedAddress := create2(
                callvalue(),
                add(bytecode, 0x20),
                mload(bytecode),
                salt
            )
            if iszero(deployedAddress) {
                revert(0, 0)
            }
            if iszero(extcodesize(deployedAddress)) {
                revert(0, 0)
            }
        }
        require(
            deployedAddress != address(0),
            "CREATE2: Failed to deploy contract"
        );

        emit ContractDeployed(deployedAddress, salt);
    }

    /**
     * @dev Computes the contract address before deployment.
     * @param salt A unique salt to determine the deployed address.
     * @param bytecode The contract creation bytecode.
     * @return predictedAddress The predicted address of the contract.
     */
    function computeAddress(
        bytes32 salt,
        bytes memory bytecode
    ) external view returns (address predictedAddress) {
        bytes32 bytecodeHash = keccak256(bytecode);
        predictedAddress = address(
            uint160(
                uint256(
                    keccak256(
                        abi.encodePacked(
                            bytes1(0xff),
                            address(this),
                            salt,
                            bytecodeHash
                        )
                    )
                )
            )
        );
    }

    /**
     * @dev Enables the contract to receive Ether to support payable contract deployment.
     */
    receive() external payable {}
}
