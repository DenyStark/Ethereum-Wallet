const Web3 = require('web3');

const web3 = new Web3();
const accounts = web3.eth.accounts;
const utils = web3.utils;

const generateNewAccount = () => {
  const account = accounts.create(utils.randomHex(32));
  delete account.accounts;
  return account;
};

const isAddress = (address) => (utils.isAddress(address));

module.exports = {
  generateNewAccount,
  isAddress,
};
