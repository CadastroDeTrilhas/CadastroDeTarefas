const Sequelize = require('sequelize')
const connection = require('../database/database')
const Student = require('../students/Students')

const SubjectsHistory = connection.define( 'subjectsHistory', {

    subject:{
        type: Sequelize.INTEGER,
        allowNull: false
    }, index: {
        type: Sequelize.INTEGER,
        allowNull: false
    }, level: {
        type: Sequelize.INTEGER,
        allowNull: false
    }

})

Student.hasMany(SubjectsHistory)
SubjectsHistory.belongsTo(Student)

// Linha usada somente para criar a tabela no BD
// SubjectsHistory.sync({force:true})

module.exports = SubjectsHistory