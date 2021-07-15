const express = require('express')
const router = express.Router()
const Task = require('./Task')
const Subject = require('../subjects/Subject')
const slugify = require('slugify')
const multer = require('multer')
const multerConfig = require('../config/multer')
const aws = require('aws-sdk')
const Level = require('../level/Level')
const adminAuth = require('../middleware/adminAuth')

const s3 = new aws.S3()


router.get('/admin/tasks', adminAuth, (req, res) => { // Tela inicial das tarefas

    Task.findAll({
        include: [{model: Subject}]
    }).then( tasks => {
        if(tasks != undefined){
            res.render('admin/tasks/index', {tasks: tasks, subjectTitle: tasks[0].subject.title})
        }else{
            res.redirect('/')
        }
        
    }).catch( err => {
        
    })
})

router.post('/admin/tasks/new', adminAuth, (req, res) => { // Tela para cadastrar uma nova tarefa

    Subject.findAll().then( subjects => {
        Level.findAll().then( levels => {
            res.render('admin/tasks/new', {subjects: subjects, levels: levels, num: req.body.nextNum, subjectId: req.body.sub, levelId: req.body.level })
        })
    })
})

router.post('/admin/tasks/upload',multer(multerConfig).single('file'), adminAuth, (req, res) => { // Cria uma nova tarefa, cadastrando o pdf na amazon e os dados do BD

    var num = req.body.number
    var subject = req.body.sub
    var level = req.body.level
    var key = req.file.key
    var url = req.file.location

    Task.create({
        num: num,
        key: key,
        url: url,
        subjectId: subject,
        levelId: level

    }).then(() => {
        if(req.body.pageControl == 0){
            res.redirect('admin/tasks')
        }else{
            res.redirect(`/admin/tasks/${req.body.pageControl}/${level}`)
        }
        
    }).catch(err => {
        res.redirect('admin/tasks')
    }) 
})

router.get('/admin/tasks/:id', adminAuth, (req, res) => { // Tela com as tarefas por materia 

    Task.findAll({
        where:{
            subjectId: req.params.id
        },
        include: [{model: Subject}, {model: Level}]
    }).then(tasks => {
        if(tasks.length == 0){
            Subject.findAll().then( subjects => {
                Level.findAll().then(levels => {
                    res.render('admin/tasks/new', {subjects: subjects, levels: levels, num: 1, subjectId: req.params.id, levelId: req.body.level })
                })
            })
        }else{
            var levels = []

            tasks.forEach(task => {
                if(levels.length > 0){
                    var flag = true
                    levels.forEach(level => {
                        if(level.id == task.level.id){
                            flag = false
                        }
                    })
                    if(flag){
                        levels.push(task.level)
                    }
                }else{
                    levels.push(task.level)
                }
            })
            res.render('admin/tasks/taskSub', {tasks: tasks, levels: levels, level: -1})
        }
    })
})

router.get('/admin/tasks/:subject/:level', adminAuth, (req, res) => {

    Task.findAll({
        where:{
            subjectId: req.params.subject
        },
        include: [{model: Subject}, {model: Level}]
    }).then(tasks => {
        
        if(tasks.length == 0){
            Subject.findAll().then( subjects => {
                res.render('admin/tasks/new', {subjects: subjects, id: req.params.id, num: 0})
            })
        }else{
            var levels = []

            tasks.forEach(task => {
                if(levels.length > 0){
                    var flag = true
                    levels.forEach(level => {
                        if(level.id == task.level.id){
                            flag = false
                        }
                    })
                    if(flag){
                        levels.push(task.level)
                    }
                }else{
                    levels.push(task.level)
                }
            })

            var _tasks = []

            tasks.forEach( task => {

                if(task.level.id == req.params.level){
                    _tasks.push(task)
                }
            })
            res.render('admin/tasks/taskSub', {tasks: _tasks, levels: levels, level: req.params.level})
        }
    })
    
})

router.get('/admin/task/:id', adminAuth, (req, res) => { // Tela que mostra uma unica tarefa

    var id = req.params.id

    Task.findOne({
        where: {
            id: id
        }
    }).then( task => {
        if(task != undefined){

            Subject.findOne({
                where:{
                    id: task.subjectId
                }
            }).then(subject => {
                res.render('admin/tasks/task', {subject: subject, task: task})
            })
            
        }else {
            res.redirect('/admin/tasks')
        }
    }).catch(err => {
        res.redirect('/admin/tasks')
    })

})

router.post('/admin/task/delete', adminAuth, (req, res) => { // Deleta uma tarefa, apagando o pdf da amazon e os dados do BD

    var id = req.body.id
    var key = req.body.key
    var subId = req.body.subId

    s3.deleteObject({
        Bucket: `${process.env.AWS_BUCKET}`,
        Key: key,
    }).promise()

    if(id != undefined){
        if(!isNaN(id)){
            Task.destroy({
                where: {
                    id: id
                }
            }).then(()  => {
                Task.findAll({
                    where:{
                        subjectId: subId
                    },
                    include: [{model: Subject}]
                }).then(tasks => {
            
                    if(tasks.length > 0){
                        Level.findAll().then(levels => {
                            res.redirect(`/admin/tasks/${subId}/${req.body.level}`)
                        })
                    }else{
                        Subject.findAll().then( subjects => {
                            res.redirect('/admin/subjects')
                        })
                    }
                })
            })
        }else{
            res.redirect(`/admin/tasks/${subId}`)
        }
    }else{
        res.redirect(`/admin/tasks/${subId}`)
    }

})

router.get('/admin/task/edit/:id', adminAuth, (req, res) => { // Tela para editar tarefas 

    var id = req.params.id

    if(isNaN(id)){
        res.redirect('/admin/tasks')
    }else{

        Task.findByPk(id).then(task => {
            if(task != undefined){
                Subject.findAll().then( subjects => {
                    if(subjects != undefined){
                        res.render('admin/tasks/edit', {subjects: subjects, task: task})
                    }else {
                        res.redirect('/admin/tasks')
                    }
                })
            } else {
                res.redirect('/admin/tasks')
            }
        })
    }
})

router.post('/admin/task/update', multer(multerConfig).single('file'), adminAuth, (req, res) => { /* Edita uma tarefa, apagando o pdf antigo e subindo um novo na amazon e 
                                                                                          atualizando os dados no BD */

    var id = req.body.id
    var key = req.file.key
    var delKey = req.body.delKey
    var num = req.body.num
    var url = req.file.location
    var subId = req.body.subId
    
    s3.deleteObject({
        Bucket: `${process.env.AWS_BUCKET}`,
        Key: delKey,
    }).promise()

    Task.update({num: num, key: key, url: url, subjectId: subId}, {
        where:{
            id: id
        }
    }).then(() => {
        res.redirect(`/admin/tasks/${subId}`)
    }).catch( err => {
        res.redirect('/admin/tasks')
    })

})

module.exports = router