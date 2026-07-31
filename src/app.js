const express= require('express');
require('dotenv').config();
const cookieParser= require('cookie-parser');

const authRoutes= require('./routes/auth.routes');
const accountRoutes= require('./routes/account.routes');
const transactionRoutes= require('./routes/transaction.routes');

const app= express();

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/transaction', transactionRoutes);

module.exports= app;