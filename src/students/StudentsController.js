const express = require('express')
const router = express.Router()
const Student = require('./Students')
const Subject = require('../subjects/Subject')
const Trail = require('../trails/Trails')
const bcrypt = require('bcryptjs')

router.get('/admin/students', (req, res) => {

    Student.findAll().then(students => {
        res.render('admin/students/index', {students: students})
    })
})

router.get('/admin/students/new', (req, res) => {
    res.render('admin/students/new')
})

router.post('/students/save', (req, res) => {

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

router.get('/admin/students/student/:id', (req, res) => {

    var studentId = req.params.id

    if(isNaN(studentId)){
        res.redirect('admin/students')
    }else{

        Student.findByPk(studentId).then( student => {
            if(student != undefined){

                Trail.findAll({
                    where: {
                        studentId
                    }, order:[['number', 'DESC']]

                }).then( trails => {
                    res.render('admin/students/student', {student, trails})
                })

                
            }else{
                res.redirect('/admin/student')
            }
        }).catch(err => {
            res.redirect('/admin/student')
        })
    }

})

module.exports = router