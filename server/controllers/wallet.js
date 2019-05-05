const db = require('../../db');
const logger = require('../../logger');
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
 * Send ethers from the user wallet to another user.
 */
const sendTransaction = (req, res) => {
  const { amount, address } = req.headers;
  const value = parseFloat(amount);
  const userId = req.locals.userId;

  if (!userId) return res.status(401).send({
    status: 'error',
    message: 'Not authorized.'
  });

  if (!amount || !address) return res.status(422).send({
    status: 'error',
    message: 'No amount or address provided.'
  });

  if (isNaN(value)) return res.status(422).send({
    status: 'error',
    message: 'Amount should be a number.'
  });

  if (!tools.isAddress(address)) return res.status(422).send({
    status: 'error',
    message: 'Invalid address.'
  });

  db.any('SELECT * FROM "Wallets" WHERE "UserId" = $1', [userId])
    .then(rows => {
      if (!rows[0])
        return res.status(422).send({
          status: 'error',
          message: 'No user with such username & password combination.'
        });

      const { Address: from, PrivateKey: privateKey } = rows[0];

      ethereum.send(from, address, amount, privateKey, (err, txid) => {
        if (err) {
          logger.error(err);
          return res.status(500).send({
            status: 'error',
            message: 'Transaction builder error.'
          });
        }

        res.send({
          status: 'success',
          txid
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


module.exports = {
  getBalance,
  createAddress,
  sendTransaction,
};
