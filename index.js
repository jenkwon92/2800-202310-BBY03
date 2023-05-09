require("./utils.js");
require('dotenv').config();

const express = require('express');
const session = require('express-session');
const MongoStore = require('connect-mongo');

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
app.set('view engine', 'ejs');

/* Home Section */
app.get('/', (req, res) => {
    res.render('index');
});

/* Login Section */
app.get('/users', async (req, res) => {
    const users = await userCollection.find().toArray();
    res.render('users', { users });
});

// For developers to test on their local machine
app.listen(port, () => {
    console.log("Node application listening on port " + port);
});