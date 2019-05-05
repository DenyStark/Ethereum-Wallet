const Web3 = require('web3');

const web3 = new Web3();
const accounts = web3.eth.accounts;

const generateNewAccount = () => {
  const account = accounts.create(web3.utils.randomHex(32));
  delete account.accounts;
  return account;
};

module.exports = {
  generateNewAccount,
};
