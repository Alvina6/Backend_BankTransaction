const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  fromAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please provide a fromAccount'],
    index: true,
  },
  toAccount: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Account',
    required: [true, 'Please provide a toAccount'],
    index: true,
  },

  status: {
    type: String,
    enum: {
      values: ['PENDING', 'COMPLETED', 'FAILED','REVERSED'],
      message: 'Status must be either PENDING, COMPLETED or FAILED',
    },
    default: 'PENDING',
  },
  amount: {
    type: Number,
    required: [true, 'Please provide an amount'],
    min: [0, 'Amount must be greater than 0'],
  },
  idempotencyKey: {
    type: String,
    required: [true, 'Please provide an idempotencyKey'],
    index: true,
    unique: true,
  },
},
  {
    timestamps: true,
  })

  const transactionModel = mongoose.model('Transaction', transactionSchema);
  module.exports = transactionModel; 