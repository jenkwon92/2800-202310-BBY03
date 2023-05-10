const express = require('express');

const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

app.get('/', (req,res) => {
    res.render('index');
});

app.get('/profile', (req,res) => {
    res.render('profile');
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});