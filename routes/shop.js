const express = require('express');

const productsController = require('../controllers/products')

const router = express.Router();

// .use() -> Add new middleware
router.get('/', productsController.getProducts);

module.exports = router;