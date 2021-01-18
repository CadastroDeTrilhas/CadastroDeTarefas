const Sequilize = require('sequelize')
const { Sequelize } = require('sequelize')


const connection = new Sequelize('cadastrotarefas', 'root', '12345678', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '-03:00'
})

module.exports = connection