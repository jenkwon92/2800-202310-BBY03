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
const bodyParser = require("body-parser");      // Middleware for parsing request bodies
const { Configuration, OpenAIApi } = require("openai"); // Import ObjectId from openai

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
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
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

/* Main Section */

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

app.get("/main", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    const userCourses = user.myCourses || [];
    let myCoursesData = [];

    for (const courseId of userCourses) {
      const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
      if (course) {
        myCoursesData.push(course);
      }
    }

    // Retrieve user's interests from db
    const userInterests = user.interests || [];

    // Create a case-insensitive regular expression pattern for matching interests
    const interestsPattern = new RegExp(`\\b(${userInterests.join("|")})\\b`, "i");

    // Retrieve courses matching the user's interests (case-insensitive)
    const recommendedCourses = await coursesCollection
      .find({ tags: interestsPattern })
      .toArray();

    // Select a random subset of 2 courses from the recommended courses
    const randomCourses = getRandomCourses(recommendedCourses, 2);

    // Retrieve the user's image path from the user object
    const userImage = user.image || "/images/profile/default.jpg";

    res.render("main", {
      authenticated: req.session.authenticated,
      username: req.session.username,
      recommendedCourses: randomCourses,
      myCourses: myCoursesData,
      userImage: userImage,
    });
  } catch (error) {
    console.error("Error retrieving course recommendation:", error);
    res.status(500).send("Error retrieving course recommendation");
  }
});

// Renders the my courses page
app.get("/myCourses", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    const userCourses = user.myCourses || [];

    // Retrieve user's interests from the database
    let myCoursesData = [];

    for (const courseId of userCourses) {
      const course = await coursesCollection.findOne({ _id: new ObjectId(courseId) });
      if (course) {
        myCoursesData.push(course);
      }
    }
    console.log('myCoursesData', myCoursesData);

    res.render("myCourses", { myCourses: myCoursesData, username: req.session.username });
  } catch (error) {
    console.error("Error retrieving course recommendation:", error);
    res.status(500).send("Error retrieving course recommendation");
  }
});


// Renders the course detail page
app.get("/courseDetail", (req, res) => {
  res.render("courseDetail");
});

/* Recommendation Section */

// Limit the number of initially recommended courses
const recommendedCourseLimit = 5; 

// Renders the recommendation page
app.get("/recommendation", sessionValidation, async (req, res) => {
  try {
    // Retrieve user information from the database
    const user = await userCollection.findOne({
      username: req.session.username,
    });

    // Retrieve user's interests from the database
    const userInterests = user.interests || [];
    const interestsPattern = new RegExp(userInterests.map(interest => `\\b${interest}\\b`).join("|"), "i");

    // Retrieve courses matching the user's interests (case-insensitive)
    let recommendedCourses = await coursesCollection
      .find({ tags: interestsPattern })
      .limit(recommendedCourseLimit)
      .toArray();

    // If no matching courses found, retrieve random courses from the course collection
    if (recommendedCourses.length === 0) {
      recommendedCourses = await coursesCollection.aggregate([
        { $sample: { size: recommendedCourseLimit } }
      ]).toArray();
    }

    // If matching courses are empty, retrieve random courses from the course collection
    if (recommendedCourses.length === 0) {
      throw new Error("No recommended courses found");
    }

    res.render("recommendation", { recommendedCourses, username: req.session.username });
  } catch (error) {
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
    res.status(500).send("Error retrieving additional recommended courses");
  }
});

/* Recommendation Section end */


/* Profile Section */

// Renders the profile page
app.get("/profile", async (req, res) => {
  var isAuthenticated = req.session.authenticated || false;  // Check if the user is authenticated

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {  
    res.redirect("/login");
  } else {
    try {
      const user = await userCollection.findOne({            // Retrieve user data from the database
        username: req.session.username,
      });

      if (!user) {  // If user not found, throw an error
        throw new Error("User not found");
      }

      // Set the default image URL if the image is not available or has an unknown path
      const image = user.image || "/images/profile/default.jpg";

      res.render("profile", {                                // Render the 'profile' template with the user data
        authenticated: req.session.authenticated,            // Pass the authentication status
        username: req.session.username,                      // Pass the username
        email: user.email,                                   // Pass the user's email
        firstName: user.firstName,                           // Pass the user's first name
        lastName: user.lastName,                             // Pass the user's last name
        job: user.job,                                       // Pass the user's job
        image: image,                                        // Pass the user's profile image URL
        skills: user.skills || [],                           // Add the 'skills' variable here with a default value of an empty array
        interests: user.interests || [],                     // Add the 'interests' variable here with a default value of an empty array
      });
    } catch (error) {
      res.status(500).send("Error retrieving user profile"); // Send an error response if there is an error
    }
  }
});

