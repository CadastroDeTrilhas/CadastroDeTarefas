const Sequelize = require('sequelize')
const connection = require('../database/database')
const Student = require('../students/Students')

const LastTrail = connection.define('lastTrail', {
    howManyTasks:{
        type: Sequelize.SMALLINT,
        allowNull: false
    }, index:{
        type: Sequelize.SMALLINT,
        allowNull: false
    }, subjectId:{
        type: Sequelize.INTEGER,
        allowNull: false
    }, level: {
        type: Sequelize.SMALLINT,
        allowNull: false
    }
})


Student.hasMany(LastTrail)
LastTrail.belongsTo(Student)

// Linha usada somente para criar a tabela no BD
// LastTrail.sync({force:true})

module.exports = LastTrail