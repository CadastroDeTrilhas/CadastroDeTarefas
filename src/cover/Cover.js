const Sequelize = require('sequelize')
const connection = require('../database/database')

const Cover = connection.define('covers', {
    name:{
        type: Sequelize.STRING,
        allowNull: false 
    }, key: {
        type: Sequelize.STRING,
        allowNull: false
    }, url: {
        type: Sequelize.STRING,
        allowNull: false
    }

})

// Linha usada somente para criar tabela no BD
// Cover.sync({force: true})

module.exports = Cover