// Renders the editProfile page
app.get("/editProfile", async (req, res) => {
  var isAuthenticated = req.session.authenticated || false;  // Check if the user is authenticated

  // If not authenticated, redirect to the login page
  if (!isAuthenticated) {  
    res.redirect("/login");
  } else {
    try {
      const user = await userCollection.findOne({            // Retrieve user data from the database
        username: req.session.username,
      });

      if (!user) {  // If user not found, throw an error
        throw new Error("User not found");
      }

      // Set the default image URL if the image is not available or has an unknown path
      const image = user.image || "/images/profile/default.jpg";

      res.render("editProfile", {  
        authenticated: req.session.authenticated,            // Pass the authentication status
        username: req.session.username,                      // Pass the username
        email: user.email,                                   // Pass the user's email
        firstName: user.firstName,                           // Pass the user's first name
        lastName: user.lastName,                             // Pass the user's last name
        job: user.job,                                       // Pass the user's job
        image: image,                                        // Pass the user's profile image URL
        skills: user.skills || [],                           // Use the user's skills field directly
        interests: user.interests || [],                     // Use the user's interests field directly
      });
    } catch (error) {
      res.status(500).send("Error retrieving user profile"); // Send an error response if there is an error
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
app.get("/editInterest", sessionValidation, async (req, res) => {
  try {
    const username = req.session.username;
    const user = await userCollection.findOne({ username: username });
    if (user) {
      const interests = user.interests || [];

      res.render("editInterest", { interests: interests });
    } else {
      res.redirect("/"); // Redirect to the appropriate route if the user is not found
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving interests");
  }
});


const path = require("path");

// Set up multer for handling file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "public/images/profile"));
  },
  filename: function (req, file, cb) {
    const fileExtension = file.originalname.split(".").pop();
    const filename = `${req.session.username}.${fileExtension}`;
    cb(null, filename);
  },
});

// Initialize multer middleware for file upload with the specified storage configuration
const upload = multer({ storage: storage });

app.post("/submitProfile", upload.single("image"), async (req, res) => {
  const { name, job, email, firstName, lastName } = req.body;
  let image = null;

  if (req.file) {
    // Generate a new image path with the user's username and file extension
    const fileExtension = req.file.filename.split(".").pop();
    const newFilename = `${req.session.username}.${fileExtension}`;
    const newFilePath = `/images/profile/${newFilename}`;

    // Move the uploaded file to the desired location
    const currentFilePath = req.file.path;
    const destinationPath = path.join(__dirname, "public", newFilePath);

    fs.renameSync(currentFilePath, destinationPath);

    image = newFilePath;
    req.session.image = image; // Update session image
  } else if (req.session.image) {
    image = req.session.image;
  } else {
    // Set the default image URL
    image = "/images/profile/default.jpg";
  }

  try {
    // Update the user's profile image in the database
    const updateResult = await userCollection.updateOne(
      { username: req.session.username },
      { $set: { image } }
    );

    if (updateResult.modifiedCount !== 1) {
      throw new Error("Failed to update user profile image");
    }

    // Update the session with the new profile information
    req.session.name = name;
    req.session.job = job;
    req.session.email = email;
    req.session.firstName = firstName;
    req.session.lastName = lastName;
    req.session.image = image;

    // Redirect to the profile page on successful update
    res.redirect("/profile");
  } catch (error) {
    console.error(error);
    // Redirect to the profile page on error
    res.redirect("/profile");
  }
});

app.post("/saveSkills", sessionValidation, async (req, res) => {
  try {
    const { skills } = req.body;
    const username = req.session.username;

    if (!skills) {
      throw new Error("skills data is missing");
    }

    const skillList = Array.isArray(skills) ? skills.map((skill) => skill.trim()) : [];

    const existingUser = await userCollection.findOne({ username: username });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingSkills = existingUser.skills || [];
    const updatedSkills = [...new Set([...existingSkills, ...skillList])];

    if (JSON.stringify(existingSkills) === JSON.stringify(updatedSkills)) {
      // Interests are the same, no need to update
      res.json({ success: true }); // Interests saved successfully
      return;
    }

    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { skills: updatedSkills } }
    );

    if (updateResult && updateResult.modifiedCount === 1) {
      req.session.skills = updatedSkills; // Update session skills
      res.json({ success: true }); // Skills saved successfully
    } else {
      throw new Error("Failed to save skills");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving skills"); // Error saving skills
  }
});

//remove the user's skill
app.post("/removeSkill", sessionValidation, async (req, res) => {
  try {
    const { skill } = req.body;
    const username = req.session.username;

    if (!skill) {
      throw new Error("skill data is missing");
    }

    const existingUser = await userCollection.findOne({ username: username });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingSkills = existingUser.skills || [];
    const updatedSkills = existingSkills.filter(i => i !== skill);

    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { skills: updatedSkills } }
    );

    if (updateResult.modifiedCount >= 1) {
      console.log('Skill deleted successfully');
      res.sendStatus(200); 
    } else {
      throw new Error("Failed to delete Skill");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting interest"); 
  }
});

