const fs = require('fs');
const path = require('path');

const rootDir = require('../util/path')
const pathToSaveFile = path.join(rootDir, 'data', 'products.json');

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
    constructor(title, imageURL, description, price) {
        this.title = title;
        this.imageURL = imageURL;
        this.description = description;
        this.price = price;
    }

    save() {
        getProductsFromFile((products) => {
            products.push(this);
            fs.writeFile(pathToSaveFile, JSON.stringify(products), (err) => {
                if(err)
                    console.log(err);
            });
        });
    }

    static fetchAll(callback) {
        getProductsFromFile(callback);
    }
};