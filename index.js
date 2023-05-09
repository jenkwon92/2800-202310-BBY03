const express = require('express');

const port = process.env.PORT || 3000;
const app = express();

app.set('view engine', 'ejs');

//Renders the index page
app.get('/', (req,res) => {
    res.render('index');
});

//Renders the main page
app.get('/main', (req,res) => {
    res.render('main');
});

app.listen(port, () => {
    console.log("Node application listening on port " + port);
});

//Serves the static assets from the specified directory
app.use(express.static(__dirname + '/public'));
