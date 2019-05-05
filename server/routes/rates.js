const express = require('express');
const { ethUsd } = require('../controllers/rates');
const checkToken = require('../middleware/check-token');
const router = new express.Router();

router.route('/ethUsd')
  .get(checkToken, ethUsd);

module.exports = router;
