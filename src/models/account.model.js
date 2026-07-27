const mongoose = require('mongoose');
const ledgerModel = require('./ledger.model');

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

  accountSchema.methods.getBalance = async function(){
    const balanceData = await ledgerModel.aggregate([
      {
        $match:{
              account:this._id
            }
      }
      ,{
        $group:{
          _id:null, 
          totalDebit:{
            $sum:{
              $cond:[
                {$eq:['$type','DEBIT']},
                '$amount',
                0 
              ]
            }
          },
          totalCredit:{
            $sum:{
              $cond:[
                {$eq:['$type','CREDIT']},
                '$amount',
                0
              ]
            }
          },
          
        }
      }   
  ,{
    $project:{
      _id:0,
      balance:{
        $subtract:['$totalCredit','$totalDebit']
      }
    }
  }
])

  if(balanceData.length > 0){
    return balanceData[0].balance;
  }
  return 0;
} 

    const accountModel = mongoose.model('Account',accountSchema);

  module.exports = accountModel;