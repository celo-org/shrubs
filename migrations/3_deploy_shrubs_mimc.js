const MiMC = artifacts.require('MiMC');
const ShrubsMiMC = artifacts.require('ShrubsMiMC');

module.exports = function(deployer) {
  return deployer.then( async () =>  {
    await deployer.link(MiMC, ShrubsMiMC);
    await deployer.deploy(ShrubsMiMC, 20, 0);
  });
};
