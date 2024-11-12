// Dependencies
import fs from 'fs';
import path from "path";
import bodyParser from 'body-parser';
import 'dotenv/config';
import axios from 'axios';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
// Set Express App
import express, { Express, Request, Response } from "express";
import { verifyToken } from './auth/verifyToken';
const app: Express = express();

// Connect to MongoDB database
mongoose.connect('mongodb://apl.san.dewittco.com:27017/user_authentication',{user: process.env.MONGO_USER, pass: process.env.MONGO_PASS})
.then(() => {
  console.log('Connected to MongoDB');
})
.catch((error:any) => {
  console.error('Error connecting to MongoDB:', error);
});

// Define a schema for the User collection
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
  permissions: String,
});

// Create a User model based on the schema
const User = mongoose.model('User', userSchema);

// DotENV setup for environment variables
require('dotenv').config({ path: path.resolve(__dirname, '../.env') })

// app extensions and settings
app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static('public'))
app.set('view engine', 'ejs');
app.use(bodyParser.json()) // Parses json, multi-part (file), url-encoded
app.use(verifyToken)

// ********** SITE ROUTES *********** 
// Home page
app.get("/", (req: any, res: Response) => {
  // console.log("ROOT",req.user);
  res.render('pages/index', req.user);
});

// ! APL Invoice and Waybill upload page
//
app.get("/upload/pdf",(req:any,res)=>{
  console.log(req.user)
  req.user?res.render("pages/uploadPDF", req.user):res.redirect('/login');
})

// Choose the way to upload the information to the DB
app.get('/upload/start', (req:any,res,next)=>{
  if(req.user == null){
    res.redirect('/login')
  }else{
    res.render('pages/uploadStart', req.user);
  }
})

// Page with the details from the API CALL
app.get('/upload/details/:invoice_num', (req:any,res,next)=>{
  if(req.user == null){
    res.redirect('/login')
  }else{
    res.render('pages/uploadDetails', req.user)      
  }
})

// Settings
app.get("/settings",(req:any,res:Response)=>{
  if(req.user == null){
    res.redirect('/login')
  }else{
    res.render("pages/settings", req.user);
  }
})

// Page for searching db tables
app.get("/search",(req:any,res:Response)=>{
  if(req.user == null){
    res.redirect('/login')
  }else{
    res.render("pages/search", req.user);
  }

})

// Page for getting Reports
app.get("/reports",(req:any,res)=>{
  if(req.user == null){
    res.redirect('/login')
  }else{
    res.render("pages/reports", req.user);
  }

})

// Login Page
app.get("/login", (req:any,res)=>{
  res.render("pages/login", req.user);
})

// ********** API ROUTES ***********
const api = require("./router/api/api")
app.use("/api", api);
// ********** USER ROUTES ***********
const users = require("./router/users/users")
app.use("/users", users);
// ********** SHIPMENT ROUTES ***********
const shipments = require("./router/shipments/shipments")
app.use("/api/shipments", shipments);
// ********** AUTH ROUTES ***********
// Route to register a new user
app.post('/api/register',  async (req, res) => {
  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: req.body.email });
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(req.body.password, 10);

    // Create a new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      permissions: req.body.permissions,
    });
    
    await newUser.save();
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});
// ********** SETTINGS ROUTES ***********
const settings = require("./router/settings/settings")
app.use("/settings", settings);


// Route to authenticate and log in a user
app.post('/api/login', async (req, res) => {
  try {
    // Check if the email exists
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Compare passwords
    const passwordMatch = await bcrypt.compare(req.body.password, user.password!);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign({ email: user.email, user: user.username }, process.env.JWT_SECRET!);
    res.setHeader('Set-Cookie', `XSRF-TOKEN=${token}; HttpOnly;Max-Age=3600;SameSite=Strict;Secure;Path=/`)
    res.send(200)
  } catch (error:any) {
    console.error(error);
    fs.appendFileSync(path.join(__dirname + '../logs/www/log.txt'), error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Protected route to get user details
app.get('/api/user', verifyToken, async (req:any, res:any) => {
  try {
    // Fetch user details using decoded token
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(200).json({ username: user.username, email: user.email });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/logout', (req,res)=>{
  res.status(202).clearCookie('XSRF-TOKEN')
  res.redirect('/')
})


// TODO: When pulling bunker, use invoice bunker as default. However, show note if Invoice Bunker does not match Bunker RATE

/**
 * Additionally, Instead of making changes or taking the bunker charge face value, 
 * we need to state from WHICH rate the bunker charge was pulled. 
 * So we prompt the user to double check if the bunker charge is the right rate.
 * 
 * To tell from which Bunker RATE it is pulling, we use the ingate date and compare.
 * 
 */

// TODO: Refine search feature on `Search`, it doesnt work for dates or amounts etc
// TODO: User management for admins to add and remove users.
// TODO: Reports (Discounts)
// TODO: Settings needs to be redone to add or remove TSPs, and dynamically add or remove Rates

// import http from 'http';
import https from 'https';
import { match } from 'assert';
const privateKey  = fs.readFileSync(path.join(__dirname,'../ssl/sd_dewitt.key'), 'utf8');
const certificate = fs.readFileSync(path.join(__dirname, '../ssl/sd_dewitt.crt'), 'utf8');
const credentials = {key: privateKey, cert: certificate};

// var httpServer = http.createServer(app);
var httpsServer = https.createServer(credentials, app);

// httpServer.listen(80);
httpsServer.listen(443, ()=>{
  console.log(`[server]: Server is running at https://0.0.0.0`);
});

// Reload code here