const {
    validationResult
} = require('express-validator/check');

const Product = require('../models/product');

/**
 * Mongoose gud function:
 * Product.find().select('title price -_id') -> returns object with only the title and price, excluding the _id
 * Product.find().populate('userId') -> returns the User with the associated userId.
 */

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        hasError: false,
        editing: false,
        errorMessage: null,
        validationErrors: []
    })
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageURL = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Add Product',
            path: '/admin/add-product',
            editing: false,
            hasError: true,
            product: {
                title: title,
                imageUrl: imageURL,
                price: price,
                description: description
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    const product = new Product({
        title: title,
        price: price,
        description: description,
        imageUrl: imageURL,
        userId: req.user
    });
    product.save().then(result => {
        console.log('Create Product');
        res.redirect('/admin/products');
    }).catch(err => {
        const error = new Error(err);
        error.httpStatus = 500;
        return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
    const editMode = req.query.edit;
    if (!editMode) {
        return res.redirect('/');
    }
    const prodId = req.params.productId;
    Product.findById(prodId)
        .then((product) => {
            res.render('admin/edit-product', {
                pageTitle: 'Edit Product',
                path: '/admin/edit-product',
                editing: editMode,
                hasError: false,
                product: product,
                errorMessage: null,
                validationErrors: []
            });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageURL = req.body.imageUrl;
    const updatedDescription = req.body.description;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).render('admin/edit-product', {
            pageTitle: 'Edit Product',
            path: '/admin/edit-product',
            editing: true,
            hasError: true,
            product: {
                title: updatedTitle,
                imageUrl: updatedImageURL,
                price: updatedPrice,
                description: updatedDescription,
                _id: prodId
            },
            errorMessage: errors.array()[0].msg,
            validationErrors: errors.array()
        });
    }

    Product.findById(prodId)
        .then(product => {
            if (product.userId.toString() !== req.user._id.toString()) {
                return res.redirect('/');
            }
            product.title = updatedTitle;
            product.price = updatedPrice;
            product.imageUrl = updatedImageURL;
            product.description = updatedDescription;
            return product.save()
                .then(result => {
                    console.log('UPDATED PRODUCT');
                    res.redirect('/admin/products');
                });
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
};

exports.getProducts = (req, res, next) => {
    Product.find({
            userId: req.user._id
        })
        .then((products) => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        }).catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
}

exports.postDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    Product.deleteOne({
            _id: productId,
            userId: req.user._id
        })
        .then(result => {
            console.log("Product's destroyed");
            res.redirect('/admin/products');
        })
        .catch(err => {
            const error = new Error(err);
            error.httpStatus = 500;
            return next(error);
        });
}