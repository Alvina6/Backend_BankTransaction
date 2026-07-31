const accountModel = require('../models/account.model');


async function createAccount(req,res){
  const user= req.user;
  
  const account= await accountModel.create({
    userId:user._id,
  })
  return res.status(201).json({message:'Account created successfully',account});
}

async function getUserAccounts(req, res){
  const accounts = await accountModel.find({ userId: req.user._id });
  res.status(200).json({ accounts });
}

async function getAccountBalance(req, res){
  const { accountId } = req.params;
  const account = await accountModel.findOne({ _id: accountId, userId: req.user._id });

  if (!account) {
    return res.status(404).json({ message: 'account not found' });
  }

  const balance = await account.getBalance();
  res.status(200).json({
    accountId: account._id.toString(),
    balance: Number(balance) || 0,
  });
}


module.exports = { createAccount, getUserAccounts, getAccountBalance };