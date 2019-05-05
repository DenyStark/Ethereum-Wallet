const config = require('../../config');

const Web3 = require('web3');
const Tx = require('ethereumjs-tx');

const web3 = new Web3(config.infura.provider);
const utils = web3.utils;
const eth = web3.eth;

const getBalance = (address) => web3.eth.getBalance(address);

const send = (from, to, value, privateKey, callback) => {
  const promices = [
    web3.eth.getTransactionCount(from),
    web3.eth.getGasPrice(),
  ];

  Promise.all(promices).then(result => {
    const nonce = result[0];
    const gasPrice = result[1];

    const txData = {
      nonce: utils.toHex(nonce),
      gasPrice: utils.toHex(gasPrice),
      gasLimit: utils.toHex(21000),
      to,
      value: utils.toHex(value),
    };

    const tx = new Tx(txData);
    const bPrivateKey = Buffer.from(privateKey.slice(2), 'hex');

    tx.sign(bPrivateKey);
    const sTx = tx.serialize();

    eth.sendSignedTransaction('0x' + sTx.toString('hex'), callback);
  });
};

module.exports = {
  getBalance,
  send,
};
