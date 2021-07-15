const Sequelize = require('sequelize')

const connection = new Sequelize('cadastrotarefas', 'root', '123456789', {
    host: 'localhost',
    dialect: 'mysql',
    timezone: '-04:00'
})

module.exports = connection
