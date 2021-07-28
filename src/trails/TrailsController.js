const express = require('express')
const router = express.Router()
const TrailsLink = require('./TrailsLink')
const Trail = require('./Trails')
const Subject = require('../subjects/Subject')
const Level = require('../level/Level')
const Task = require('../tasks/Task')
const { degrees, PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const fs = require('fs')
const fetch = require('node-fetch')
const Student = require('../students/Students')
const LastTrail = require('./LastTrails')
const Planning = require('../students/Planning')
const Cover = require('../cover/Cover')
const { resolve } = require('path')
const { Op } = require("sequelize");
const adminAuth = require('../middleware/adminAuth')


router.get('/admin/trails/howMany/:studentId', adminAuth, (req, res) => {

    var studentId = req.params.studentId

    TrailsLink.findAndCountAll({
        where:{
            studentId
        }
    }).then( trails => {
        var trailNum = trails.count <= 0 ? 1 : trails.count + 1
        res.render('admin/trails/howManySubjects', {studentId, trailNum})
    })    
})

router.post('/admin/trails/new', adminAuth, (req, res) => {

    var {studentId, howManySubjects, trailNum} = req.body
    var subjectsControl = []
    var howManyTasks = []
    var tasksIndex = []
    var levelsControl = []

    for (let i= 0; i < howManySubjects; i++) {
        subjectsControl.push(0)
        howManyTasks.push(undefined)
        tasksIndex.push(undefined)
        levelsControl.push(undefined)
    }
    

    Subject.findAll({order:[['title']]}).then(subjects => {
        Level.findAll().then(levels => {
            Cover.findAll().then( covers => {
                res.render('admin/trails/new', {studentId, howManySubjects, covers, trailNum, subjects, levels, subjectsControl, howManyTasks, tasksIndex, levelsControl, msg: undefined})
            })
        })
    })
})

router.get('/admin/trails/new', adminAuth, (req, res) => {

    var studentId = req.flash('studentId')
    var howManySubjects = req.flash('howManySubjects')
    var subjectsControl = req.flash('subjectsControl')
    var howManyTasks = req.flash('howManyTasks')
    var tasksIndex = req.flash('tasksIndex')
    var levelsControl = req.flash('levelsControl')
    var msg = req.flash('msg')

    msg = (msg == undefined || msg.length == 0) ? undefined : msg

    Subject.findAll({order:[['title']]}).then(subjects => {
        Level.findAll({}).then(levels => {
            Cover.findAll().then( covers => {
                res.render('admin/trails/new', {studentId, howManySubjects, covers, subjects, levels, subjectsControl, howManyTasks, tasksIndex, levelsControl, msg})
            })
        })
    })
})

router.post('/admin/trail/checkData', adminAuth, (req, res) => {

    var data = {studentId,
        howManySubjects,
        trailNum,
        subjectsId,
        howManyTasks,
        tasksIndex,
        levelsId} = req.body

    
        // Verifica campos preenchidos corretamente e salva os dados no BD
        checkForm(data).then(resul => {
            res.json({msg: resul, studentId: data.studentId})
        })
})

router.post('/admin/trails/save', adminAuth, (req, res) => {

    var data = {studentId,
    howManySubjects,
    coverId,
    trailNum,
    subjectsId,
    howManyTasks,
    tasksIndex,
    levelsId} = req.body


    saveForm(data, false).then(resul => {
        saveLastTrails(data).then(index => {
                res.redirect(`/admin/student/view/${data.studentId}`)
            })
        })   
})

router.get('/admin/trail/edit/:trailId/:studentId', adminAuth, (req, res) =>{

    Trail.destroy({
        where:{
            trailsLinkId: req.params.trailId
        }
    }).then( () => {
        TrailsLink.destroy({
            where: {
                id: req.params.trailId
            }
        }).then(trailLink => {
            res.redirect(`/admin/trails/howMany/${req.params.studentId}`)
        })
    })
})

router.get('/admin/trail/delete/:trailId/:studentId', adminAuth, (req, res) => {
    Trail.destroy({
        where:{
            trailsLinkId: req.params.trailId
        }
    }).then( () => {
        TrailsLink.destroy({
            where: {
                id: req.params.trailId
            }
        }).then(trailLink => {
            TrailsLink.findAll({
                where:{
                    studentId: req.params.studentId
                }, order:[['createdAt', 'DESC']], limit: 1
            }).then( trailLink => {
                Trail.findAll({
                    where:{
                        trailsLinkId: trailLink[0].id
                    }
                }).then( trail => {
                    
                    var data = agroupTrails(req.params.studentId, trail)
                    saveLastTrails(data)
                })
            })
            res.redirect(`/admin/student/view/${req.params.studentId}`)
        })
    })
})

router.get('/admin/trail/view/:trailId/:studentId/:current', adminAuth, (req, res) => {

    var {trailId, studentId, current} = req.params

    Trail.findAll({
        where:{trailsLinkId: trailId},
        include: [{model: TrailsLink}]
    }).then(trail => {
        var trailNum = trail[0].trailsLink.number

        Subject.findAll({order:[['title']]}).then( _subjects => {
            var subjects = [_subjects.map( function(subject) {return subject.id}), _subjects.map( function(subject) {return subject.title })]

            Level.findAll({}).then( _levels => {
                var levels = [_levels.map( function(level) {return level.id}), _levels.map( function(level) {return level.title})]
                getTasksNum(trail, studentId).then( tasks => {
                    var tasks = [tasks.map( function(task) {return task.subjectId}), tasks.map( function(task) {return task.numbers })]
                    tasks[1] = tasks[1].map( function(task) {return JSON.stringify(task)})
                    tasks[1] = tasks[1].map( function(task) {return task.slice(1, -1)})
                    tasks[1] = tasks[1].map( function(task) {return task.replace(/,/g, ', ')})
                    res.render('admin/trails/trail', {subjects, levels, trail, trailId, studentId, trailNum, tasks, current})
                })
            })
        })
    })
})

router.get('/admin/trailPdf/:trailId/:studentId', adminAuth, (req, res) => {

    var trailId = req.params.trailId
    var studentId = req.params.studentId
    
    Trail.findAll({
        where:{trailsLinkId: trailId},
        include: [{model: TrailsLink}]
    }).then(trail => {
        Student.findOne({
            where:{id: studentId}
        }).then(student => {
            getTasksLinks(trail, studentId, student.name, trail[0].trailsLink.number).then(pdfDoc => {
                res.contentType('application/pdf')
                res.download(`./${pdfDoc}`)
            })
        })
    })
})

router.get('/admin/trail/trailsGen/:studentId', adminAuth, (req, res) => {

    var studentId = req.params.studentId

    LastTrail.findAll({
        where:{
            studentId: studentId
        }
    }).then( resul => {

        var subjectsId = []
        var tasksIndex = []
        var levelsId = []
        var howManyTasks= []

        resul.forEach(element => {
            subjectsId.push(element.subjectId)
            tasksIndex.push(element.index + element.howManyTasks)
            levelsId.push(element.level)
            howManyTasks.push(element.howManyTasks)
        })

        TrailsLink.findAll({
            where:{
                studentId
            }, order: [['updatedAt', 'DESC']], limit: 1
            
        }).then( link => {
            
            var data ={
                studentId: studentId,
                howManySubjects: resul.length,
                coverId: link[0].cover,
                trailNum: -1,
                subjectsId: subjectsId,
                howManyTasks: howManyTasks,
                tasksIndex: tasksIndex,
                levelsId: levelsId
            }

            saveForm(data, true).then(resul => {
                saveLastTrails(data).then(index => {
                    res.redirect(`/admin/student/view/${studentId}`)
                })
            })
        })
    })
})

router.get('/admin/trail/new/edit/:studentId', adminAuth, (req, res) => {
    var studentId = req.params.studentId

    LastTrail.findAll({
        where:{
            studentId: studentId
        }
    }).then( resul => {

        var subjectsId = []
        var tasksIndex = []
        var levelsId = []
        var howManyTasks= []

        resul.forEach(element => {
            subjectsId.push(element.subjectId)
            tasksIndex.push(element.index + element.howManyTasks)
            levelsId.push(element.level)
            howManyTasks.push(element.howManyTasks)
        })

        var data ={
            studentId: studentId,
            howManySubjects: resul.length,
            trailNum: -1,
            subjectsId: subjectsId,
            howManyTasks: howManyTasks,
            tasksIndex: tasksIndex,
            levelsId: levelsId
        }

        getEditNewTrail(data).then( resul => {
            TrailsLink.findAll({
                where: {
                    studentId: studentId
                }, attributes:['number'],
                order:[['number', 'DESC']], limit: 1
            }).then(trail => {
                var trailNum = trail[0].number+1
                Subject.findAll({order:[['title']]}).then(subjects => {
                    Level.findAll({}).then(levels => {
                        Cover.findAll({}).then( covers => {
                            var howManySubjects = resul.subjects.length
                            var subjectsControl = resul.subjects
                            var howManyTasks = resul.howManyTasks
                            var tasksIndex = resul.index
                            var levelsControl = resul.levels
                            var coverControl = 0
                            res.render('admin/trails/edit', {studentId, howManySubjects, covers, trailNum, subjects, levels, subjectsControl, coverControl, howManyTasks, tasksIndex, levelsControl, msg: undefined, update: false})
                        })
                    })
                })
            })
        })
    })
})

router.post('/admin/trail/edit/sum', adminAuth, (req, res) => {
    
    var data = req.body

    data.howManySubjects = parseInt(data.howManySubjects, 10) + 1

    if( !Array.isArray(data.subjectsId)){

        data.subjectsId = [data.subjectsId]
        data.howManyTasks = [data.howManyTasks]
        data.tasksIndex = [data.tasksIndex]
        data.levelsId = [data.levelsId]

    }

    data.subjectsId.push('')
    data.howManyTasks.push('')
    data.tasksIndex.push('')
    data.levelsId.push('')

    var studentId = data.studentId
    var howManySubjects = data.howManySubjects
    var trailNum = data.trailNum
    var subjectsControl = data.subjectsId
    var howManyTasks = data.howManyTasks
    var tasksIndex = data.tasksIndex
    var levelsControl = data.levelsId
    var coverControl = data.coverId

    Subject.findAll({order:[['title']]}).then( subjects => {
        Level.findAll({}).then( levels => {
            Cover.findAll({}).then( covers => {
                res.render('admin/trails/edit', {studentId, howManySubjects, covers, trailNum, subjects, 
                                                 levels, subjectsControl, howManyTasks, tasksIndex, levelsControl, coverControl,
                                                 msg: undefined, update: false})
            })
        })
    })
})

router.post('/admin/trail/edit/subtract', adminAuth, (req, res) => {

    var data = req.body
    
    data.subjectsId.splice(data.delete, 1)
    data.howManyTasks.splice(data.delete, 1)
    data.tasksIndex.splice(data.delete, 1)
    data.levelsId.splice(data.delete, 1)

    data.howManySubjects = parseInt(data.howManySubjects, 10) - 1

    res.jsonp(data)
})

router.get('/admin/trail/reload/:data', adminAuth, (req, res) => {

    var data = JSON.parse(req.params.data)

    var studentId = data.studentId
    var howManySubjects = data.howManySubjects
    var trailNum = data.trailNum
    var subjectsControl = data.subjectsId
    var howManyTasks = data.howManyTasks
    var tasksIndex = data.tasksIndex
    var levelsControl = data.levelsId

    Subject.findAll({order:[['title']]}).then( subjects => {
        Level.findAll({}).then( levels => {
            Cover.findAll({}).then( covers => {
                res.render('admin/trails/edit', {studentId, howManySubjects, covers, trailNum, subjects, levels, subjectsControl, howManyTasks, tasksIndex, levelsControl, msg: undefined, update: false})
            })
        })
    })
})

//  ---  Validacao do formulario  ---
//  --  Funcao que verifica se campos estao preenchidos corretamente  --
async function  checkForm(data){
    
    // Verifica se tem materias iguais
    if(new Set(data.subjectsId).size !== data.subjectsId.length){
        return 'Matérias estão duplicadas'
    }
    
    // Verifica se todos os campos estão preenchidos
    for(var i = 0; i < data.howManySubjects; i++){

        if(data.howManyTasks[i] == undefined || data.howManyTasks[i] == ''){
            return 'Número de tarefas não preenchido'
        }

        if(data.tasksIndex[i] == undefined || data.tasksIndex[i] == ''){
            return 'Índice não preenchido'
        }
    }

    // Verifica se exitem tarefas suficientes no nivel
    var resul = await checkHowManyTasks(data).then(resul => {
        if(resul){
            return `${resul} não tem tarefas suficientes`
        }
    })
    if(resul){// Se alguma materia não tem tarefas suficientes
        return resul
    }

    // Caso tudo esteja OK
    return false
}
//  --  --
//  --  Retorna quantidade de tarefas e titulo da materia  --
function checkHowManyTasksDB(subject, level, howManyTasks){
    return new Promise(resolve => {
        Task.findAndCountAll({
            where:{
                subjectId: subject,
                levelId: level
            },
        }).then(task => {
            
            Subject.findAll({
                where:{
                    id: subject
                }
            }).then(sub => {
                resolve({count: task.count, title: sub[0].title})
            })

        }).catch(err => {
            resolve(false)
        })
    })
}

async function checkHowManyTasks(data){

    for (let i = 0; i < data.howManySubjects; i++) {
        const resul = await checkHowManyTasksDB(data.subjectsId[i], data.levelsId[i], data.howManyTasks[i])
        
        if( resul.count < (parseInt(data.howManyTasks[i],10) + (parseInt(data.tasksIndex[i],10) - 1))){
            return resul.title
        }
    }
    return false
}
//  --  --
//  ---  ---

//  ---  Salve a trilha no BD  ---
async function saveForm(data, automtic){

    var count = data.trailNum <= 0 ? await getNum(data.studentId) : data.trailNum
    var linkId = await saveTrailsLink(count, data.coverId, data.studentId)
    var resul = await saveTrail(linkId, data, automtic)

    return resul
}

function getNum(studentId){
    
    return new Promise(resolve => {
        TrailsLink.findAll({
            where:{
                studentId: studentId
            }, attributes:['number'],
            order:[['number', 'DESC']]
        }).then(resul => {
            resolve(resul[0].number+1)
        })
    })
}

function saveTrailsLink(count, coverId, studentId){
    return new Promise(resolve => {
        TrailsLink.create({
            number: count,
            cover: coverId,
            studentId: studentId,
            view: false
        }).then(resul => {
            resolve(resul.id)
        })
    })
}

async function saveTrail(linkId, data, automtic){

    var index = -1
    const lastTrail = await getLastTrail(data.studentId)

    for(var i = 0; i < data.howManySubjects; i++){
        
        if(automtic){
            const lastTrail = await getLastTrail(data.studentId)
            
            var trail = {
                subject: data.subjectsId[i],
                level: data.levelsId[i],
                index: lastTrail[i].index,
                howManyTask: lastTrail[i].howManyTasks
            }

            const exclusion = await exclusionTasks(trail, data.studentId)
            
            index = exclusion.numbers[exclusion.numbers.length-1] + 1
        }else{
            index = parseInt(data.tasksIndex[i], 10)
        }

        const resul = await saveTrailDB(linkId, 
                                        data.subjectsId[i], 
                                        data.howManyTasks[i], 
                                        index, 
                                        data.levelsId[i])
    }

    return true
}

function getLastTrail(studentId){
    return new Promise(resolve => {
        LastTrail.findAll({
            where:{ studentId: studentId}
        }).then( resul => {
            resolve(resul)
        })
    })
}

function saveTrailDB(linkId, subjectId, howManyTasks, tasksIndex, levelsId){
    return new Promise(resolve => {
        
        Trail.create({
            subject: subjectId,
            howManyTask: howManyTasks,
            index: tasksIndex,
            level: levelsId,
            trailsLinkId: linkId
        }).then(resul => {
            resolve(resul)
        })
    })
}
//  ---  ---

//  ---  ---

async function getTasksNum(trail, studentId){
    var tasks = []
    for(i = 0; i < trail.length; i++){
        tasks.push(await exclusionTasks(trail[i], studentId))
    }
    return tasks
}

async function getTasksLinks(trail, studentId, name, trailNumber){

    var tasks = []

    for(i = 0; i < trail.length; i++){
        tasks.push(await exclusionTasks(trail[i], studentId))
    }

    var urlTasks = []

    for (let i = 0; i < tasks.length; i++) {
        var aux = []
        for (let j = 0; j < tasks[i].numbers.length; j++) {
            aux.push(await getUrl(tasks[i].subjectId, tasks[i].levelId, tasks[i].numbers[j]))
        }
        urlTasks.push(aux)  
    }

    console.log(urlTasks)

    urlTasks = shuffleTasks(urlTasks)

    const pdfDoc = []
    
    var urlPdf = await Cover.findByPk(trail[0].trailsLink.cover).then( resul => { return resul.url})
    urlPdf = await fetch(urlPdf).then( res => res.arrayBuffer())
    pdfDoc.push(await PDFDocument.load(urlPdf))
    
    for(i = 0; i < urlTasks.length; i++){
        urlPdf = await fetch(urlTasks[i]).then(res => res.arrayBuffer())
        pdfDoc.push(await PDFDocument.load(urlPdf))
    }

    const doc = await PDFDocument.create()
    const font = await doc.embedFont(StandardFonts.Helvetica)
    
    for(i = 0; i < pdfDoc.length; i++){
        const pages = await doc.copyPages(pdfDoc[i], pdfDoc[i].getPageIndices())
        var flag = true
        for(const page of pages){

            if(flag){
                page.drawRectangle({
                    x: 29,
                    y: 794,
                    width: 535,
                    height: 25,
                    color: rgb(0.20784, 0.10980, 0.45882)
                })

                var str = ((i)/10).toString()
                var number = str.split('.')

                number[1] = number[1] == undefined ? '0' : number[1]

                if(i <= 0){
                    
                    var year = trail[0].trailsLink.updatedAt.getFullYear()
                    var month = trail[0].trailsLink.updatedAt.getMonth() + 1
                    var day = trail[0].trailsLink.updatedAt.getDate()

                    month = (month/10).toString()
                    month = month.split('.')
                    month[1] = month[1] == undefined ? '0' : month[1]

                    var header = `Trilha ${trailNumber} - ${name} (${day}/${month[0]}${month[1]}/${year})`
                    
                    fontSize = 18
                    var textWidth = font.widthOfTextAtSize(header, fontSize)
                    
                    page.drawText(header, {
                        x: page.getWidth() / 2 - textWidth / 2,
                        y: 800,
                        size: fontSize,
                        color: rgb(1, 1, 1)
                    })
                }else{
                    page.drawText(`Tarefa ${number[0]}${number[1]}`, {
                        x: 260,
                        y: 800,
                        size: 17,
                        color: rgb(1, 1, 1)
                    })
                }

                flag = false
            }

            doc.addPage(page)
        }
    }

    var address = `${name}_trilha_${trailNumber}`

    fs.writeFileSync(`./${address}.pdf`, await doc.save())
    var data = fs.readFileSync(`./${address}.pdf`)

    let timer = setTimeout(function sayHi() {
        fs.unlink(`./${address}.pdf`, function (err){
            if (err) throw err;
        })
      }, 5000)

    return `./${address}.pdf`
}

function exclusionTasks(trail, studentId){

    return new Promise(resolve => {

        var exclusion = []

        Planning.findAll({
            where:{
                subjectId:trail.subject,
                levelId: trail.level,
                studentId: studentId
            }
        }).then(resul => {
            exclusion = resul.map( function(task){ return task.num})

            var numbers = []
            var element = trail.index 

            while (numbers.length < trail.howManyTask) {
                if(exclusion.indexOf(element) == -1){
                    numbers.push(element)
                }
                element++
            }
            resolve({subjectId:trail.subject, 
                     levelId: trail.level,
                     numbers: numbers})    
        })
    })
}

function getUrl(subjectId, levelId, number){
    return new Promise(resolve => {

        Task.findAll({
            where:{
                num: number,
                subjectId: subjectId,
                levelId: levelId
            }
        }).then( task => {
            resolve(task[0].url)
        })
    })
}

//  ---  ---  

function shuffleTasks(tasks){
 
    var howMany = []
    var urlTasks = []
    var max = -1

    tasks.forEach(element => {
        howMany.push(element.length)
        max = max < element.length ? element.length : max
    })

    for(i = 0; i < max; i++){
        for(j = 0; j < tasks.length; j++){
            if(i < howMany[j]){
                urlTasks.push(tasks[j][i])
            }
        }
    }
    return urlTasks   
}

async function saveLastTrails(data){
    var aux = await LastTrail.destroy({
        where:{
            studentId: data.studentId
        }
    })

    var count = []
    
    for(i = 0; i < data.howManySubjects; i++){
        
        //count.push(await Planning.findAndCountAll({
            //where:{
                //studentId: data.studentId,
                //subjectId: data.subjectsId[i],
                //levelId: data.levelsId[i],
                //num:{ [Op.lte]: data.tasksIndex[i]}
            //}
        //}).then(resul => {
            //return resul.count
        //}))
        aux = await LastTrail.create({
            howManyTasks: data.howManyTasks[i],
            index: parseInt(data.tasksIndex[i]),
            subjectId: data.subjectsId[i],
            studentId: data.studentId,
            level: data.levelsId[i]
        })
    }

    return count
}

function agroupTrails(studentId, trail){

    var subjectsId = []
    var levelsId = []
    var tasksIndex = []
    var howManyTasks = []

    trail.forEach( subject => {
        subjectsId.push(subject.subject)
        levelsId.push(subject.level)
        tasksIndex.push(subject.index)
        howManyTasks.push(subject.howManyTask)
    })

    return {studentId: studentId, howManySubjects: trail.length, howManyTasks: howManyTasks, subjectsId: subjectsId, levelsId: levelsId, tasksIndex: tasksIndex}
}

async function getEditNewTrail(data){

    var index = -1
    var newTrail = []
    var subjects = []
    var levels = []
    var howManyTasks = []
    var _index = []

    const lastTrail = await getLastTrail(data.studentId)

    for(var i = 0; i < data.howManySubjects; i++){
        

        const lastTrail = await getLastTrail(data.studentId)
            
        var trail = {
            subject: data.subjectsId[i],
            level: data.levelsId[i],
            index: lastTrail[i].index,
            howManyTask: lastTrail[i].howManyTasks
        }

        const exclusion = await exclusionTasks(trail, data.studentId)
            
        index = exclusion.numbers[exclusion.numbers.length-1] + 1

        subjects.push(data.subjectsId[i])
        levels.push(data.levelsId[i])
        howManyTasks.push(data.howManyTasks[i])
        _index.push(index)


    }

    return {subjects: subjects, levels: levels, howManyTasks: howManyTasks, index: _index}
}

module.exports = router