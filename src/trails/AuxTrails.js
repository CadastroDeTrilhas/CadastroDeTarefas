const Sequelize = require('sequelize')
const connection = require('../database/database')
const Trails = require('./Trails')

const AuxTrails = connection.define('auxTrail', {

    subject:{
        type: Sequelize.INTEGER,
        allowNull:false
    }, howManyTask:{
        type: Sequelize.INTEGER,
        allowNull: false
    },index:{
        type: Sequelize.INTEGER,
        allowNull: false
    },level:{
        type: Sequelize.INTEGER,
        allowNull: false
    }
})

Trails.hasMany(AuxTrails)
AuxTrails.belongsTo(Trails)

// Linha usada somente para criar a tabela no BD
// AuxTrails.sync({force:true})

module.exports = AuxTrails