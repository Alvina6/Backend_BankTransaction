const transactionModel= require('../models/transaction.model');
const ledgerModel= require('../models/ledger.model');
const accountModel= require('../models/account.model');
const { sendTransactionEmail, 
sendTransactionFailureEmail } = require('../services/email.service')
 const mongoose = require('mongoose');

const createTransaction = async (req, res) => {
  const { fromAccount, toAccount, amount, idempotencyKey } = req.body;
  if (!fromAccount || !toAccount || !amount || !idempotencyKey) {
  return res.status(400).json({ error: 'Missing required fields' });
}

  let session;
  try {
    const fromAccountData = await accountModel.findOne({ _id: fromAccount });
    const toAccountData = await accountModel.findOne({ _id: toAccount });

      if (!fromAccountData || !toAccountData) {
        return res.status(404).json({ error: 'Account not found' });

}// Idempotency check
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
if (balance < amount) {
  return res.status(400).json({ error: 'Insufficient balance' });
}

session = await mongoose.startSession();
session.startTransaction();

const newTransaction = await transactionModel.create([{
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
  status: 'PENDING',
}], { session });

const txn = newTransaction[0];

const debitLedgerEntry = await ledgerModel.create([{
  account: fromAccount,
  type: 'DEBIT',
  amount,
  transaction: txn._id,
}], { session });

const creditLedgerEntry = await ledgerModel.create([{
  account: toAccount,
  type: 'CREDIT',
  amount,
  transaction: txn._id,
}], { session });

txn.status = 'COMPLETED';
await txn.save({ session });

await session.commitTransaction();
session.endSession();

// send email (fire-and-forget is possible but awaiting here for clarity)
if (req.user && req.user.email) {
  await sendTransactionEmail(req.user.email, req.user.name, amount, toAccount);
}

return res.status(201).json({ message: 'Transaction completed', transaction: txn });
} catch (err) {
if (session) {
try { await session.abortTransaction(); } catch (e) { /* ignore */ }
session.endSession();
}
// Optionally: send failure email
return res.status(500).json({ error: 'Transaction failed', details: err.message });
}
};
module.exports= {
  createTransaction,
}