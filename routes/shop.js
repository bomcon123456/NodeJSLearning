const express = require('express');

const path = require('path');
const rootDir = require('../util/path');

const adminData = require('./admin');

const router = express.Router();

// .use() -> Add new middleware
router.get('/', (req, res, next) => {
    const products = adminData.products;
    res.render('shop', {
        prods: products,
        pageTitle: 'Shop',
        path:'/',
        activeShop: true,
        productCSS: true
    });
});

module.exports = router;