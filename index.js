// Import required modules
require("./utils.js");
require("dotenv").config();

const express = require("express"); // Import express
const session = require("express-session"); // Import express-session
const MongoStore = require("connect-mongo"); // Import connect-mongo
const bcrypt = require("bcrypt"); // Import bcrypt
const { ObjectId } = require("mongodb"); // Import ObjectId from mongodb
const port = process.env.PORT || 3000; // Set the port to 3000 or the port specified in the environment
const app = express(); // Create an express application
const Joi = require("joi"); // Import Joi
const jwt = require("jsonwebtoken"); // Import jsonwebtoken
const nodemailer = require("nodemailer"); // Import nodemailer
const saltRounds = 12; // Set the number of salt rounds for bcrypt
const bodyParser = require("body-parser"); // Middleware for parsing request bodies

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
const { database } = require("./databaseConnection"); // Import the database connection
const userCollection = database.db(mongodb_database).collection("users"); // Specify the collection to store users
const coursesCollection = database.db(mongodb_database).collection("courses"); // Specify the collection to store courses

// Set the ejs view engine
app.set("view engine", "ejs");

// Sets the session
app.use(
  session({
    secret: node_session_secret,
    store: mongoStore,
    saveUninitialized: false,
    resave: true,
    cookie: {
      maxAge: 3600000, // set session expiration time to 1 hour
    },
  })
);

// Middleware
app.use(express.urlencoded({ extended: false })); // Handles URL-encoded form data.
app.use(express.static(__dirname + "/public")); // Serves the static assets from the specified directory

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

// Parse JSON bodies
app.use(bodyParser.json());

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
app.get("/", (req, res) => {
  if (!req.session.authenticated) {
    res.render("index");
  } else {
    res.redirect("/main");
  }
});

// Renders the dataset page
app.get("/dataset", async (req, res) => {
  res.render("dataset");
});

const multer = require("multer");
const data_upload = multer({ dest: "./public/dataset" }); // specify the upload directory

// Imports a CSV file, reads its data, creates an object using the headers as keys, inserts the data into a MongoDB collection.
app.post("/datasetUpload", data_upload.single("csvfile"), async (req, res) => {
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

// Helper function to select a random subset of courses from an array
function getRandomCourses(courses, count) {
  const shuffled = courses.sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

// Renders the main page
app.get("/main", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    // Retrieve user's interests from db
    const userInterests = user.interests || [];

    // Create a case-insensitive regular expression pattern for matching interests
    const interestsPattern = new RegExp(userInterests.map(interest => `\\b${interest}\\b`).join("|"), "i");

    // Retrieve courses matching the user's interests (case-insensitive)
    const recommendedCourses = await coursesCollection
      .find({ tags: interestsPattern })
      .toArray();

    // Select a random subset of 2 courses from the recommended courses
    const randomCourses = getRandomCourses(recommendedCourses, 2);

    res.render("main", {
      authenticated: req.session.authenticated,
      username: req.session.username,
      recommendedCourses: randomCourses,
    });
  } catch (error) {
    console.error("Error retrieving course recommendation:", error);
    res.status(500).send("Error retrieving course recommendation");
  }
});

// Renders the my courses page
app.get("/myCourses", (req, res) => {
  res.render("myCourses");
});

// Renders the course detail page
app.get("/courseDetail", (req, res) => {
  res.render("courseDetail");
});

/* Recommendation Section */

const recommendedCourseLimit = 100; // Limit the number of initially recommended courses

app.get("/recommendation", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    // Retrieve user's interests from db
    const userInterests = user.interests || [];
    const interestsPattern = new RegExp(userInterests.map(interest => `\\b${interest}\\b`).join("|"), "i");

    // Retrieve courses matching the user's interests (case-insensitive)
    const recommendedCourses = await coursesCollection
      .find({ tags: interestsPattern })
      .limit(recommendedCourseLimit)
      .toArray();
    console.log(recommendedCourses);
    if (recommendedCourses.length === 0) {
      throw new Error("No recommended courses found");
    }

    res.render("recommendation", { recommendedCourses: recommendedCourses, username: req.session.username });
  } catch (error) {
    console.error("Error retrieving course recommendation:", error);
    res.status(500).send("Error retrieving course recommendation");
  }
});

