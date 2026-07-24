const mongoose = require('mongoose');

function connectDB() {
  mongoose.connect(process.env.MONGO_URI).then(() => {
    console.log('MongoDB connected');
  }).catch((err) => {
    console.log(err);
    process.exit(1);
  })
}

module.exports = connectDB;