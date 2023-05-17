// Import required modules
require("./utils.js");
require("dotenv").config();

const express = require("express");             // Import express
const session = require("express-session");     // Import express-session
const MongoStore = require("connect-mongo");    // Import connect-mongo
const bcrypt = require("bcrypt");               // Import bcrypt
const { ObjectId } = require("mongodb");        // Import ObjectId from mongodb
const port = process.env.PORT || 3000;          // Set the port to 3000 or the port specified in the environment
const app = express();                          // Create an express application
const Joi = require("joi");                     // Import Joi
const jwt = require("jsonwebtoken");            // Import jsonwebtoken
const nodemailer = require("nodemailer");       // Import nodemailer
const saltRounds = 12;                          // Set the number of salt rounds for bcrypt

// Our website URL
const WebsiteURL = "http://wjxdvnhtuk.eu09.qoddiapp.com";

// Set expiration time for session to 1 hour
const expireTime = 1 * 60 * 60 * 1000;

// Secret Information Section
const mongodb_host = process.env.MONGODB_HOST;
const mongodb_user = process.env.MONGODB_USER;
const mongodb_password = process.env.MONGODB_PASSWORD;
const mongodb_database = process.env.MONGODB_DATABASE;
const mongodb_session_secret = process.env.MONGODB_SESSION_SECRET;
const node_session_secret = process.env.NODE_SESSION_SECRET;
const JWT_SECRET = process.env.JWT_SECRET;
// End Secret Information Section

// Session Section
const mongoStore = MongoStore.create({
    mongoUrl: `mongodb+srv://${mongodb_user}:${mongodb_password}@${mongodb_host}/sessions`,
    crypto: {
        secret: mongodb_session_secret,
    },
});

// Database Section
const { database } = require("./databaseConnection");                           // Import the database connection
const userCollection = database.db(mongodb_database).collection("users");       // Specify the collection to store users
const coursesCollection = database.db(mongodb_database).collection("courses");  // Specify the collection to store courses

// Set the ejs view engine
app.set("view engine", "ejs");

// Middleware
app.use(express.urlencoded({ extended: false }));   // Handles URL-encoded form data.
app.use(express.static(__dirname + "/public"));     // Serves the static assets from the specified directory

app.use(
    session({
        secret: node_session_secret,
        store: mongoStore,
        saveUninitialized: false,
        resave: true,
        cookie: {
            maxAge: 3600000, // Set session expiration time to 1 hour
        },
    })
);

// Check if the session is valid
function isValidSession(req) {
    return req.session.authenticated || false;
}

// Middleware to check session validation
function sessionValidation(req, res, next) {
    if (isValidSession(req)) {
        next();
    } else {
        res.redirect("/login");
    }
}

/* Home Section */

const mycollection = "mycollection";

// Renders the index page
app.get('/', (req, res) => {
    if (!req.session.authenticated) {
        res.render("index");
    }
    else {
        res.redirect('/main');
    }
});

// Renders the dataset page
app.get("/dataset", async (req, res) => {
    res.render("dataset");
});

const multer = require("multer");
const upload = multer({ dest: __dirname + "/public" + "/dataset" + "/" }); // specify the upload directory

// Imports a CSV file, reads its data, creates an object using the headers as keys, inserts the data into a MongoDB collection.
app.post("/datasetUpload", upload.single("csvfile"), async (req, res) => {
    const csvfile = req.file.path; // get the path of the uploaded file
    console.log(`Received file ${csvfile}`);

    try {
        const stream = fs.createReadStream(csvfile).pipe(csv());
        let keys = null;
        for await (const data of stream) {

            // Use the first row of the CSV file to create object keys
            if (!keys) {
                keys = Object.keys(data);
            }

            // Convert data to an object to be inserted into the collection
            const course = {};
            keys.forEach((key) => {
                course[key] = data[key];
            });

            // Insert the course object into the collection
            coursesCollection.insertOne(course);
        }
        console.log("Import complete!");
        res.redirect("/dataset");
    } catch (err) {
        console.error(`Error importing CSV file: ${err.message}`);
        res.status(500).send(`Error importing CSV file: ${err.message}`);
    }
});

// Renders the main page
app.get("/main", sessionValidation, (req, res) => {
    res.render("main", {
        authenticated: req.session.authenticated,
        username: req.session.username,
    });
});

// Renders the my courses page
app.get('/myCourses', (req, res) => {
    res.render('myCourses');
});

// Renders the course detail page
app.get("/courseDetail", (req, res) => {
    res.render("courseDetail");
});

/* Profile Section */

// renders profile
app.get("/profile", sessionValidation, (req, res) => {
    // When the user is not logged in - login page
    // When the user is logged in - profile page
    res.render("profile", {
        authenticated: req.session.authenticated,
        username: req.session.username,
        email: req.session.email, // Include the email variable here
        job: req.session.job,
    });
});

