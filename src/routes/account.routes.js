const express= require('express');
const router = express.Router();
const accountController = require('../controllers/account.controller');
const { authMiddleware } = require('../middleware/auth.middleware');


router.post('/create',authMiddleware ,accountController.createAccount);
router.get('/',authMiddleware, accountController.getUserAccounts)
router.get('/balance/:accountId',authMiddleware, accountController.getAccountBalance)

module.exports = router;