app.post("/saveInterests", sessionValidation, async (req, res) => {
  try {
    const { interests } = req.body;
    const username = req.session.username;

    if (!interests) {
      throw new Error("Interests data is missing");
    }

    const interestList = Array.isArray(interests) ? interests.map((interest) => interest.trim()) : [];

    const existingUser = await userCollection.findOne({ username: username });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingInterests = existingUser.interests || [];
    const updatedInterests = [...new Set([...existingInterests, ...interestList])];

    if (JSON.stringify(existingInterests) === JSON.stringify(updatedInterests)) {
      // Interests are the same, no need to update
      res.json({ success: true }); // Interests saved successfully
      return;
    }

    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { interests: updatedInterests } }
    );

    if (updateResult && updateResult.modifiedCount === 1) {
      req.session.interests = updatedInterests; // Update session interests
      res.json({ success: true }); // Interests saved successfully
    } else {
      throw new Error("Failed to save interests");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving interests"); // Error saving interests
  }
});

//remove the user's interest
app.post("/removeInterest", sessionValidation, async (req, res) => {
  try {
    const { interest } = req.body;
    const username = req.session.username;

    if (!interest) {
      throw new Error("Interest data is missing");
    }

    const existingUser = await userCollection.findOne({ username: username });
    if (!existingUser) {
      throw new Error("User not found");
    }

    const existingInterests = existingUser.interests || [];
    const updatedInterests = existingInterests.filter(i => i !== interest);

    const updateResult = await userCollection.updateOne(
      { username: username },
      { $set: { interests: updatedInterests } }
    );

    if (updateResult.modifiedCount >= 1) {
      console.log('Interest deleted successfully');
      res.sendStatus(200); // Interest deleted successfully
    } else {
      throw new Error("Failed to delete interest");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error deleting interest"); // Error deleting interest
  }
});
/* Profile Section end */

/* Sign Up Section */
// Renders the signup page
app.get("/signup", (req, res) => {
  var msg = req.query.msg || "";

  var isAuthenticated = req.session.authenticated || false;

  if (isAuthenticated) {
    return res.redirect("/main");
  } else {
  res.render("signUp", { msg: msg });
  }
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
    email: Joi.string().email().required().messages({
      "string.empty": "Email is required",
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),
    username: Joi.string().alphanum().max(20).required().messages({
      "string.empty": "Username is required",
      "string.alphanum": "Username must only contain alphanumeric characters",
      "string.max": "Username must not exceed 20 characters",
      "any.required": "Username is required",
    }),
    firstName: Joi.string().required().messages({
      "string.empty": "First name is required",
      "any.required": "First name is required",
    }),
    lastName: Joi.string().allow("").optional(),
    password: Joi.string().max(30).required().messages({
      "string.empty": "Password is required",
      "string.max": "Password must not exceed 30 characters",
      "any.required": "Password is required",
    }),
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

  var isAuthenticated = req.session.authenticated || false;

  if (isAuthenticated) {
    return res.redirect("/main");
  } else {
    res.render("login", { msg: msg });
  }
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
  const { email, password } = req.body;

  const schema = Joi.object({
    email: Joi.string()
      .email({ tlds: { allow: false } })
      .required()
      .messages({
        "string.empty": "Email is required",
        "string.email": "Please provide a valid email address",
        "any.required": "Email is required",
      }),
    password: Joi.string().required().messages({
      "string.empty": "Password is required",
      "any.required": "Password is required",
    }),
  });

  const validationResult = schema.validate({ email, password });

  if (validationResult.error) {
    const errorMessage = validationResult.error.details[0].message;
    return res.render("login", { msg: errorMessage });
  }

  const user = await userCollection.findOne({ email: email });

  if (!user) {
    console.log("Email not found");
    return res.render("login", { msg: "User with this email does not exist." });
  }

  const passwordMatch = await bcrypt.compare(password, user.password);

  if (passwordMatch) {
    req.session.authenticated = true;
    req.session.username = user.username;
    req.session.email = email;
    req.session.cookie.maxAge = expireTime;
  } else {
    console.log("Incorrect password");
    return res.render("login", { msg: "Password is incorrect." });
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

app.post("/resetPassword/:id/:token", async (req, res, next) => {
  const { id, token } = req.params;
  const { newPassword } = req.body;

  const schema = Joi.object({
    newPassword: Joi.string().required().messages({
      "string.empty": "New password is required",
      "any.required": "New password is required",
    }),
  });

  const validationResult = schema.validate({ newPassword });

  if (validationResult.error) {
    const errorMessage = validationResult.error.details[0].message;
    return res.render("error", { errorMessage: "Validation error!" });
  }

  const user = await userCollection.findOne({ _id: new ObjectId(id) });

  if (!user) {
    return res.render("error", { errorMessage: "ID not found!" });
  }

  const secret = JWT_SECRET + user.password;

  try {
    const payload = jwt.verify(token, secret);
    user.password = await bcrypt.hash(newPassword, saltRounds);

    await userCollection.updateOne(
      { _id: new ObjectId(id) },
      { $set: { password: user.password } }
    );

    return res.render("passwordUpdated");
  } catch (error) {
    console.log(error);
    return res.render("error", { errorMessage: "Invalid token!" });
  }
});

/* Password Recovery Section end */

/* Chatbot Section start */
// Renders the chatbot page
app.get("/chatbot", (req, res) => {
  res.render("chatbot");                              // Render the "chatbot" view when the "/chatbot" route is accessed
});

app.post("/chatbotMessages", async (req, res) => {
  const input = req.body.input;                       // Retrieve the input message from the request body

  const completion = await openai.createCompletion({
    model: "text-davinci-003",                        // Specify the model to use for text completion
    prompt: input,                                    // Set the input message as the prompt for the text completion
    max_tokens: 100,                                   // Limit the response to 20 tokens
  });

  const output = completion.data.choices[0].text;     // Extract the generated completion text
  res.json({ output: output });                       // Send the output response as JSON
});

app.get("/fineTuning", (req, res) => {
  res.render("fineTuning");                              // Render the "chatbot" view when the "/chatbot" route is accessed
});

app.post("/fineTuningProcess", (req, res) => {
  res.render("fineTuning");                              // Render the "chatbot" view when the "/chatbot" route is accessed
});

/* Chatbot Section end */

/* Search Section */
// Renders the search page
app.get("/search", sessionValidation, (req, res) => {
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
      res.render("404"); // Render an error page if there's an error
    });
});
/* Search Section end */

/* Course Detail Section */

// Renders the course detail page
app.get("/courseDetail/:courseId", sessionValidation, async (req, res) => {
  const courseId = req.params.courseId; // Get the courseId from the URL parameters
  const user = await userCollection.findOne({
    username: req.session.username,
  });

  const userCourses = user.myCourses || [];
  let isSaved = false; // Declare and assign initial value

  // Check if the course is saved in user's courses
  if (userCourses.includes(courseId)) {
    isSaved = true;
  }

  // Find the course with the given courseId
  coursesCollection
    .findOne({ _id: new ObjectId(courseId) })
    .then((course) => {
      if (!course) {
        res.render("error", { errorMessage: "Course not found" });
        return;
      }

      res.render("courseDetail", { course: course, isSaved: isSaved });
    })
    .catch((error) => {
      console.error("Error finding course:", error);
      res.render("404");
    });
});

// Add a course to my courses
app.post("/saveCourse", sessionValidation, async (req, res) => {
  try {
    const username = req.session.username;
    const courseId = req.body.courseId;

    const user = await userCollection.findOne({ username });

    if (user.myCourses.includes(courseId)) {
      // Course already saved, remove it from myCourses
      await userCollection.updateOne(
        { username },
        { $pull: { myCourses: courseId } }
      );
      res.sendStatus(200);
    } else {
      // Course not saved, add it to myCourses
      const result = await userCollection.updateOne(
        { username },
        { $push: { myCourses: courseId } }
      );
      if (result.modifiedCount === 0) {
        return res.status(400).send("Course already saved");
      }
      res.sendStatus(200);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error saving/removing a course from my courses");
  }
});

app.post("/removeCourse", sessionValidation, async (req, res) => {
  try {
    const username = req.session.username;
    const courseId = req.body.courseId;

    const user = await userCollection.findOne({ username });

    if (user.myCourses.includes(courseId)) {
      // Course is saved, remove it from myCourses
      await userCollection.updateOne(
        { username },
        { $pull: { myCourses: courseId } }
      );
      res.sendStatus(200);
    } else {
      return res.status(400).send("Course is not saved");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Error removing the course from my courses");
  }
});


/* Course Detail Section end */

// Renders the custom 404 error page to users instead of displaying a generic error message or a stack trace.
app.get("*", (req, res) => {
  res.status(404);
  res.render("404");
});

// For developers to test on their local machine
app.listen(port, () => {
  console.log("Node application listening on port " + port);
});
