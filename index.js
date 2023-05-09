const express = require('express');
const bcrypt = require('bcrypt');
const saltRounds = 12;

const port = process.env.PORT || 3000;
const app = express();

var users = [];

app.use(express.urlencoded({ extended: false }));

app.set('view engine', 'ejs');

app.get('/', (req, res) => {
    res.render('index');
});

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

app.get('/home', (req,res) => {
    res.render('home');
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});