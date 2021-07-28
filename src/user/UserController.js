const express = require('express')
const router = express.Router()
const User = require('../students/Students')
const TrailsLink = require('../trails/TrailsLink')
const Trail = require('../trails/Trails')
const Planning = require('../students/Planning')
const Task = require('../tasks/Task')
const Cover = require('../cover/Cover')
const fetch = require('node-fetch')
const { degrees, PDFDocument, rgb, StandardFonts } = require('pdf-lib')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const userAuth = require('../middleware/userAuth')

router.get('/user/login', (req, res) => {
    res.render('user/index', {mensage: ''})
})

router.post('/user/authenticate', (req, res) => {

    var email = req.body.email
    var password = req.body.password

    User.findOne({where: { email: email}}).then( user => {
        if(user != undefined){
            var validation = bcrypt.compareSync(password, user.password)
            if(validation){
                req.session.user = {
                    id: user.id,
                    name: user.name,
                    email: user.email
                }
                res.redirect('/user/trails')
            } else{
                res.render('user/index', {mensage: 'Senha não confere'})
            }
        }else{
            res.render('user/index', {mensage: 'Usuario não encontrado'})
        }
    }) 
})

router.get('/user/profile', userAuth, (req, res) => {
    var user = {
        name: req.session.user.name,
        email: req.session.user.email
    }
    res.render('user/profile', {user})
})

router.get('/user/edit', userAuth, (req, res) => {

    var user = {
        name: req.session.user.name,
        email: req.session.user.email
    }

    res.render('user/edit', {user})
})

router.post('/user/update', userAuth, (req, res) => {

    var password = req.body.password
    var salt = bcrypt.genSaltSync(10)
    var hash = bcrypt.hashSync(password, salt)

    User.update({name: req.body.name, email: req.body.email, password: hash}, {
        where:{
            id: req.session.user.id
        }
    }).then( () => {
        res.redirect('/user/profile')
    })
})

router.get('/user/trails', userAuth, (req, res) => {

    var studentId = req.session.user.id

    TrailsLink.findAll({
        where:{
            studentId: studentId
        }, order:[['number', 'DESC']]
    }).then( trailsLink => {
        User.findByPk(studentId).then( user => {
            res.render('user/trails', {student: user, trails: trailsLink})
        })
    })
})

router.get('/user/trailPdf/:trailId', userAuth, (req, res) => {

    var trailId = req.params.trailId
    var studentId = req.session.user.id
    
    Trail.findAll({
        where:{trailsLinkId: trailId},
        include: [{model: TrailsLink}]
    }).then(trail => {

        if(trail[0].trailsLink.view != true){
            TrailsLink.update({view: true}, {
                where:{
                    id: trailId
                }
            })
        }

        User.findOne({
            where:{id: studentId}
        }).then(student => {
            getTasksLinks(trail, studentId, student.name, trail[0].trailsLink.number).then(pdfDoc => {
                res.contentType('application/pdf')
                res.download(`./${pdfDoc}`)
            })
        })
    })
})

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

module.exports = router