const Sequelize = require('sequelize')
const connection = require('../database/database')
const LastTrails = require('./LastTrails')

const AuxLastTrails = connection.define( 'auxLastTrails', {

    subjects:{
        type: Sequelize.INTEGER,
        allowNull: false
    }, howManyTasks:{
        type: Sequelize.INTEGER,
        allowNull: false
    }, level: {
        type: Sequelize.INTEGER,
        allowNull:false
    }
})

LastTrails.hasMany(AuxLastTrails)
AuxLastTrails.belongsTo(LastTrails)

// Linha usada somente para criar a tabela no BD
// AuxLastTrails.sync({force:true})

module.exports = AuxLastTrails