pragma solidity ^0.5.0;

import "./MerkleTreeLib.sol";

contract ShrubsMiMC is ShrubsTree {
    constructor(uint8 tree_levels, uint256 zero_value) ShrubsTree(tree_levels, 0, 2, 0) public {
    }

    function insertCommitment(uint256 commitment) public {
        insert(commitment);
    }

    function verifyCommitment(uint256 commitment, uint256[] memory path, uint32 leaf_index) public {
        verify(commitment, path, leaf_index);
    }

}
