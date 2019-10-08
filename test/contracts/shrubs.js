const BN = require('bn.js');
const chai = require('chai');

const crypto = require('crypto');
const fs = require('fs');
const del = require('del');
const path = require('path');

const snarkjs = require('snarkjs');
const circomlib = require('circomlib');

const ethers = require('ethers');

const bigInt = snarkjs.bigInt;

const mimcsponge = circomlib.mimcsponge;

const assert = chai.assert;

const ShrubsMiMC = artifacts.require('ShrubsMiMC');
const ShrubsMiMCIncremental = artifacts.require('ShrubsMiMCIncremental');
const ShrubsMiMCShrubs = artifacts.require('ShrubsMiMCShrubs');

const SemaphoreMerkleTree = require('semaphore-merkle-tree')
const MemStorage = SemaphoreMerkleTree.storage.MemStorage
const MerkleTree = SemaphoreMerkleTree.tree.MerkleTree
const MimcSpongeHasher = SemaphoreMerkleTree.hashers.MimcSpongeHasher
const Sha256Hasher = SemaphoreMerkleTree.hashers.Sha256Hasher

async function testTree(hasher, shrubs) {
    const accounts = await web3.eth.getAccounts();

    const default_value = '0';
    const memStorage = new MemStorage();
    const prefix = 'shrubs';

    const memTree = new MerkleTree(
        prefix,
        memStorage,
        hasher,
        20,
        default_value,
    );

    const num_commitments = 16;
    for (let i = 0; i < num_commitments; i++) {
      const commitment = bigInt(`${i}`);
      const receipt = await shrubs.insertCommitment(commitment.toString());
      assert.equal(receipt.logs[0].event, 'LeafAdded');
      console.log(`gas used for commitment ${i}: `, receipt.logs[0].args.gas_used.toString());
      const next_index = parseInt(receipt.logs[0].args.leaf_index.toString());
      await memTree.update(next_index, commitment.toString());
    }

    for (let i = 0; i < num_commitments; i++) {
      const commitment = bigInt(`${i}`);
      const mem_path = await memTree.path(i);
      const path_elements = mem_path.path_elements;
      const receipt = await shrubs.verifyCommitment(commitment.toString(), path_elements, i);
      assert.equal(receipt.logs[0].event, 'LeafVerified');
      console.log(`level for commitment ${i}: `, receipt.logs[0].args.level.toString());
      assert.equal(receipt.logs[0].args.result.toString(), 'true');
    }
}

contract('ShrubsMiMC', function (accounts) {
    it('tests tree normal', async () => {
      const shrubs = await ShrubsMiMC.deployed();
      const MimcSpongeHasher = SemaphoreMerkleTree.hashers.MimcSpongeHasher
      return testTree(new MimcSpongeHasher(), shrubs);
    });
});

contract('ShrubsMiMCIncremental', function (accounts) {
    it('tests tree incremental', async () => {
      const shrubs = await ShrubsMiMCIncremental.deployed();
      const MimcSpongeHasher = SemaphoreMerkleTree.hashers.MimcSpongeHasher
      return testTree(new MimcSpongeHasher(), shrubs);
    });
});

contract('ShrubsMiMCShrubs', function (accounts) {
    it('tests tree shrubs', async () => {
      const shrubs = await ShrubsMiMCShrubs.deployed();
      const MimcSpongeHasher = SemaphoreMerkleTree.hashers.MimcSpongeHasher
      return testTree(new MimcSpongeHasher(), shrubs);
    });
});