// edit basic profile Section
app.get("/editProfile", sessionValidation, (req, res) => {
    // When the user not logged in - login page
    // When the user logged in - profile page
    res.render("editProfile", {
        authenticated: req.session.authenticated,
        username: req.session.username,
        email: req.session.email,
        job: req.session.job,
    });
});

// edit skill Section
app.get("/editSkill", sessionValidation, (req, res) => {
    res.render("editSKill");
});

// edit interest Section
app.get("/editInterest", sessionValidation, (req, res) => {
    res.render("editInterest");
});

//update the user profile
app.post("/submitProfile", async (req, res) => {
    const { job, email } = req.body;

    try {
        // Retrieve the existing email from the database
        const existingUser = await userCollection.findOne(
            { username: req.session.username },
            { projection: { email: 1 } } // Specify to include only the email field
        );
        const existingEmail = existingUser.email;

        // Use the existing email as a fallback if the email field is empty in the form submission
        const updatedEmail = email || existingEmail;

        // Update the user's profile in the database
        const updateResult = await userCollection.updateOne(
            { username: req.session.username },
            { $set: { job, email: updatedEmail } }
        );

        if (updateResult.modifiedCount === 1) {
            // Update the session with the new profile information
            req.session.job = job;
            req.session.email = updatedEmail;

            // Redirect to the profile page on successful update
            res.redirect("/profile");
        } else {
            throw new Error("Failed to update user profile");
        }
    } catch (error) {
        console.error(error);
        // Display an error message to the user
        res.status(500).send("Error updating profile");
    }
});
/* Profile Section end */

/* Sign Up Section */
// Renders the signup page
app.get("/signup", (req, res) => {
    var msg = req.query.msg || "";

    res.render("signUp", { msg: msg });
});

// Creates a new user
app.post("/submitUser", async (req, res) => {
    const { email, username, firstName, lastName, password } = req.body;

    // Check if user with the same email or username already exists
    const existingUser = await userCollection.findOne({
        $or: [{ email: email }, { username: username }],
    });

    // If user already exists, return error message
    if (existingUser) {
        if (existingUser.email === email) {
            res.render("signUp", { msg: "User with this email already exists." });
            return;
        } else {
            res.render("signUp", { msg: "User with this username already exists." });
            return;
        }
    }

    const schema = Joi.object({
        email: Joi.string()
            .email()
            .required()
            .messages({ "string.empty": "Email is required" }),
        username: Joi.string()
            .alphanum()
            .max(20)
            .required()
            .messages({ "string.empty": "Username is required" }),
        firstName: Joi.string()
            .required()
            .messages({ "string.empty": "First name is required" }),
        password: Joi.string()
            .max(20)
            .required()
            .messages({ "string.empty": "Password is required" }),
    });

    const validationResult = schema.validate({
        email,
        username,
        firstName,
        password,
    });
    if (validationResult.error != null) {
        console.log(validationResult.error);
        var errorMessage = validationResult.error.details[0].message;
        res.render("signUp", { msg: errorMessage });
        return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create new user
    const newUser = {
        email: email,
        username: username,
        firstName: firstName,
        lastName: lastName,
        password: hashedPassword,
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
/* Sign Up Section end */

/* Login Section */
// Renders the login page
app.get("/login", (req, res) => {
    // Show error message if there is one
    var msg = req.query.msg || "";

    res.render("login", { msg: msg });
});

app.post("/submitLogin", async (req, res) => {
    var email = req.body.email;
    var password = req.body.password;

    const schema = Joi.string().required();
    const validationResult = schema.validate(email);

    // If email is invalid, return error message
    if (validationResult.error != null) {
        console.log(validationResult.error);
        res.render("login", { msg: "Invalid Email!" });
        return;
    }

    const user = await userCollection.findOne({ email: email });

    // If email does not exist, return error message
    if (!user) {
        console.log("Email not found");
        res.render("login", { msg: "User with this email does not exist." });
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
        res.render("login", { msg: "Password is incorrect." });
        return;
    }

    res.redirect("/main");
});
/* Login Section end */

/* Password Recovery Section */
// Renders the forgot password page
app.get("/forgotPassword", (req, res, next) => {
    var msg = req.query.msg || "";
    var msgType = req.query.msgType || "";

    res.render("forgotPassword", { msg: { text: msg, type: msgType } });
});

// Sends the reset password email
app.post("/forgotPassword", async (req, res, next) => {
    const { email } = req.body;

    const user = await userCollection.findOne({ email: email });

    if (!user) {
        res.render("forgotPassword", { msg: { text: "User email not found!", type: "error" } });
    } else {
        const secret = JWT_SECRET + user.password;
        const payload = {
            email: email,
            id: user._id,
        };
        const token = jwt.sign(payload, secret, { expiresIn: "15m" });
        const link = `${WebsiteURL}/resetPassword/${user._id}/${token}`;

        const transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 465,
            secure: true,
            auth: {
                user: process.env.COURSEPILOT_SUPPORT_EMAIL,
                pass: process.env.COURSEPILOT_SUPPORT_PASSWORD,
            },
        });

        // send mail with defined transport object
        const mailOptions = {
            from: `"CoursePilot" <${process.env.COURSEPILOT_SUPPORT_EMAIL}>`, // Sender address
            to: user.email, // Recipient address
            subject: "CoursePilot Password Recovery", // Subject line
            html: `<p>Please click this <a href="${link}">link</a> to reset your password.</p>`, // HTML body
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log(error);
                return res.render("forgotPassword", { msg: { text: "An error occurred while sending the email.", type: "error" } });
            }

            console.log("Email sent: " + info.response);
            res.render("forgotPassword", { msg: { text: "Password reset link has been sent!", type: "success" } });
        });
    }
});

