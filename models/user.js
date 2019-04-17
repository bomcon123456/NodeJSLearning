const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema({
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    cart: {
        items: [{
            productId: {
                type: Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                required: true
            }
        }]
    }
});

userSchema.methods.addToCart = function (product) {
    const cartProduct = this.cart.items.findIndex(cp => {
        return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];
    if (cartProduct >= 0) {
        newQuantity = this.cart.items[cartProduct].quantity + 1;
        updatedCartItems[cartProduct].quantity = newQuantity;
    } else {
        updatedCartItems.push({
            productId: product._id,
            quantity: newQuantity
        });
    };
    const updatedCart = {
        items: updatedCartItems
    };
    this.cart = updatedCart;
    return this.save();
}

userSchema.methods.removeFromCart = function (productId) {
    const updatedCartItem = this.cart.items.filter(p => {
        return p.productId.toString() !== productId.toString();
    });
    this.cart.items = updatedCartItem;
    return this.save();
}

userSchema.methods.emptyCart = function () {
    this.cart.items = [];
    return this.save();
}
module.exports = mongoose.model('User', userSchema);

// const mongodb = require('mongodb')
// const getDb = require('../util/database').getDb;

// class User {
//     constructor(name, email, cart, id) {
//         this.name = name;
//         this.email = email;
//         this.cart = cart;
//         this._id = id ? new mongodb.ObjectId(id) : null;
//     }

//     save() {
//         const db = getDb();
//         db.collection('users').insertOne(this)
//             .then(result => {})
//             .catch(err => console.log(err));
//     }

//     addToCart(product) {
//         const cartProduct = this.cart.items.findIndex(cp => {
//             return cp.productId.toString() === product._id.toString();
//         });
//         let newQuantity = 1;
//         const updatedCartItems = [...this.cart.items];
//         if (cartProduct >= 0) {
//             newQuantity = this.cart.items[cartProduct].quantity + 1;
//             updatedCartItems[cartProduct].quantity = newQuantity;
//         } else {
//             updatedCartItems.push({
//                 productId: new mongodb.ObjectId(product._id),
//                 quantity: newQuantity
//             });
//         }

//         const updatedCart = {
//             items: updatedCartItems
//         };
//         const db = getDb();
//         return db.collection('users').updateOne({
//             _id: this._id
//         }, {
//             $set: {
//                 cart: updatedCart
//             }
//         });
//     }

//     getCart() {
//         const db = getDb();
//         const productIds = this.cart.items.map(i => {
//             return i.productId;
//         })
//         return db.collection('products').find({
//                 _id: {
//                     $in: productIds
//                 }
//             }).toArray()
//             .then(products => {
//                 return products.map(p => {
//                     return {
//                         ...p,
//                         quantity: this.cart.items.find(i => {
//                             return i.productId.toString() === p._id.toString();
//                         }).quantity
//                     }
//                 })
//             })
//             .catch(err => console.log(err));
//     }

//     deleteItemFromCart(productId) {
//         const updatedCartItem = this.cart.items.filter(p => {
//             return p.productId.toString() !== productId.toString();
//         });
//         const db = getDb();
//         return db.collection('users').updateOne({
//             _id: this._id
//         }, {
//             $set: {
//                 cart: {
//                     items: updatedCartItem
//                 }
//             }
//         });
//     }

//     addOrder() {
//         const db = getDb();
//         return this.getCart()
//             .then(products => {
//                 const order = {
//                     items: products,
//                     user: {
//                         _id: this._id,
//                         name: this.name
//                     }
//                 };

//                 return db.collection('orders').insertOne(order);
//             })
//             .then(result => {
//                 this.cart = {
//                     items: []
//                 };
//                 return db.collection('users').updateOne({
//                     _id: this._id
//                 }, {
//                     $set: {
//                         cart: {
//                             items: []
//                         }
//                     }
//                 });
//             })
//             .catch(err => console.log(err));
//     }

//     getOrders() {
//         const db = getDb();
//         return db.collection('orders').find({
//             'user._id': this._id
//         }).toArray();
//     }

//     static findByPk(userId) {
//         const db = getDb();
//         return db.collection('users').findOne({
//                 _id: mongodb.ObjectId(userId)
//             })
//             .then(user => {
//                 console.log(user);
//                 return user;
//             })
//             .catch(err => console.log(err));
//     }
// }

// module.exports = User;