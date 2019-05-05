const request = require('request');

const config = require('../../config');
const logger = require('../../logger');

const getRates = address => new Promise((resolve, reject) => {
  const { apikey, endpoint: url } = config.etherscan;

  const qs = {
    module: 'account',
    action: 'txlistinternal',
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

const getTransactions = (req, res) => {
  const { address } = req.body;

  getRates(address)
    .then(({ txs }) => {
      res.send({
        status: 'success',
        address,
        txs
      });
    }, err => {
      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: `Problem with getting transactions for '${address}'`
      });
    });
};

module.exports = {
  getTransactions,
};
