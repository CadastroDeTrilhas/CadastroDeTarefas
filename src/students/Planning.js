const Sequelize = require('sequelize')
const connection = require('../database/database')
const Student = require('./Students')

const Planning = connection.define('plannings', {
    num:{
        type: Sequelize.SMALLINT,
        allowNull: false
    }, subjectId: {
        type: Sequelize.INTEGER,
        allowNull: false
    }, levelId:{
        type: Sequelize.INTEGER,
        allowNull: false
    }
})

Student.hasMany(Planning)
Planning.belongsTo(Student)

// Linha usada somente para criar tabela no BD
// Planning.sync({force: true})

module.exports = Planning