// Generate more button click event
app.get("/generateMore", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    // Retrieve user's interests from db
    const userInterests = user.interests || [];
    const interestsPattern = new RegExp(userInterests.map(interest => `\\b${interest}\\b`).join("|"), "i");

    // Retrieve all recommended courses for the user
    const allRecommendedCourses = await coursesCollection
      .find({ tags: interestsPattern })
      .toArray();

    // Get the number of initially recommended courses
    const recommendedCourseLimit = 5;

    // Calculate the number of additional courses to generate
    const additionalCourseLimit = 5;

    // Determine the starting index for additional courses
    const startIndex = recommendedCourseLimit + req.session.generatedCoursesCount;

    // Calculate the ending index for additional courses
    const endIndex = startIndex + additionalCourseLimit;

    // Retrieve the additional recommended courses based on the index range
    const additionalRecommendedCourses = allRecommendedCourses.slice(startIndex, endIndex);

    // Update the generated courses count in the session
    req.session.generatedCoursesCount += additionalRecommendedCourses.length;

    res.json({ additionalRecommendedCourses });
  } catch (error) {
    console.error("Error retrieving additional recommended courses:", error);
    res.status(500).send("Error retrieving additional recommended courses");
  }
});

/* Recommendation Section end */

/* Profile Section */

app.get("/profile", async (req, res) => {
  var isAuthenticated = req.session.authenticated || false;

  if (!isAuthenticated) {
    res.redirect("/login");
  } else {
    try {
      const user = await userCollection.findOne({
        username: req.session.username,
      });

      if (!user) {
        throw new Error("User not found");
      }

      res.render("profile", {
        authenticated: req.session.authenticated,
        username: req.session.username,
        email: user.email,
        job: user.job,
        image: user.image || "/images/profile/avatar-1.webp", // Add the 'image' variable here
        skills: user.skills || [], // Add the 'skills' variable here with a default value of an empty array
        interests: user.interests || [], // Add the 'skills' variable here with a default value of an empty array
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user profile");
    }
  }
});

app.get("/editProfile", async (req, res) => {
  var isAuthenticated = req.session.authenticated || false;

  // When the user is not logged in - login page
  // When the user is logged in - profile page
  if (!isAuthenticated) {
    res.redirect("/login");
  } else {
    try {
      const user = await userCollection.findOne({
        username: req.session.username,
      });

      if (!user) {
        throw new Error("User not found");
      }

      res.render("editProfile", {
        authenticated: req.session.authenticated,
        username: req.session.username,
        email: user.email,
        job: user.job,
        image: user.image || "/images/profile/avatar-1.webp",
        skills: user.skills || [], // Use the user's skills field directly
        interests: user.interests || [], // Use the user's interests field directly
      });
    } catch (error) {
      console.error(error);
      res.status(500).send("Error retrieving user profile");
    }
  }
});

app.get("/editSkill", async (req, res) => {
  try {
    // Retrieve user information from the user database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    if (user) {
      // Get the 'interests' field from the user db
      const skills = user.skills || [];

      res.render("editSkill", {
        skills: skills,
      });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving skills");
  }
});

// edit interest Section
app.get("/editInterest", async (req, res) => {
  try {
    // Retrieve user information from the user database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    if (user) {
      // Get the 'interests' field from the user db
      const interests = user.interests || [];

      res.render("editInterest", {
        interests: interests,
      });
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving interests");
  }
});

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/profile");
  },
  filename: function (req, file, cb) {
    const extension = file.mimetype.split("/")[1];
    cb(null, `${req.session.username}.${extension}`);
  },
});

