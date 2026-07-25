const mongoose = require('mongoose');

const accountSchema = new mongoose.Schema({
  userId:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'User',
    required:[true,'Please provide a userId'],
    index:true,
  }, 
  status:{
    type:String,
     enum:{
      values:['ACTIVE','FROZEN','CLOSED'],
      message:'Status must be either ACTIVE, FROZEN or CLOSED',
      
     },
     default:'ACTIVE'
  
},
  currency:{
    type:String,
    required:[true,'Please provide a currency'],
    default:'PKR',
  },
},
  {
  timestamps:true
  })

  accountSchema.index({
    userId:1,
    status:1,
  })

  const accountModel = mongoose.model('Account',accountSchema);

  module.exports = accountModel;