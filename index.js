require("./utils.js");
require('dotenv').config();

const express = require('express');

// For storing session information in the database
const session = require('express-session');

// For storing session information in the database
const MongoStore = require('connect-mongo');

// bcrypt for password hashing
const bcrypt = require('bcrypt');
const saltRounds = 12;

// For developers to test on their local machine
const port = process.env.PORT || 3000;

/* Create the express app */
const app = express();

const Joi = require("joi");

//Set expiration time for session to 1 hour
const expireTime = 1 * 60 * 60 * 1000;

/* Secret Information Section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;
/* End Secret Information Section */

/* Session Section */
var mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret
    }
});

/* Database Section */
var { database } = require("./databaseConnection");
const userCollection = database.db(mongodb_database).collection("users");

app.use(express.urlencoded({ extended: false }));

/* Set the ejs view engine */
app.set('view engine', 'ejs');

/* Sets the session */
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: 3600000 // set session expiration time to 1 hour
    }
}));

//Check if the session is valid
function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

//Check if the session is valid
function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    }
    else {
        res.redirect('/login');
    }
}

// log out function 
function logout() {
    // AJAX call
    var xhr = new XMLHttpRequest();
    xhr.open('GET', '/logout');
  
    // send logout call 
    xhr.onload = function () {
      // redirect to index page 
      window.location.href = '/index';
    };
    xhr.send();
  }

/* Home Section */

//Renders the index page
app.get('/', (req, res) => {
    res.render('index');
});

//Renders the main page
//When the user logged in
app.get('/main', (req, res) => {
    res.render('main');
});

// Renders the course detail page
app.get('/courseDetail', (req, res) => {
    res.render('courseDetail');
});

/* Profile Section */

// profile 
app.get('/profile', (req,res) => {
    res.render('profile');
});

// edit basic profile Section
app.get('/editProfile', (req,res) => {
    res.render('editProfile');
});

// edit skill Section
app.get('/editSkill', (req,res) => {
    res.render('editSKill');
});

// edit interest Section
app.get('/editInterest', (req,res) => {
    res.render('editInterest');
});

/* Profile Section end */

/* Login Section */
app.get('/users', async (req, res) => {
    const users = await userCollection.find().toArray();
    res.render('users', { users });
});

// For developers to test on their local machine
app.get('/signup', (req, res) => {
    res.render('signup');
});

// Creates a new user
app.post('/submitUser', async (req, res) => {
    const { email, username, firstName, lastName, password } = req.body;

    // Check if user with the same email or username already exists
    const existingUser = await userCollection.findOne({
        $or: [{ email: email }, { username: username }]
    });

    // If user already exists, return error message
    if (existingUser) {
        if (existingUser.email === email) {
            return res.send("User with this email already exists");
        } else {
            return res.send("User with this username already exists");
        }
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
        email: email,
        username: username,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword
    };

    // Insert new user into database
    await userCollection.insertOne(newUser);
    // Console log to show that user was added
    console.log("User added to database");

    // Set session variables
    req.session.authenticated = true;
    req.session.username = username;

    // Redirect to main page after signup
    res.redirect("/main");
});

// Renders the login page
app.get('/login', (req, res) => {

    // Show error message if there is one
    var msg = req.query.msg || '';

    res.render("login", { msg: msg })
});

// logout 
app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/index");
  });

app.post('/submitLogin', (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    // If email is invalid, return error message
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.redirect('/login?msg=Invalid Email/Password!');
        return;
    }

    const user = await userCollection.findOne({ email: email });

    // If email does not exist, return error message
    if (!user) {
        console.log("Email not found");
        res.redirect('/login?msg=Invalid Email!');
        return;
    }

    // Checks if the password matches using bcrypt compare
    const passwordMatch = await bcrypt.compare(password, user.password);

    // If password does not match, return error message
    if (!passwordMatch) {
        console.log("Incorrect password");
        res.redirect('/login?msg=Invalid Password!');
        return;
    }

    // Set session variables
    req.session.authenticated = true;
    req.session.username = user.username;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;

    res.redirect('/main');
});

// For developers to test on their local machine
app.listen(port, () => {
    console.log("Node application listening on port " + port);
});

//Serves the static assets from the specified directory
app.use(express.static(__dirname + '/public'));
