const Sequelize = require('sequelize');

const sequelize = new Sequelize('node-complete', 'root', 'hungdtvt', {
    dialect: 'mysql',
    host: 'localhost'
});

module.exports = sequelize;