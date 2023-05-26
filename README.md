# CoursePilot

## 1. Project Description
* Our team, BBY03, is developing an AI-powered platform that provides personalized course recommendations and assistance to online learners, to help them save time and effort while offering a curated learning experience.

## 2. Names of Contributors
* Yongeun Kwon
* Munyoung Cho
* Marvin Sio
	
## 3. Technologies and Resources Used
* CSS           # Front-end
* EJS           # Front-end
* Bootstrap     # Front-end
* JavaScript    # Back-end
* NodeJS        # Back-end
* MongoDB       # Database
* OpenAI API    # API

## 4. Complete setup/installion/usage
1. Install Node.js
    * Users need to ensure that Node.js is installed on their machine. They can visit the official Node.js website (https://nodejs.org) to download and install the appropriate version for their operating system.
2. Clone the repository
    * git clone https://github.com/jenkwon92/2800-202310-BBY03.git
3. Install dependencies
    ```
    npm install
    ```
4. Set up environment variables
    * Users should create an .env file in the root directory of the project.
    * Here is an example of the env variables you may need:
    ```
    MONGODB_HOST= YourMongoDBClusterHere
    MONGODB_USER= YourUsernameHere
    MONGODB_PASSWORD= YourPasswordHere
    MONGODB_DATABASE= YourMongoDBDatabaseHere
    MONGODB_SESSION_SECRET= SomeSecretSessionKey
    NODE_SESSION_SECRET= SomeSecretSessionKey
    JWT_SECRET= SomeSecretSessionKey
    COURSEPILOT_SUPPORT_EMAIL= YourSupportEmailHere
    COURSEPILOT_SUPPORT_PASSWORD= YourSupportPasswordHere
    PORT= YourDesiredPortHere
    OPENAI_API_KEY= YourOpenAIKeyHere
    ```
    * You can get your own OpenAI Key here: https://platform.openai.com/account/api-keys
5. Start the application
    ```
    npm start
    ```
    * or if you have nodemon installed:
    ```
    npm run dev
    ```
6. Access the application
    * From your local machine: http://localhost:YourPortHere

## 5. Known Bugs and Limitations
Here are some known bugs:
* TBD

## 6. Features for Future
What we'd like to build in the future:
* TBD
	
## 7. Contents of Folder
Content of the project folder:

```
Top level of project folder: 
├── public                  # Public folder, containing necessary resources
├── views                   # Views folder, containting ejs template views
├── .gitignore              # Gitignore file
├── README.md               # Readme file
├── databaseConnection.js   # databaseConnection.js file, allows us to connect to mongoDB
├── index.js                # index.js file, main js file to start app
├── package.json            # package file, includes dependencies for app to run
└── utils.js                # utils.js file, removes need to use /public

It has the following subfolders and files:
├── public                  # Public folder
|    ├── css                    # CSS folder
|    |    ├── 404.css                   # CSS file for 404 page
|    |    ├── common.css                # CSS file for all pages
|    |    ├── courseDetail.css          # CSS file for course details page
|    |    ├── easterEgg.css             # CSS file for easter egg
|    |    ├── main.css                  # CSS file for main page
|    |    ├── myCourses.css             # CSS file for my courses page
|    |    └── profile.css               # CSS file for profile page
|    ├── dataset                # Dataset folder
|    ├── easterEgg              # Easter egg folder
|    |    ├── cloud1.png                # Source: https://illustoon.com/
|    |    ├── cloud2.png                # Source: https://illustoon.com/
|    |    ├── cloud3.png                # Source: https://illustoon.com/
|    |    ├── cloud4.png                # Source: https://illustoon.com/
|    |    ├── cloud5.png                # Source: https://illustoon.com/
|    |    ├── cloud6.png                # Source: https://illustoon.com/
|    |    ├── plane.png                 # Source: https://illustoon.com/
|    |    └── plane.wav                 # Source: https://pixabay.com/sound-effects/search/plane/
|    ├── images               # Images folder
|    |    ├── profile           #Profile folder
|    |    |   └──default.jpg            # Source: https://www.vectorstock.com/royalty-free-vectors/default-vectors 
|    |    ├── AI.jpg                    # Source: https://www.gatesnotes.com/The-Age-of-AI-Has-Begun
|    |    ├── course.jpg                # Source: https://stock.adobe.com/ie/search?k=cloud%20computing%20background
|    |    ├── datacamp.png              # Source: https://www.crunchbase.com/organization/data-camp
|    |    ├── datascience.png           # Source: https://www.coventry.ac.uk/course-structure/ug/eec/data-science-mscibsc/
|    |    ├── default_search_logo.png   # Source: https://www.cleanpng.com/png-vector-graphics-book-stock-illustration-logo-resea-7183477/
|    |    ├── forgotPassword.jpg        # Source: https://www.paymentsjournal.com/forgot-your-email-password-during-the-summer-holidays-so-did-40-of-americans/
|    |    ├── fullLogo.png              # Source: Personal CoursePilot Logo
|    |    ├── logo.png                  # Source: Personal CoursePilot Logo
|    |    ├── python.jpg                # Source: https://ciracollege.com/2020/11/06/why-python-programming-is-the-future/
|    |    └── udemy.png                 # Source: https://twitter.com/udemy             
|    ├── js                     # JavaScript folder
|    |    ├── courseDetail.js           # JS file for course details page
|    |    ├── easterEgg.js              # JS file for easter egg
|    |    ├── main.js                   # JS file for main page
|    |    └── search.js                 # JS file for search page
|    └── tuning.jsonl                   # JSON file for tuning chatbot
└── views                   # Views folder
     ├── templates              # Templates folder
     |    ├── footer.ejs                # EJS file for footer
     |    ├── header.ejs                # EJS file for header
     ├── 404.ejs                        # EJS file for 404 page
     ├── chatbot.ejs                    # EJS file for chatbot page
     ├── courseDetail.ejs               # EJS file for course details page
     ├── dataset.ejs                    # EJS file for dataset page
     ├── editInterest.ejs               # EJS file for edit interests page
     ├── editProfile.ejs                # EJS file for edit profile page
     ├── editSkill.ejs                  # EJS file for edit skills page
     ├── error.ejs                      # EJS file for error page
     ├── fineTuning.ejs                 # EJS file for fine-tuning page
     ├── forgotPassword.ejs             # EJS file for forgot password page
     ├── index.ejs                      # EJS file for index page
     ├── login.ejs                      # EJS file for login page
     ├── main.ejs                       # EJS file for main page
     ├── myCourses.ejs                  # EJS file for my courses page
     ├── passwordUpdated.ejs            # EJS file for password updated page
     ├── profile.ejs                    # EJS file for profile page
     ├── recommendation.ejs             # EJS file for recommendations page
     ├── resetPassword.ejs              # EJS file for reset password page
     ├── search.ejs                     # EJS file for search page
     └── signUp.ejs                     # EJS file for sign up page
```
## 8. AI Usage
How we used AI to create our app
* TBD
How we used AI to create or clean data sets
* TBD
How our app uses AI
* TBD
Limitations we encountered
* TBD

## 9. Contact Information
* Contact us at coursepilotapp@gmail.com
