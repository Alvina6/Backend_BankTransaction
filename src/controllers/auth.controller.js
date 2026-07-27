const userModel= require('../models/user.model');
const jwt= require('jsonwebtoken');
const { sendRegistrationEmail } = require('../services/email.service');

async function registerUser(req,res){
  const {name,email,password}= req.body;  

  const isExsist= await userModel.findOne({email});
  if(isExsist){
    return res.status(400).json({message:'Email already exists'})
  }

  const user= await userModel.create({name,email,password});

  const token= jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'3d'});

  res.cookie('token',token,)

  res.status(201).json({message:'User registered successfully',user:{
    id:user._id,
    name:user.name,
    email:user.email

  },token})

  await sendRegistrationEmail(user.email,user.name);

}


async function loginUser(req,res){
  const {email,password}= req.body;

  const user= await userModel.findOne({email}).select('+password');

  if(!user){
    return res.status(400).json({message:'Invalid email or password'})
  }
  const isValidPassword=await user.comparePassword(password)

  if(!isValidPassword){
    return res.status(400).json({message:'Invalid email or password'})
  }

  const token= jwt.sign({id:user._id},process.env.JWT_SECRET,{expiresIn:'3d'});
 
  
  res.cookie('token', token,)

  res.status(200).json({message:'User logged in successfully',user:{
    id:user._id,
    name:user.name,
    email:user.email
  },token})
}

module.exports= {registerUser,loginUser}