const Sequelize = require('sequelize')
const connection = require('../database/database') 
const Student = require('../students/Students')
const Task = require('../tasks/Task')

const Trail = connection.define('trails', {
    number:{
        type: Sequelize.INTEGER,
        allowNull:false
    }
})

Student.hasMany(Trail)
Trail.belongsTo(Student)

// Linha usada somente para criar a tabela no BD
// Trail.sync({force:true})

module.exports = Trail