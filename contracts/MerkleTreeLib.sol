pragma solidity ^0.5.0;

library MiMC {
    function MiMCSponge(uint256 in_xL, uint256 in_xR, uint256 in_k)  pure public returns (uint256 xL, uint256 xR);
}

contract ShrubsTree {
    uint8 levels;
    // 0 = mimcsponge, 1 = sha256
    uint8 hasher;
    // 0 = shrubs, 1 = only on filled, 2 = always
    uint8 mode;

    uint256 root;
    uint256[] filled_subtrees;
    uint256[] zeros;

    uint32 next_index;

    uint256[] internal tree_leaves;

    event LeafAdded(uint256 leaf, uint32 leaf_index, uint256 gas_used, uint256 new_val);
    event LeafVerified(uint256 leaf, uint32 leaf_index, uint8 level, bool result);

    constructor(uint8 tree_levels, uint8 hasher_type, uint8 mode_type, uint256 zero_value) public {
        levels = tree_levels;
        hasher = hasher_type;
        mode = mode_type;

        zeros.push(zero_value);

        filled_subtrees.push(zeros[0]);

        for (uint8 i = 1; i < tree_levels; i++) {
            zeros.push(HashLeftRight(zeros[i-1], zeros[i-1]));
            filled_subtrees.push(zeros[i]);
        }

        if (mode > 0) {
          root = HashLeftRight(zeros[levels - 1], zeros[levels - 1]);
        }

        next_index = 0;
    }

    function HashLeftRight(uint256 left, uint256 right) public returns (uint256 hash) {
        if (hasher == 0) {
          uint256 k =  21888242871839275222246405745257275088548364400416034343698204186575808495617;
          uint256 R = 0;
          uint256 C = 0;

          R = addmod(R, left, k);
          (R, C) = MiMC.MiMCSponge(R, C, 0);

          R = addmod(R, right, k);
          (R, C) = MiMC.MiMCSponge(R, C, 0);

          hash = R;
        } else {
          hash = uint256(sha256(abi.encodePacked(uint256(left), uint256(right))));
        }
    }

    function insert(uint256 leaf) internal {
        uint256 start_gas = gasleft();

        uint32 leaf_index = next_index;
        uint32 current_index = next_index;
        next_index += 1;

        uint256 current_level_hash = leaf;
        uint256 left;
        uint256 right;

        bool all_were_right = true;
        for (uint8 i = 0; i < levels; i++) {
            if (current_index % 2 == 0) {
                left = current_level_hash;
                right = zeros[i];

                if (mode != 1 || (mode == 1 && all_were_right)) {
                  filled_subtrees[i] = current_level_hash;
                }
                all_were_right = false;
                if (mode == 0) {
                  break;
                }
            } else {
                left = filled_subtrees[i];
                right = current_level_hash;
            }

            current_level_hash = HashLeftRight(left, right);

            current_index /= 2;
        }

        if (mode > 0) {
          root = current_level_hash;
        }

        tree_leaves.push(leaf);
        uint256 gas_used = start_gas - gasleft();

        emit LeafAdded(leaf, leaf_index, gas_used, current_level_hash);
    }

    function verify(uint256 leaf, uint256[] memory path, uint32 leaf_index) internal {
      uint32 current_index = leaf_index;
      uint256 current_level_hash = leaf;
      uint256 left;
      uint256 right;
      for (uint8 i = 0; i < levels; i++) {
        if (mode == 0 && filled_subtrees[i] == current_level_hash) {
          emit LeafVerified(leaf, leaf_index, i, true);
          return;
        }
        if (current_index % 2 == 0) {
          left = current_level_hash;
          right = path[i];
        } else {
          left = path[i];
          right = current_level_hash;
        }

        current_level_hash = HashLeftRight(left, right);

        current_index /= 2;
      }

      emit LeafVerified(leaf, leaf_index, levels, root == current_level_hash);
    }
}
