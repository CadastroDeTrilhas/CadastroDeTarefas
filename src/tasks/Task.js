const Sequelize = require('sequelize')
const connection = require('../database/database')
const Subject = require('../subjects/Subject')
const Level = require('../level/Level')

const Task = connection.define('tasks', {
    num:{
        type: Sequelize.INTEGER,
        allowNull: false
    },key:{
        type: Sequelize.STRING,
        allowNull: false
    },url:{
        type: Sequelize.STRING,
        allowNull:false
    }
})

Subject.hasMany(Task)
Task.belongsTo(Subject)

Level.hasMany(Task)
Task.belongsTo(Level)

// Linha usada somente para criar tabela no BD
// Task.sync({force: true})

module.exports = Task