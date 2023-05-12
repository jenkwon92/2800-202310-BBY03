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

// To access ObjectID in MongoDB
const { ObjectId } = require('mongodb');

// For developers to test on their local machine
const port = process.env.PORT || 3000;

/* Create the express app */
const app = express();

const Joi = require("joi");

// For JSON Web Tokens to reset password
const jwt = require("jsonwebtoken");

// For sending emails
const nodemailer = require("nodemailer");

const WebsiteURL = 'http://wjxdvnhtuk.eu09.qoddiapp.com';

//Set expiration time for session to 1 hour
const expireTime = 1 * 60 * 60 * 1000;

/* Secret Information Section */
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;

const node_session_secret = process.env.NODE_SESSION_SECRET;

const JWT_SECRET = process.env.JWT_SECRET;
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

/* Set the ejs view engine */
app.set('view engine', 'ejs');


/* Sets up middleware for an Express.js */

// Handles URL-encoded form data.
app.use(express.urlencoded({ extended: false }));

// Serves the static assets from the specified directory
app.use(express.static(__dirname + '/public'));

// Sets the session
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: {
        maxAge: 3600000 // set session expiration time to 1 hour
    }
}));

// Check if the session is valid
function isValidSession(req) {
    if (req.session.authenticated) {
        return true;
    }
    return false;
}

// Check if the session is valid
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

// Renders the index page
app.get('/', (req, res) => {
    res.render('index');
});

// Renders the main page


app.get('/main', (req, res) => {
    var isAuthenticated = req.session.authenticated || false;
    
    //When the user not logged in - login page
    //When the user logged in - main page
    if (!isAuthenticated) {
		res.redirect('/login');
	} else {
		res.render('main', { authenticated: req.session.authenticated, username: req.session.username });
	}
});

// Renders the my courses page
app.get('/myCourses', (req, res) => {
    res.render('myCourses');
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
    res.render('signUp');
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

app.post('/submitLogin', async (req,res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().required();
    const validationResult = schema.validate(email);
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
    if (passwordMatch) {
        // Set session variables
        req.session.authenticated = true;
        req.session.username = user.username;
        req.session.email = email;
        req.session.cookie.maxAge = expireTime;
    } else {
        console.log("Incorrect password");
        res.redirect('/login?msg=Invalid Password!');
        return;
    }

    res.redirect('/main');
});

// Renders the forgot password page
app.get('/forgotPassword', (req, res, next) => {
    var msg = req.query.msg || '';

    res.render('forgotPassword', { msg: msg })
});

// Sends the reset password email
app.post('/forgotPassword', async (req, res, next) => {
    const { email } = req.body;

    const user = await userCollection.findOne({ email: email });

    if (!user) {
        res.render('forgotPassword', { msg: "User email not found!" });
    } else {
        const secret = JWT_SECRET + user.password;
        const payload = {
            email: email,
            id: user._id
        };
        const token = jwt.sign(payload, secret, { expiresIn: '15m' });
        // const link = `${WebsiteURL}/resetPassword/${user._id}/${token}`;
        const link = `${WebsiteURL}/resetPassword/${user._id}/${token}`;

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                user: process.env.COURSEPILOT_SUPPORT_EMAIL,
                pass: process.env.COURSEPILOT_SUPPORT_PASSWORD
            }
        });

        // send mail with defined transport object
        const mailOptions = {
            from: `"CoursePilot" <${process.env.COURSEPILOT_SUPPORT_EMAIL}>`, // Sender address
            to: user.email, // Recipient address
            subject: 'CoursePilot Password Recovery', // Subject line
            html: `<p>Please click this <a href="${link}">link</a> to reset your password.</p>` // HTML body
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        res.render('forgotPassword', { msg: "Password reset link has been sent!" });
    }
});


// Renders the reset password page
app.get('/resetPassword/:id/:token', async (req, res, next) => {
    // Get user id and token from url
    const { id, token } = req.params;

    // Find user in database
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    // If user does not exist, return error message
    if (!user) {
        // res.render('resetPassword', { msg: "ID not found!" });
        res.send("ID not found!");
        return;
    }

    // Create secret for JWT
    const secret = JWT_SECRET + user.password;
    try {
        const payload = jwt.verify(token, secret);
        res.render('resetPassword', { email: user.email });
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});


// Resets the user's password
app.post('/resetPassword/:id/:token', async (req, res, next) => {
    // Get user id and token from url
    const { id, token } = req.params;

    // Get new password from form
    const { newPassword } = req.body;

    // Find user in database
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    // If user does not exist, return error message
    if (!user) {
        // res.render('resetPassword', { msg: "ID not found!" });
        res.send("ID not found!");
        return;
    }

    // Create secret for JWT
    const secret = JWT_SECRET + user.password;
    try {
        // Verify the token
        const payload = jwt.verify(token, secret);

        // Hash the new password
        user.password = await bcrypt.hash(newPassword, saltRounds);

        // Update password in database
        await userCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { password: user.password } }
        );

        // Password successfully updated
        res.render('passwordUpdated');
    }
    catch (error) {
        console.log(error);
        res.send(error);
    }
});

// Renders the chatbot page
app.get('/chatbot', (req, res) => {
    res.render('chatbot');
});

// Renders the user to the root URL after the session is destroyed (logged out).
app.get('/logout', (req, res) => {
	req.session.destroy();
	res.redirect('/');
});

// Renders the custom 404 error page to users instead of displaying a generic error message or a stack trace.
app.get('*', (req, res) => {
	res.status(404);
	res.render('404');
});

// For developers to test on their local machine
app.listen(port, () => {
    console.log("Node application listening on port " + port);
});

