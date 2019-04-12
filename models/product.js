const fs = require('fs');
const path = require('path');

const rootDir = require('../util/path')
const pathToSaveFile = path.join(rootDir, 'data', 'products.json');

const Cart = require('./cart');

const getProductsFromFile = (callback) => {
    fs.readFile(pathToSaveFile, (err, fileContent) => {
        if (err) {
            callback([]);
        } else {
            callback(JSON.parse(fileContent));
        }
    });
}


module.exports = class Product {
    constructor(id, title, imageURL, description, price) {
        this.id = id;
        this.title = title;
        this.imageURL = imageURL;
        this.description = description;
        this.price = price;
    }

    save() {
        getProductsFromFile((products) => {
            if (this.id) {
                const existingProduct = products.findIndex(product => product.id === this.id);
                const updateProduct = [...products];
                updateProduct[existingProduct] = this;
                fs.writeFile(pathToSaveFile, JSON.stringify(updateProduct), (err) => {
                    if (err)
                        console.log(err);
                });
            } else {
                this.id = Math.random().toString();
                products.push(this);
                fs.writeFile(pathToSaveFile, JSON.stringify(products), (err) => {
                    if (err)
                        console.log(err);
                });
            }
        });
    }

    static deleteById(id) {
        getProductsFromFile((products) => {
            const product = products.find(prod => prod.id === id);
            const updateProducts = products.filter(prod => prod.id !== id);
            fs.writeFile(pathToSaveFile, JSON.stringify(updateProducts), (err) => {
                if(!err)
                {
                    Cart.deleteById(id, product.price);
                }
            });
        });
    }

    static fetchAll(callback) {
        getProductsFromFile(callback);
    }

    static findById(id, callback) {
        getProductsFromFile((products) => {
            const product = products.find(p => p.id === id);

            callback(product);
        });
    }
};