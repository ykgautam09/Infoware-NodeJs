const express = require('express');
const router = express.Router();


// all routes are relative to /
router.get('/', function (req, res) {
    res.send("API up and ready to serve");
});

module.exports = router;