// Renders the reset password page
app.get("/resetPassword/:id/:token", async (req, res, next) => {
    // Get user id and token from URL
    const { id, token } = req.params;

    // Check if the id parameter is a valid ObjectId
    if (!ObjectId.isValid(id)) {
        return res.render("error", { errorMessage: "Invalid ID!" });
    }

    // Find user in the database
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    // If user does not exist, render error message
    if (!user) {
        return res.render('error', { errorMessage: "ID not found!" });
    }

    // Create secret for JWT
    const secret = JWT_SECRET + user.password;
    try {
        const payload = jwt.verify(token, secret);
        res.render("resetPassword", { email: user.email });
    } catch (error) {
        console.log(error);
        return res.render("error", { errorMessage: "Invalid token!" });
    }
});

// Resets the user's password
app.post("/resetPassword/:id/:token", async (req, res, next) => {
    // Get user id and token from URL
    const { id, token } = req.params;

    // Get new password from form
    const { newPassword } = req.body;

    // Find user in the database
    const user = await userCollection.findOne({ _id: new ObjectId(id) });

    // If user does not exist, render error message
    if (!user) {
        return res.render('error', { errorMessage: "ID not found!" });
    }

    // Create secret for JWT
    const secret = JWT_SECRET + user.password;
    try {
        // Verify the token
        const payload = jwt.verify(token, secret);

        // Hash the new password
        user.password = await bcrypt.hash(newPassword, saltRounds);

        // Update password in the database
        await userCollection.updateOne(
            { _id: new ObjectId(id) },
            { $set: { password: user.password } }
        );

        // Password successfully updated
        res.render("passwordUpdated");
    } catch (error) {
        console.log(error);
        return res.render("error", { errorMessage: "Invalid token!" });
    }
});

/* Password Recovery Section end */

// Renders the chatbot page
app.get("/chatbot", (req, res) => {
    res.render("chatbot");
});

/* Search Section */
// Renders the search page
app.get("/search", (req, res) => {
    const searchQuery = req.query.search; // Get the search query from the URL query parameters
    const page = parseInt(req.query.page) || 1; // Get the page number from the URL query parameters, default to 1 if not provided
    const itemsPerPage = 10; // Set the number of items to display per page

    if (!searchQuery) {
        // If searchQuery is empty, render the search page without results
        res.render("search", { courses: [], searchQuery, page: 1, totalPages: 1 });
        return;
    }

    // Create a regex pattern to match the search query in a case-insensitive manner
    const escapedSearchQuery = searchQuery.replace(/[-.*+?^${}()|[\]\\]/g, '\\$&');
    const searchRegex = new RegExp(escapedSearchQuery, "i");

    // Count the total number of matching documents
    const totalCountPromise = coursesCollection.countDocuments({
        $or: [{ title: searchRegex }, { details: searchRegex }],
    });

    // Search for courses that match the search query with pagination
    const searchPromise = coursesCollection
        .find({ $or: [{ title: searchRegex }, { details: searchRegex }] })
        .skip((page - 1) * itemsPerPage)
        .limit(itemsPerPage)
        .toArray();

    Promise.all([totalCountPromise, searchPromise])
        .then(([totalCount, results]) => {
            const totalPages = Math.ceil(totalCount / itemsPerPage);

            res.render("search", {
                courses: results,
                searchQuery: searchQuery,
                page,
                totalPages,
            });
        })
        .catch((error) => {
            console.error("Error finding documents:", error);
            res.render("error"); // Render an error page if there's an error
        });
});
/* Search Section end */

// Renders the user to the root URL after the session is destroyed (logged out).
app.get("/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log(err);
        } else {
            res.redirect("/");
        }
    });
});

// Renders the custom 404 error page to users instead of displaying a generic error message or a stack trace.
app.get("*", (req, res) => {
    res.status(404);
    res.render("404");
});

// For developers to test on their local machine
app.listen(port, () => {
    console.log("Node application listening on port " + port);
});
