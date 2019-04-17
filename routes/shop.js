const express = require('express');

const shopController = require('../controllers/shop');

const isAuth = require('../middleware/is-auth');

const router = express.Router();

// .use() -> Add new middleware
router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

// :X -> declare that X will be variable
// -> /products/1234; /1avvea
// Can be access by "req.params.productID"
router.get('/products/:productId', shopController.getProduct);

router.get('/cart', isAuth, shopController.getCart);

router.post('/cart', isAuth, shopController.postCart);

router.post('/cart-delete-item', isAuth, shopController.postCartDeleteProduct);

router.get('/orders', isAuth, shopController.getOrders);
router.post('/create-order', isAuth, shopController.postOrder);

module.exports = router;