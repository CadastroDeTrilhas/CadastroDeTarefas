const Sequelize = require('sequelize')
const connection = require('../database/database')

const Level = connection.define('levels', {
    title:{
        type: Sequelize.STRING,
        allowNull: false
    },
    slug:{ 
        type: Sequelize.STRING,
        allowNull: false
    }
})

// Linha usada somente para criar a tabela no BD
// Level.sync({force:false})

module.exports = Level