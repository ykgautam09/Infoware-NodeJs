const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./../modules/dbConnection');
const upload = require('./../modules/upload');
const utilFunc = require('../modules/utilFunc');


// create root user
router.post('/signup', upload.single('profilePicture'), function (req, res) {
    let salt = bcrypt.genSaltSync();
    let userData = {
        name: process.env.ROOT_USER,
        email: process.env.ROOT_EMAIL,
        password: bcrypt.hashSync(process.env.ROOT_PASSWORD, salt), // hashing password
        salt,
        contact: req.body.contact,
        role: '2'
    };
    // save user data in database
    db.connection.promise().query('INSERT IGNORE INTO `user` SET ?;', userData)
        // generate otp and save into database
        .then(() => {
            console.log('user inserted in user table', userData.email);
            return res.send('user registered!');
        }).catch(err => {
        console.log('an error occurred', err);
        res.send('an error occurred' + err);
    });
});


// handle login request for root user
router.post('/login', function (req, res) {
    let email = req.body.userEmail;
    let password = req.body.password;
    console.log(email);
    db.connection.promise().query('SELECT `password` FROM `user` WHERE `email`=? AND `role`=2 LIMIT 1;', email)
        .then(async result => {
            console.log(result);
            let hash = result[0][0].password;
            bcrypt.compare(password, hash).then(result => {
                console.log('password matched', result);
                if (result) {
                    console.log('login successful');
                    let token = jwt.sign({email}, process.env.JWT_SECRET, {
                        expiresIn: '24h'
                    });
                    db.connection.promise().query('update `user` SET token=?;', token).then(update => {
                        console.log('token updated', update);
                        res.set('Authorization', 'Bearer ' + token);

                        return res.send('login successful');
                    }).catch(err => {
                        console.log(err);
                        throw Error('something goes wrong');
                    });
                } else {
                    console.log('password doesn\'t match');
                    return res.send('login failed');
                }
            });
        })
        .catch(err => {
            console.log('something goes wrong', err);
            res.send('something goes wrong \nretry');
        });
});

// manage user profiles
router.post('/update/', upload.single('profilePicture'), (req, res) => {
    let token = req.headers.authorization.split(' ')[1];
    let rootEmail = process.env.ROOT_EMAIL;
    let userData = {
        ...req.body, profile_pic: utilFunc.genLink(req.protocol, req.file.filename) // generate dynamic link
    };
    delete userData.email;
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== rootEmail) {  // token belongs to root user
            console.log('email doesn\'t matched', email, req.body.email);
            throw new Error('token Doesn\'t belong to user match');
        }

        if (userData.password) {  // hash password if password was updated
            let salt = await bcrypt.genSaltSync();
            userData.password = await bcrypt.hashSync(req.body.password, salt);
            userData.salt = salt;
        }
        db.connection.promise().query('update `user` set ? WHERE email=? limit 1;', [userData, email])
            .then(() => {
                console.log('update successful for: ', email);
                return res.send('update successful');
            })
            .catch(err => {
                console.log(err);
                res.send('data could not be updated\n: ' + err);
            });
    });
});


// add new product in inventory
router.post('/product', (req, res) => {
    let token = req.headers.authorization.split(' ')[1];
    let rootEmail = process.env.ROOT_EMAIL;
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== rootEmail) {  // token belongs to root user
            console.log('email doesn\'t matched', email, req.body.email);
            throw new Error('token Doesn\'t belong to user match');
        }
        let productData = {
            name: req.body.name,
            category: req.body.category,
            color: req.body.color,
            size: req.body.size,
            price: req.body.price
        };
        db.connection.promise().query('INSERT  INTO `product` SET ?;', productData)
            // generate otp and save into database
            .then(() => {
                console.log('product data stored successfully');
                return res.send('product data stored successfully!');
            }).catch(err => {
            console.log('an error occurred', err);
            res.send(err);
        });
    });
});


// handle fetch order information
router.get('/order', (req, res) => {
    let rootEmail = process.env.ROOT_EMAIL;

    let token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== rootEmail) {
            console.log('email doesn\'t matched', email, rootEmail);
            throw new Error('token Doesn\'t belong to user');
        }

        let query;
        let value;
        if (req.query.userId) {
            query = 'user_id';
            value = req.query.userId;
        }
        if (req.query.orderId) {
            query = 'id';
            value = req.query.orderId;
        }
        if (req.query.time) {
            query = 'time';
            value = new Date(req.query.time);
        }
        let sql = 'select * from `order` where ' + query + ' =' + value + ';';
        db.connection.promise().query(sql)
            .then(data => {
                console.log('update successful for: ', email);
                let userData = {
                    ...data[0],
                };
                return res.json(userData);
            })
            .catch(err => {
                console.log(err);
                res.send('failed to retrieve data \n' + err);
            });
    });
});
module.exports = router;