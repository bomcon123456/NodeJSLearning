const express = require('express');

const shopController = require('../controllers/shop')

const router = express.Router();

// .use() -> Add new middleware
router.get('/', shopController.getIndex);

router.get('/products', shopController.getProducts);

// :X -> declare that X will be variable
// -> /products/1234; /1avvea
// Can be access by "req.params.productID"
router.get('/products/:productId', shopController.getProduct);

router.get('/cart', shopController.getCart);

router.post('/cart', shopController.postCart);

// router.post('/cart-delete-item', shopController.postCartDeleteProduct);

// router.get('/orders', shopController.getOrders);
// router.post('/create-order', shopController.postOrder);

// router.get('/checkout', shopController.getCheckout);


module.exports = router;