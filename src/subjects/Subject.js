const Sequelize = require('sequelize')
const connection = require('../database/database')

const Subject = connection.define('subjects', {
    title:{
        type: Sequelize.STRING,
        allowNull: false
    },
    slug:{ 
        type: Sequelize.STRING,
        allowNull: false
    }
})

// Linha usada somente para criar tabela no BD
// Subject.sync({force:true})

module.exports = Subject