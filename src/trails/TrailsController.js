const express = require('express')
const router = express.Router()
const Trail = require('./Trails')
const LastTrail = require('./LastTrails')
const AuxTrail = require('./AuxTrails')
const AuxLastTrail = require('./AuxLastTrails')
const SubjectHistory = require('../subjects/SubjectsHistory')
const Subject = require('../subjects/Subject')
const Level = require('../level/Level')
const Task = require('../tasks/Task')

router.post('/admin/trails/new', (req, res) => {

    var studentId = req.body.studentId
    var numSubjects = req.body.numSubjects

    Subject.findAll().then( subjects => {
        Level.findAll().then( levels => {
            res.render('admin/trails/new', {studentId, numSubjects, subjects, levels})
        })
    })
})

router.post('/admin/trails/save', (req, res) => {

    var studentId = req.body.studentId
    var howManySubjects = req.body.numSubjects
    var subjects = req.body.subject
    var howManyTasks = req.body.howManyTasks
    var tasksIndex = req.body.tasksIndex
    var levels = req.body.level

    var flagCheckSubjects = true // se todas as materias tiverem tarefas suficientes, retorna true 

    var data = {
        studentId,
        howManySubjects,
        subjects,
        howManyTasks,
        tasksIndex,
        levels
    }

    // Checar se há tarefas suficientes no banco de dados
    var checkDB = checkHowManyTasks(data)
    console.log(checkDB)
})



//  --  Checagem de quantidade de tarefas é suficiente  --
function checkHowManyTasksDB(subject, howManyTasks){
    return new Promise(resolve => {
        Task.findAndCountAll({
            where:{
                subjectId: subject
            }
        }).then(task =>{
            resolve(task.count)
        })
    })
}

async function checkHowManyTasks(data){

    console.log(data)

    for (let i = 0; i < data.howManySubjects; i++) {
        const howManyTasksDB = await checkHowManyTasksDB(data.subjects[i], data.howManyTasks[i])

        if(howManyTasksDB < (parseInt(data.howManyTasks[i],10) + parseInt(data.tasksIndex[i],10))){
            console.log('Estou aqui')
            return false
        }
    }

    return true
}
//  --  --

module.exports = router