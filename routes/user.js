const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('./../modules/dbConnection');
const upload = require('./../modules/upload');
const utilFunc = require('../modules/utilFunc');


// accept user data for registration
router.post('/signup', upload.single('profilePicture'), function (req, res) {
    let salt = bcrypt.genSaltSync();
    let userData = {
        name: req.body.name, email: req.body.email, password: bcrypt.hashSync(req.body.password, salt), // hashing password
        salt, contact: req.body.contact, profile_pic: utilFunc.genLink(req.protocol, req.file.filename), // generate dynamic link
    };

    db.connection.promise().query('SELECT id FROM `user` WHERE email=? limit 1;', userData.email)
        .then(data => {
            // user email already exists
            if (data[0].length) {
                console.log(`user ${userData.email} already in database::`);
                throw Error('user already exists');
            }

            // save user data in database
            db.connection.promise().query('INSERT INTO `user` SET ?;', userData)
                // generate otp and save into database
                .then(() => {
                    console.log('user inserted in user table', userData.email);
                    return res.send('user registered!');
                });
        })
        .catch(err => {
            console.log('an error occurred', err);
            res.send(err);
        });
});

// handle login request and send auth token back
router.post('/login', function (req, res) {
    let email = req.body.userEmail;
    let password = req.body.password;
    console.log(email);
    db.connection.promise().query('SELECT `password` FROM `user` WHERE `email`=? LIMIT 1;', email)
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

// handle fetch profile information
router.get('/', (req, res) => {
    let user = req.query.user;
    let token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== user) {
            console.log('email doesn\'t matched', email, user);
            throw new Error('token Doesn\'t belong to user match');
        }
        db.connection.promise().query('select `name`,`contact`,`profile_pic` from `user`  WHERE email=? limit 1;', email)
            .then(data => {
                console.log('update successful for: ', email);
                let userData = {
                    ...data[0][0],
                };
                return res.json(userData);
            })
            .catch(err => {
                console.log(err);
                res.send('failed to retrieve data \n' + err);
            });
    });
});

// handle update profile request
router.post('/update/', upload.single('profilePicture'), (req, res) => {
    let token = req.headers.authorization.split(' ')[1];
    let userData = {
        ...req.body, profile_pic: utilFunc.genLink(req.protocol, req.file.filename) // generate dynamic link
    };
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== userData.email) {
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

router.post('/delete/', (req, res) => {
    let token = req.headers.authorization.split(' ')[1];
    let userEmail = req.body.email;
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== userEmail) {
            console.log('email doesn\'t matched', email, req.body.email);
            throw new Error('token Doesn\'t belong to user match');
        }
        db.connection.promise().query('delete from `user` WHERE email=? limit 1;', email)
            .then(() => {
                console.log('deletion successful for: ', email);
                return res.send('profile deleted successfully');
            })
            .catch(err => {
                console.log(err);
                res.send('profile could not be deleted\n: ' + err);
            });
    });
});

// handle fetch all order information by user
router.get('/order', (req, res) => {
    let userEmail = req.query.user;

    let token = req.headers.authorization.split(' ')[1];
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== userEmail) {
            console.log('email doesn\'t matched', email, userEmail);
            throw new Error('token Doesn\'t belong to user');
        }

        db.connection.promise().query('select * from `order` where user_id=(select id from `user` where email=?)', userEmail)
            .then(data => {
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

// create new order
router.post('/order/new', (req, res) => {
    let token = req.headers.authorization.split(' ')[1];
    let orderData = {
        ...req.body
    };
    let userEmail = req.body.email;
    delete orderData.email;
    jwt.verify(token, process.env.JWT_SECRET, async (err, payload) => {
        if (err) {
            console.log(err);
            throw err;
        }
        console.log(payload);
        let email = payload.email;
        if (email !== userEmail) {
            console.log('email doesn\'t matched', email, req.body.email);
            throw new Error('token Doesn\'t belong to user match');
        }

        db.connection.promise().query('insert into `order` set ?, user_id = (select id from `user` where email=?);', [orderData, userEmail])
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

module.exports = router;
