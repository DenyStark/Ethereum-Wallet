const validate = require('bitcoin-address-validation');

const db = require('../../db');
const logger = require('../../logger');
const { btcQuery } = require('../middleware/bitcoin');
const { getBtcErrorCode } = require('../utils/bitcoin');
const ethereum = require('../middleware/ethereum');
const tools = require('../utils/web3');

/**
 * Get balance for the user.
 */
const getBalance = (req, res) => {
  const userId = req.locals.userId;

  db.any('SELECT * FROM "Wallets" WHERE "UserId" = $1', [userId])
    .then(rows => {
      if (!rows[0])
        return res.status(422).send({
          status: 'error',
          message: 'No user with such username & password combination.'
        });

      const { Address: address } = rows[0];

      ethereum.getBalance(address)
        .then(balance => {
          res.send({
            status: 'success',
            balance // In wei
          });
        }, err => {
          if (err instanceof Error) err = err.message;
          logger.error(err);
          res.status(500).send({
            status: 'error',
            message: 'Internal server error.'
          });
        });
    }, err => {
      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: 'Error with the database.'
      });
    });
};

/**
 * Create address for the user.
 */
const createAddress = (req, res) => {
  const newAccount = tools.generateNewAccount();
  const userId = req.locals.userId;
  const { address, privateKey } = newAccount;

  if (!userId) return res.status(401).send({
    status: 'error',
    message: 'Not authorized.'
  });

  db.one(`
    INSERT INTO "Wallets" ("UserId", "MnemonicId", "Address", "PrivateKey")
    VALUES ($1, $2, $3, $4) RETURNING "WalletId"`,
  [userId, 0, address, privateKey]);

  res.send({
    status: 'success',
    address
  });
};

/**
 * Send bitcoins from the user wallet to another user.
 */
const sendTransaction = (req, res) => {
  let amount = req.headers.amount;
  const address = req.headers.address;
  const comment = req.headers.comment; // optional
  const fee = 0.003; // hardcoded fee for TESTNET ONLY!!!

  if (!amount) return res.status(400).send({
    status: 'error', message: 'No amount provided.'
  });
  if (!address) return res.status(400).send({
    status: 'error', message: 'No address provided.'
  });

  amount = parseFloat(amount);
  if (isNaN(amount)) return res.status(400).send({
    status: 'error', message: 'Amount should be a number.'
  });

  if (!validate(address)) return res.status(400).send({
    status: 'error', message: 'Invalid address.'
  });

  // Set transaction fee
  btcQuery({
    method: 'settxfee',
    params: [fee],
    walletName: req.locals.UserId.toString()
  })
    .then(status => {
      if (!status) throw new Error('Problem with setting up tx fee.');
      // Fee was set up successfully -> send transaction
      return btcQuery({
        method: 'sendtoaddress',
        params: [address, amount, comment],
        walletName: req.locals.UserId.toString()
      });
    })
    .then(txid => {
      res.send({
        status: 'success',
        txid
      });
    })
    .catch(err => {
      if (err.name === 'Breaker') return;
      if (err instanceof Error) err = err.message;
      if (getBtcErrorCode(err) === -6)
        return res.status(400).send({
          status: 'error', message: 'Insufficient funds.'
        });
      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: 'Internal server error.'
      });
    });
};


module.exports = {
  getBalance,
  createAddress,
  sendTransaction,
};
