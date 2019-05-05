const express = require('express');

const wallet = require('../controllers/wallet');
const checkToken = require('../middleware/check-token');

const router = new express.Router();

router.route('/getBalance')
  .get(checkToken, wallet.getBalance);

router.route('/getTransactions')
  .get(checkToken, wallet.getTransactions);

router.route('/createAddress')
  .get(checkToken, wallet.createAddress);

router.route('/sendTransaction')
  .get(checkToken, wallet.sendTransaction);

module.exports = router;
