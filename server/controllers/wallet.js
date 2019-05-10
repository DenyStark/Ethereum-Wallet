const db = require('../../db');
const logger = require('../../logger');
const ethereum = require('../middleware/ethereum');
const etherscan = require('../middleware/etherscan');
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
          const etherBalance = balance / 10 ** 18;

          res.send({
            status: 'success',
            balance: etherBalance
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

const getTransactions = (req, res) => {
  const userId = req.locals.userId;

  db.any('SELECT * FROM "Wallets" WHERE "UserId" = $1', [userId])
    .then(rows => {
      if (!rows[0])
        return res.status(422).send({
          status: 'error',
          message: 'No user with such username & password combination.'
        });

      const { Address: address } = rows[0];

      etherscan.getTransactions(address)
        .then(({ txs: payload }) => {
          const txs = [];

          for (const tx of payload) {
            const {
              timeStamp, hash, from, to, value, input, confirmations
            } = tx;

            const lowarCaseAddress = address.toLowerCase();
            const category = (lowarCaseAddress === from) ? 'send' : 'receive';
            const txAddress = (lowarCaseAddress === from) ? to : from;

            const amount = value / 10 ** 18;
            const comment = tools.hexToString(input);

            txs.push({
              txid: hash,
              address: txAddress,
              category,
              amount,
              confirmations,
              time: timeStamp,
              comment,
            });
          }

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
  const userId = req.locals.userId;

  db.any('SELECT * FROM "Wallets" WHERE "UserId" = $1', [userId])
    .then(rows => {
      if (rows[0]) return res.send({
        status: 'success',
        address: rows[0].Address
      });

      const newAccount = tools.generateNewAccount();
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
    }, err => {
      logger.error(err);
      res.status(500).send({
        status: 'error',
        message: 'Error with the database.'
      });
    });
};

/**
 * Send ethers from the user wallet to another user.
 */
const sendTransaction = (req, res) => {
  const { amount, address, comment } = req.headers;
  const value = parseFloat(amount) * 10 ** 18;
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

      ethereum.getBalance(from)
        .then(balance => {
          // Txs fee = 420000000000000 = 21000 * 2 Gwei
          if (balance < value + 420000000000000) return res.status(422).send({
            status: 'error',
            message: 'Not enought funds.'
          });

          ethereum.send(from, address, value, privateKey, comment,
            (err, txid) => {
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


module.exports = {
  getBalance,
  getTransactions,
  createAddress,
  sendTransaction,
};
