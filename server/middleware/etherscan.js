const request = require('request');

const config = require('../../config');

const getTransactions = (address) => new Promise((resolve, reject) => {
  const { apikey, endpoint: url } = config.etherscan;

  const qs = {
    module: 'account',
    action: 'txlist',
    address,
    startblock: 0,
    sort: 'desc',
    apikey,
  };

  request({ url, qs }, (err, _res, body) => {
    if (err) { return reject(err); }
    const payload = JSON.parse(body);
    const { result } = payload;

    if (result === 'Error!') {
      return reject(`Etherscan API error: ${body.message}`);
    }

    resolve({ txs: result });
  });
});

module.exports = {
  getTransactions,
};
