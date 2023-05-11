require("./utils.js");
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bcrypt = require('bcrypt');
const saltRounds = 12;

// For developers to test on their local machine
const port = process.env.PORT || 3000;

/* Create the express app */
const app = express();

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

/* Set the static folder */
app.use(session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
}));

/* Set the ejs view engine */
var users = [];

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

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
app.get('/main', (req,res) => {
    res.render('main');
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

app.post('/submitUser', (req, res) => {
    var email = req.body.email;
    var username = req.body.username;
    var firstName = req.body.firstName;
    var lastName = req.body.lastName;
    var password = req.body.password;

    var hashedPassword = bcrypt.hashSync(password, saltRounds);
    users.push({ email: email, username: username, firstName: firstName, lastName: lastName, password: hashedPassword });

    console.log(users);

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        usershtml += "<li>" + "<br></br>" +
            "Email: " + users[i].email + "<br></br>" +
            "Username: " + users[i].username + "<br></br>" +
            "First Name: " + users[i].firstName + "<br></br>" +
            "Last Name: " + users[i].lastName + "<br></br>" +
            "Password: " + users[i].password + "<br></br>" +
            "</li>";
    }

    var html = "<ul>" + usershtml + "</ul>";
    res.send(html);
});

app.get('/login', (req, res) => {
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

    var usershtml = "";
    for (i = 0; i < users.length; i++) {
        if (users[i].email == email) {
            if (bcrypt.compareSync(password, users[i].password)) {
                res.redirect('/loggedIn');
                return;
            }
        }
    }

    //User and Password combination not found
    res.redirect('/login?msg=Invalid Email/Password!');
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});

//Serves the static assets from the specified directory
app.use(express.static(__dirname + '/public'));
