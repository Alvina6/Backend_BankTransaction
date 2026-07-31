const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transaction.controller');
const { authMiddleware, authSystemUser } = require('../middleware/auth.middleware');

router.post('/', authMiddleware, transactionController.createTransaction);

router.post('/system/initial-funds',authSystemUser, transactionController.createInitialFundsTransaction)

module.exports = router;