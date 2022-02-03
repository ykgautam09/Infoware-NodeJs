const express = require('express');
const jwt = require('jsonwebtoken');
const db = require('../modules/dbConnection');
const router = express.Router();


// all routes are relative to /
router.get('/', function (req, res) {
    res.send('API up and ready to serve');
});

// fetch products information
router.get('/product', (req, res) => {
    let size = parseInt(req.query.size) || 20;  // no of records returned
    let page = parseInt(req.query.page) || 1;  // page id when records created using size
    let startID = size * page;
    db.connection.promise().query('select * FROM `product` where id<' + startID + ' LIMIT ' + size + ';',)
        .then(data => {
            let productData = {
                ...data[0],
            };
            return res.json(productData);
        })
        .catch(err => {
            console.log(err);
            res.send('failed to retrieve data \n', err);
        });
});
module.exports = router;