// Initialize multer middleware for file upload with the specified storage configuration
const upload = multer({ storage: storage });

// update the user profile(username, email, job, image)
app.post("/submitProfile", upload.single("image"), async (req, res) => {
  const { name, job, email, skills } = req.body;
  let image = null;

  if (req.file) {
    image = `/images/profile/${req.session.username}.${req.file.filename
      .split(".")
      .pop()}`;
    req.session.image = image; // Update session image
  } else if (req.session.image) {
    image = req.session.image;
  }

  try {
    // Update the user's profile in the database
    const updateFields = { job, email, image, skills };

    // Exclude 'name' from updateFields if it is not provided
    if (name) {
      updateFields.name = name;
    }

    const updateResult = await userCollection.updateOne(
      { username: req.session.username },
      { $set: updateFields }
    );

    if (updateResult.modifiedCount === 1) {
      // Update the session with the new profile information
      req.session.name = name;
      req.session.job = job;
      req.session.email = email;
      req.session.skills = skills;
      req.session.interests = interests;

      // Save user's skills in the skills collection
      const skillList = skills.split(",");

      await skillCollection.deleteMany({ userId: req.session.username }); // Remove existing user skills

      for (const skill of skillList) {
        await skillCollection.insertOne({
          userId: req.session.username,
          skill,
        });
      }

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

//update the user's skill
app.post("/saveSkills", sessionValidation, async (req, res) => {
  try {
    const { skills } = req.body;
    const username = req.session.username;

    if (!skills) {
      throw new Error("Skills data is missing");
    }

    const skillList = skills.split(",").map((skill) => skill.trim());
    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { skills: skillList } }
    );
    if (updateResult.modifiedCount === 1) {
      res.sendStatus(200); // Skills saved successfully
    } else {
      throw new Error("Failed to save skills");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving skills"); // Error saving skills
  }
});

//update the user's interests
app.post("/saveInterests", sessionValidation, async (req, res) => {
  try {
    const { interests } = req.body;
    const username = req.session.username;

    if (!interests) {
      throw new Error("Interests data is missing");
    }

    const interestList = interests
      .split(",")
      .map((interest) => interest.trim());
    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { interests: interestList } }
    );
    if (updateResult.modifiedCount === 1) {
      res.sendStatus(200); // Interests saved successfully
    } else {
      throw new Error("Failed to save interests");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving interests"); // Error saving interests
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

// logout
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    } else {
      res.redirect("/");
    }
  });
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
    res.render("forgotPassword", {
      msg: { text: "User email not found!", type: "error" },
    });
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
        return res.render("forgotPassword", {
          msg: {
            text: "An error occurred while sending the email.",
            type: "error",
          },
        });
      }

      console.log("Email sent: " + info.response);
      res.render("forgotPassword", {
        msg: { text: "Password reset link has been sent!", type: "success" },
      });
    });
  }
});

// Renders the reset password page
app.get("/resetPassword/:id/:token", async (req, res, next) => {
  // Get user id and token from url
  const { id, token } = req.params;

  // Find user in database
  const user = await userCollection.findOne({ _id: new ObjectId(id) });

  // If user does not exist, return error message
  if (!user) {
    return res.render("error", { errorMessage: "ID not found!" });
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
  // Get user id and token from url
  const { id, token } = req.params;

  // Get new password from form
  const { newPassword } = req.body;

  // Find user in database
  const user = await userCollection.findOne({ _id: new ObjectId(id) });

  // If user does not exist, return error message
  if (!user) {
    return res.render("error", { errorMessage: "ID not found!" });
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
  const escapedSearchQuery = searchQuery.replace(
    /[-.*+?^${}()|[\]\\]/g,
    "\\$&"
  );
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

// Renders the custom 404 error page to users instead of displaying a generic error message or a stack trace.
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});

// For developers to test on their local machine
app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
