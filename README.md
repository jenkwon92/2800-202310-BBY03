# CoursePilot

## 1. Project Description
* Our team, BBY03, is developing an AI-powered platform that provides personalized course recommendations and assistance to online learners, to help them save time and effort while offering a curated learning experience.

## 2. Names of Contributors
* Yongeun Kwon
* Munyoung Cho
* Marvin Sio
	
## 3. Technologies and Resources Used
* CSS           (Front-end)
* EJS           (Front-end)
* Bootstrap     (Front-end)
* JavaScript    (Back-end)
* NodeJS        (Back-end)
* MongoDB       (Database)
* OpenAI API    (API)

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
    * You can setup a MongoDB Database here: https://www.mongodb.com/

5. Start the application

    ```
    npm start
    ```
    or if you have nodemon installed:

    ```
    npm run dev
    ```

6. Access the application

    * From your local machine: http://localhost:YourPortHere
	
## 5. Contents of Folder
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
|    |    ├── tuning-test.jsonl         # JSONL file for testing fine-tuning
|    |    └── tuning.jsonl              # JSONL file for fine-tuning
|    ├── easterEgg              # Easter egg folder
|    |    ├── cloud1.png                # Source: https://illustoon.com/
|    |    ├── cloud2.png                # Source: https://illustoon.com/
|    |    ├── cloud3.png                # Source: https://illustoon.com/
|    |    ├── cloud4.png                # Source: https://illustoon.com/
|    |    ├── cloud5.png                # Source: https://illustoon.com/
|    |    ├── cloud6.png                # Source: https://illustoon.com/
|    |    ├── plane.png                 # Source: https://illustoon.com/
|    |    └── plane.wav                 # Source: https://pixabay.com/sound-effects/search/plane/
|    ├── images             # Images folder
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
└── views                   # Views folder
     ├── templates              # Templates folder
     |    ├── footer.ejs                # EJS file for footer
     |    └── header.ejs                # EJS file for header
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
## 6. Features
How to use our product

1. Sign up or Log in:
    * To access the app's features, users need to create an account by signing up or log in if they already have an existing account. The sign-up process requires providing basic information such as name, email, and password. Once signed up, users can log in using their credentials to access their personalized learning experience.

2. Set Skills and Interests:
    * To enhance the recommendations feature, users are encouraged to set their skills and interests within their profile page. This step allows the app to tailor personalized course recommendations based on their preferences. Users can provide information about their current skills, areas of interest, and learning goals. The more accurate and detailed the user's profile, the more personalized and relevant the course recommendations will be.

3. Recommendations:
    * Based on the skills and interests set within the user's profile, our app provides personalized course recommendations. These recommendations are tailored to match the user's preferences and learning goals. Users can explore the recommendations section to discover courses that align with their interests and skills, providing a curated selection of relevant learning opportunities.

4. Chatbot Interaction:
    * Upon logging in, users can easily interact with our chatbot. They can initiate a conversation by typing queries, prompts, or specific requests into the chat interface. The chatbot utilizes AI technologies to understand user inputs and provide relevant responses and assistance. Users can ask questions, seek course recommendations, inquire about specific topics, or engage in interactive conversations to enhance their learning journey.

5. Utilizing the Search Feature:
    * To find courses of interest, users can utilize our streamlined search feature. They can enter keywords or phrases related to the courses they are looking for in the search bar. Users can also use the popular tags feature when searching for topics. This allows users to quickly find courses that align with their learning goals.

6. Exploring Search Results and Course Details:
    * After performing a search, users are presented with a list of search results. Each search result displays key details about the course, such as the course title, tags, and a brief description. Users can click on a specific search result to access the detailed course page.

7. Saving Courses:
    * If users find a course they are interested in, they have the option to save it for later. Our app provides a bookmark button on the course details page, allowing users to bookmark the course and add it to their saved courses list. This feature enables users to keep track of courses they want to explore further or enroll in at a later time.

8. Start Learning:
    * When a user clicks on a course from the search results, their saved courses list, or the recommendations section, they are taken to the course details page. From there, they have the option to start learning the course immediately. By clicking on the "Start Learning" button, users are redirected to the website that offers the course, where they can access course materials, videos, quizzes, assignments, and any additional resources provided.

## 7. References

1. Courses Dataset from Kaggle:
    * https://www.kaggle.com/datasets/christoffer/datacamp-courses
    * https://www.kaggle.com/datasets/suddharshan/best-data-science-courses-udemy
2. Code generated by ChatGPT
3. All files have sources within the project contents folder

## 8. AI Usage

# How we used AI to create our app
    * During the development of our app, we used AI to overcome coding challenges. When we encountered obstacles or got stuck on a particular feature, we utilized ChatGPT, to assist us in generating code snippets. This innovative approach not only saved us time but also provided valuable insights and suggestions to enhance our app's functionality.

# How we used AI to create or clean data sets
    * While AI played a significant role in generating code for our app, we did not utilize AI specifically for creating or cleaning data sets. Instead, we used traditional cleaning techniques to ensure the accuracy and quality of our data. By manually curating and verifying the data sets, we maintained a high standard of reliability in our app's information.

# How our app uses AI
    * One of the standout features of our app is the integration of an AI-powered chatbot. By incorporating AI technologies, we have developed a dynamic and interactive chatbot function that provides personalized recommendations, answers user queries, and facilitates engaging conversations. The chatbot utilizes natural language processing and machine learning algorithms to understand user inputs and deliver relevant and accurate responses, making the learning experience more interactive and efficient.

# Limitations we encountered
    * Although AI has proven to be a valuable asset in our app development process, we did come across certain limitations. We realized that AI, while capable of assisting with code generation, cannot provide solutions for every programming challenge. There were instances where we had to resort to manual research and seeking external resources to address specific coding requirements. This experience highlighted the importance of a balanced approach, combining AI assistance with traditional problem-solving techniques to overcome hurdles effectively.

## 9. Contact Information
* Contact us at coursepilotapp@gmail.com
