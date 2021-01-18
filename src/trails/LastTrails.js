const Sequelize = require('sequelize')
const connection = require('../database/database')
const Student = require('../students/Students')

const LastTrail = connection.define('lastTrail', {
    howManySubjects:{
        type: Sequelize.INTEGER,
        allowNull:false
    } 
})


Student.hasMany(LastTrail)
LastTrail.belongsTo(Student)

// Linha usada somente para criar a tabela no BD
// LastTrail.sync({force:true})

module.exports = LastTrail