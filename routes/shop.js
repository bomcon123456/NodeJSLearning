const express = require('express');

const path = require('path');
const rootDir = require('../util/path');

const adminData = require('./admin');

const router = express.Router();

// .use() -> Add new middleware
router.get('/', (req, res, next) => {
    console.log(adminData.products);
    res.render('shop');
});

module.exports = router;