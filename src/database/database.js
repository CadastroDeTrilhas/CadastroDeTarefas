const Sequilize = require('sequelize')
const { Sequelize } = require('sequelize')


const connection = new Sequelize('cadastrotarefas', 'root', '123456789', {
    host: 'localhost',
    dialect: 'mysql'
})

module.exports = connection