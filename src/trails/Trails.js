const Sequelize = require('sequelize')
const connection = require('../database/database')
const TrailsLink = require('./TrailsLink')

const Trails = connection.define('trail', {

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

TrailsLink.hasMany(Trails)
Trails.belongsTo(TrailsLink)

// Linha usada somente para criar a tabela no BD
// Trails.sync({force:true})

module.exports = Trails