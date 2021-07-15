const Sequelize = require('sequelize')
const connection = require('../database/database') 
const Student = require('../students/Students')

const TrailsLink = connection.define('trailsLink', {
    number:{
        type: Sequelize.INTEGER,
        allowNull:false
    }, cover: {
        type: Sequelize.INTEGER,
        allowNull: false
    }, view: {
        type: Sequelize.BOOLEAN,
        allowNull: false
    }
})

Student.hasMany(TrailsLink)
TrailsLink.belongsTo(Student)

// Linha usada somente para criar a tabela no BD
// TrailsLink.sync({force:true})

module.exports = TrailsLink