const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const dotenv = require('dotenv');
const logger = require('morgan');
const indexRoute = require('./routes/index');
const userRoute = require('./routes/user');
const adminRoute = require('./routes/admin');


// configurations
dotenv.config();
const host = process.env.SERVER_HOST;
const port = process.env.SERVER_PORT;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));
app.use(logger('dev'));
app.use('/public', express.static(path.join(__dirname, '/public')));


// Routes
app.use('/', indexRoute);
app.use('/user', userRoute);
app.use('/admin', adminRoute);


// Server Set-up
app.listen(process.env.SERVER_PORT || '5000', (err) => {
    if (err) console.log(err);
    console.log(`Server Up and Running at http://${host}:${port}/`);
});

module.exports = app;
