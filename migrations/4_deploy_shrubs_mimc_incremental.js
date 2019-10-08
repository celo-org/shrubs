const MiMC = artifacts.require('MiMC');
const ShrubsMiMCIncremental = artifacts.require('ShrubsMiMCIncremental');

module.exports = function(deployer) {
  return deployer.then( async () =>  {
    await deployer.link(MiMC, ShrubsMiMCIncremental);
    await deployer.deploy(ShrubsMiMCIncremental, 20, 0);
  });
};
