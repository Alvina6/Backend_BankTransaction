const userModel= require('../models/user.model');
const jwt= require('jsonwebtoken');
const { sendRegistrationEmail } = require('../services/email.service');

const BlackListModel = require('../models/blackList.model');

async function registerUser(req, res) {
  const body = req.body || {};
  const { name, email, password } = body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required' });
  }

  const isExist = await userModel.findOne({ email });
  if (isExist) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const user = await userModel.create({ name, email, password });

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });

  res.cookie('token', token);

  res.status(201).json({
    message: 'User registered successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  });

  await sendRegistrationEmail(user.email, user.name);
}

async function loginUser(req, res) {
  const body = req.body || {};
  const { email, password } = body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  const user = await userModel.findOne({ email }).select('+password');

  if (!user) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const isValidPassword = await user.comparePassword(password);

  if (!isValidPassword) {
    return res.status(400).json({ message: 'Invalid email or password' });
  }

  const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '3d' });

  res.cookie('token', token);

  res.status(200).json({
    message: 'User logged in successfully',
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
    },
    token,
  });
}
 async function logoutUser(req, res) {
  const token = req.cookies.token || req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(400).json({ message: 'Token is required for logout' });
  }



await BlackListModel.create({ token });

  res.clearCookie('token');
  res.status(200).json({ message: 'User logged out successfully' });
}

module.exports= {registerUser,loginUser,logoutUser};