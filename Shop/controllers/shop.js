const Product = require('../models/product');
const Order = require('../models/order');

exports.getIndex = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render('shop/index', {
                prods: products,
                pageTitle: 'Shop',
                path: '/'
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render('shop/product-list', {
                prods: products,
                pageTitle: 'All Products',
                path: '/products'
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('shop/product-detail', {
                product: product,
                pageTitle: product.title,
                path: '/products'
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.getCart = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const products = user.cart.items;
            res.render('shop/cart', {
                path: '/cart',
                pageTitle: 'Your Cart',
                products: products
            })
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
}

exports.postCart = (req, res, next) => {
    const prodId = req.body.productId;
    Product.findById(prodId)
        .then(product => {
            return req.user.addToCart(product);
        })
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};


exports.getCheckout = (req, res, next) => {
    res.render('shop/checkout', {
        path: '/checkout',
        pageTitle: 'Checkout'
    });

};

exports.postCartDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    req.user.removeFromCart(productId)
        .then(result => {
            res.redirect('/cart');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
}

exports.getOrders = (req, res, next) => {
    Order.find({
            'user.userId': req.user._id
        })
        .then(orders => {
            // console.log(orders);
            res.render('shop/orders', {
                path: '/orders',
                pageTitle: 'Your Order',
                orders: orders
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.postOrder = (req, res, next) => {
    req.user.populate('cart.items.productId')
        .execPopulate()
        .then(user => {
            const curProducts = user.cart.items.map(i => {
                return {
                    product: {
                        ...i.productId._doc
                    },
                    quantity: i.quantity
                }
            });
            const order = new Order({
                products: curProducts,
                user: {
                    email: req.user.email,
                    userId: req.user,
                }
            });
            return order.save();
        })
        .then(result => {
            req.user.emptyCart();
        })
        .then(result => {
            res.redirect('orders');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};