const Sequelize = require('sequelize')
const connection = require('../database/database')
const Subject = require('../subjects/Subject')

const Student = connection.define('students', {
    name:{
        type: Sequelize.STRING,
        allowNull:false
    },email:{
        type: Sequelize.STRING,
        allowNull: false
    },password:{
        type: Sequelize.STRING,
        allowNull: false
    },auto:{
        type: Sequelize.BOOLEAN,
        allowNull:false
    }
    
})


// Linha usada somente para criar a tabela no BD
// Student.sync({force:true})

module.exports = Student