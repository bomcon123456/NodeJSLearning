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
        editing: false
    })
};

exports.postAddProduct = (req, res, next) => {
    const title = req.body.title;
    const imageURL = req.body.imageUrl;
    const price = req.body.price;
    const description = req.body.description;
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
    }).catch(err => console.log(err));
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
                product: product
            });
        })
        .catch(err => console.log(err));
};

exports.postEditProduct = (req, res, next) => {
    const prodId = req.body.productId;
    const updatedTitle = req.body.title;
    const updatedPrice = req.body.price;
    const updatedImageURL = req.body.imageUrl;
    const updatedDescription = req.body.description;
    Product.findById(prodId)
    .then(product => {
        product.title = updatedTitle;
        product.price = updatedPrice;
        product.imageUrl = updatedImageURL;
        product.description = updatedDescription;
        return product.save()
    })
    .then(result => {
        console.log('UPDATED PRODUCT');
        res.redirect('/admin/products');
    })
    .catch(err => console.log(err));
};

exports.getProducts = (req, res, next) => {
    Product.find()
        .then((products) => {
            res.render('admin/products', {
                prods: products,
                pageTitle: 'Admin Products',
                path: '/admin/products'
            });
        }).catch(err => console.log(err));
}

exports.postDeleteProduct = (req, res, next) => {
    const productId = req.body.productId;
    Product.findByIdAndDelete(productId)
        .then(result => {
            console.log("Product's destroyed");
            res.redirect('/admin/products');
        })
        .catch(err => console.log(err));
}