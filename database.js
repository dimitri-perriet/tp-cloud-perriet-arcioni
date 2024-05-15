const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_HOST, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DATABASE_URL,
    dialect: 'mysql',
    dialectOptions: {
        ssl: {
            require: true,
            rejectUnauthorized: false
        }
    }
});

module.exports = sequelize;
