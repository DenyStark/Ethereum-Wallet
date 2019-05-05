'use strict'

const express = require('express')
const wallet = require('../controllers/wallet')
const etherscan = require('../controllers/etherscan');
const checkToken = require('../middleware/check-token')
const { checkWallet } = require('../middleware/bitcoin')
const router = express.Router()

router.route('/getBalance')
  .get(checkToken, wallet.getBalance);

router.route('/getTransactions')
  .get(checkToken, etherscan.getTransactions);

router.route('/createAddress')
  .get(checkToken, wallet.createAddress);

router.route('/sendTransaction')
    .get(checkToken, checkWallet, wallet.sendTransaction)


module.exports = router
