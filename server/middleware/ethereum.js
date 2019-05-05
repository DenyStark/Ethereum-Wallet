const config = require('../../config');

const Web3 = require('web3');

const web3 = new Web3(config.infura.provider);

const getBalance = (address) => web3.eth.getBalance(address);

module.exports = {
  getBalance,
};
