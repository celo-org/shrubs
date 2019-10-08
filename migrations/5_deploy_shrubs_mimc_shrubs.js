const MiMC = artifacts.require('MiMC');
const ShrubsMiMCShrubs = artifacts.require('ShrubsMiMCShrubs');

module.exports = function(deployer) {
  return deployer.then( async () =>  {
    await deployer.link(MiMC, ShrubsMiMCShrubs);
    await deployer.deploy(ShrubsMiMCShrubs, 20, 0);
  });
};
