const express = require('express')
const router = express.Router()
const Student = require('./Students')
const TrailsLink = require('../trails/TrailsLink')
const Trails = require('../trails/Trails')
const Planning = require('./Planning')
const Subject = require('../subjects/Subject')
const Level = require('../level/Level')
const bcrypt = require('bcryptjs')
const Task = require('../tasks/Task')
const adminAuth = require('../middleware/adminAuth')

router.get('/admin/students', adminAuth, (req, res) => {

    Student.findAll({
        order:[['name']]
    }).then(students => {
        res.render('admin/students/index', {students: students})
    })
})

router.get('/admin/students/new', adminAuth, (req, res) => {
    res.render('admin/students/new')
})

router.post('/students/save', adminAuth, (req, res) => {

    var name = req.body.name
    var email = req.body.email
    var password = req.body.password

    if( ! (name == undefined && email == undefined && password == undefined)){

        Student.findOne({where:{email:email}}).then( student => {
            if(student == undefined){
    
                var salt = bcrypt.genSaltSync(10)
                var hash = bcrypt.hashSync(password, salt)
    
                Student.create({
                    name:name,
                    email:email,
                    password:hash,
                    auto:true
                }).then(() => {
                    res.redirect('/admin/students')
                }).catch((err) => {
                    res.redirect('/admin/students')
                })
            }else{
    
            }
        })

    }else{
        res.redirect('/admin/students')
    }

})

router.get('/admin/student/view/:studentId', adminAuth, (req, res) => {

    var studentId = req.params.studentId

    if(isNaN(studentId)){
        res.redirect('admin/students')
    }else{
        Student.findByPk(studentId).then( student => {
            if(student != undefined){
                TrailsLink.findAll({
                    where: {
                        studentId
                    }, order:[['number', 'DESC']]
                    }).then( trails => {
                        var automaticTrail = trails.length < 1 ? false : true
                        res.render('admin/students/student', {student, trails, automaticTrail})
                    })
            }else{
                res.redirect('/admin/student')
            }
        }).catch(err => {
            res.redirect('/admin/student')
        })
    }
})

router.get('/admin/student/edit/:studentId', adminAuth, (req, res) => {
    var id = req.params.studentId
    Student.findByPk(id).then( student => {
        res.render('admin/students/edit', {student, mensage: null})
    })
})

router.post('/admin/student/update', adminAuth, (req, res) => {
    
    if(req.body.password.length <= 0){
        Student.update({name: req.body.name, email: req.body.email}, {
            where: {
                id: req.body.studentId
            }
        }).then(() => {
            res.redirect('/admin/students')
        })
    }else{
        var password = req.body.password
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(password, salt)

        Student.update({name: req.body.name, 
                        email: req.body.email,
                        password: hash}, {
            where:{
                id: req.body.studentId
            }
        }).then(() => {
            res.redirect('/admin/students')
        })
    }
})

router.get('/admin/student/delete/:studentId', adminAuth, (req, res) => {
    deleteStudent(req.params.studentId).then( () => {
        res.redirect('/admin/students')
    })
})

router.get('/admin/student/planning/:studentId', adminAuth, (req, res) => {
    Subject.findAll().then( subjects => {
        res.render('admin/students/planningSubjects', {studentId: req.params.studentId, subjects})
    })
})

router.get('/admin/student/planning/:studentId/:subjectId/:levelId', adminAuth, (req, res) => {

    Level.findAll({}).then( levels => {
        var level = levels[0].id

        if(req.params.levelId != -1){
            level = req.params.levelId
        }
        Task.findAndCountAll({
            where:{
                subjectId: req.params.subjectId,
                levelId: level
            }
        }).then( tasks => {

            Planning.findAll({
                where:{
                    subjectId: req.params.subjectId,
                    levelId: level,
                    studentId: req.params.studentId
                }
            }).then(plannings => {
                
                var planningsNumber = []

                plannings.forEach(element => {
                    planningsNumber.push(element.num)
                })
                res.render('admin/students/planningTasks', {howMany: tasks.count, 
                                                            subjectId: req.params.subjectId, 
                                                            levels: levels,
                                                            levelSelected: req.params.levelId, 
                                                            studentId: req.params.studentId, 
                                                            planning: planningsNumber})
            })
        })
    })
})

router.post('/admin/student/planning', adminAuth, (req, res) => {
    
    const obj = JSON.parse(JSON.stringify(req.body)); // req.body = [Object: null prototype] { title: 'product' }
    var tasks = Object.keys(obj)

    var studentId = parseInt(obj.studentId, 10)
    var subjectId = parseInt(obj.subjectId, 10)
    var levelId = parseInt(obj.levelId, 10)

    tasks.splice(tasks.indexOf('studentId'), 1)
    tasks.splice(tasks.indexOf('levelId'), 1)
    tasks.splice(tasks.indexOf('subjectId'), 1)

    savePlanning(studentId, subjectId, levelId, tasks)

    res.redirect(`/admin/student/planning/${studentId}`)

})

router.get('/admin/student/resetPassword/:studentId', adminAuth, (req, res) => {
    
})

async function savePlanning(studentId, subjectId, levelId, tasks){

    await deletePlanning(studentId, subjectId, levelId)

    tasks.forEach(task => {
        Planning.create({
            num: parseInt(task, 10) + 1,
            subjectId: subjectId,
            levelId: levelId,
            studentId: studentId
        })
    })

}

function deletePlanning(studentId, subjectId, levelId){
    return new Promise( resolve => {
        Planning.findAll({
            where:{
                studentId: studentId,
                subjectId: subjectId,
                levelId: levelId
            }
        }).then(planning => {
            if(planning.length > 0){
                Planning.destroy({
                    where:{
                        studentId: studentId,
                        subjectId: subjectId,
                        levelId: levelId
                    }
                }).then(resul => {
                    resolve()
                })
            }else{
                resolve()
            }
        })
    })
}

async function deleteStudent(studentId){

    var link = await TrailsLink.findAndCountAll({
        where: {
            studentId
        }
    }).then( trailsLink => {
        return trailsLink
    })

    for(i = 0; i < link.count; i++){
        await Trails.destroy({
            trailsLinkId: link.rows[i].id
        }).catch( err => {

        })
    }

    await TrailsLink.destroy({
        where: {
            studentId
        }
    }).catch( err => {

    })

    await Student.destroy({
        where: {
            id: studentId
        }
    }).catch( err => {
        
    })
}

module.exports = router