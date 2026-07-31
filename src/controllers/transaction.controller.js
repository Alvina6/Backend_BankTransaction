const transactionModel = require('../models/transaction.model');
const ledgerModel = require('../models/ledger.model');
const accountModel = require('../models/account.model');
const userModel = require('../models/user.model');
const { sendTransactionEmail } = require('../services/email.service');
const mongoose = require('mongoose');

const parseAmount = (value) => {
  const parsedAmount = Number(value);
  return Number.isFinite(parsedAmount) && parsedAmount > 0 ? parsedAmount : null;
};

const createTransaction = async (req, res) => {
  const body = req.body || {};
  const { fromAccount, toAccount, amount, idempotencyKey } = body;
  if (!fromAccount || !toAccount || amount === undefined || !idempotencyKey) {
    return res.status(400).json({ error: 'Missing required fields' });
  }


  const parsedAmount = parseAmount(amount);
  if (parsedAmount === null) {
    return res.status(400).json({ error: 'Amount must be a positive number' });
  }

  let session;

  try {
    const fromAccountData = await accountModel.findOne({ _id: fromAccount });
    const toAccountData = await accountModel.findOne({ _id: toAccount });

    if (!fromAccountData || !toAccountData) {
      return res.status(404).json({ error: 'Account not found' });
    }

    const existingTransaction = await transactionModel.findOne({ idempotencyKey });
    if (existingTransaction) {
      switch (existingTransaction.status) {
        case 'COMPLETED':
          return res.status(200).json({ message: 'Transaction already completed', transaction: existingTransaction });
        case 'PENDING':
          return res.status(200).json({ message: 'Transaction is still pending' });
        case 'FAILED':
          return res.status(200).json({ message: 'Transaction has failed please try again' });
        case 'REVERSED':
          return res.status(200).json({ message: 'Transaction has been reversed' });
        default:
          break;
      }
    }

    if (fromAccountData.status !== 'ACTIVE' || toAccountData.status !== 'ACTIVE') {
      return res.status(400).json({ error: 'One of the accounts is not active' });
    }

    const balance = await fromAccountData.getBalance();
    if (balance < parsedAmount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const newTransaction = await transactionModel.create([{
      fromAccount,
      toAccount,
      amount: parsedAmount,
      idempotencyKey,
      status: 'PENDING',
    }], { session });

    const txn = newTransaction[0];

    await ledgerModel.create([{
      account: fromAccount,
      type: 'DEBIT',
      amount: parsedAmount,
      transaction: txn._id,
    }], { session });

    await(()=>{
      return new Promise((resolve)=>setTimeout(resolve, 30*1000))
    })

    await ledgerModel.create([{
      account: toAccount,
      type: 'CREDIT',
      amount: parsedAmount,
      transaction: txn._id,
    }], { session });

    txn.status = 'COMPLETED';
    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();

    if (req.user && req.user.email) {
      await sendTransactionEmail(req.user.email, req.user.name, parsedAmount, toAccount);
    }

    return res.status(201).json({ message: 'Transaction completed', transaction: txn });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (e) {
        // ignore abort errors
      }
      session.endSession();
    }

    return res.status(500).json({ error: 'Transaction failed', details: err.message });
  }
};

async function createInitialFundsTransaction(req, res) {
  const body = req.body || {};
  const { toAccount, amount, idempotencyKey } = body;

  if (!toAccount || amount === undefined || !idempotencyKey) {
    return res.status(400).json({
      message: 'toAccount, amount and idempotencyKey are required',
    });
  }

  const parsedAmount = parseAmount(amount);
  if (parsedAmount === null) {
    return res.status(400).json({ message: 'Amount must be a positive number' });
  }

  let session;

  try {
    let targetAccount = await accountModel.findOne({ _id: toAccount });
    if (!targetAccount) {
      
        return res.status(404).json({ message: 'Invalid account' });
      }

    let sourceAccount = await accountModel.findOne({ systemUser: true ,userId: req.user._id });
    if (!sourceAccount) {
      sourceAccount = await accountModel.create({ userId: req.user._id });
    }

    session = await mongoose.startSession();
    session.startTransaction();

    const createdTxn = await transactionModel.create([
      {
        fromAccount: sourceAccount._id,
        toAccount: targetAccount._id,
        amount: parsedAmount,
        idempotencyKey,
        status: 'PENDING',
      },
    ], { session, ordered: true });

    const txn = createdTxn[0];

    await ledgerModel.create([
      {
        account: sourceAccount._id,
        type: 'DEBIT',
        amount: parsedAmount,
        transaction: txn._id,
      },
      {
        account: targetAccount._id,
        type: 'CREDIT',
        amount: parsedAmount,
        transaction: txn._id,
      },
    ], { session, ordered: true });

    txn.status = 'COMPLETED';
    await txn.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: 'Transaction completed', transaction: txn });
  } catch (err) {
    if (session) {
      try {
        await session.abortTransaction();
      } catch (abortErr) {
        // ignore abort errors
      }
      session.endSession();
    }

    return res.status(500).json({ error: 'Transaction failed', details: err.message });
  }
}

module.exports = {
  createTransaction,
  createInitialFundsTransaction,
};