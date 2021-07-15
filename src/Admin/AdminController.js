const express = require('express')
const router = express.Router()
const Admin = require('./Admin')
const bcrypt = require('bcryptjs')
const adminAuth = require('../middleware/adminAuth')


router.get('/admin/admins', adminAuth, (req, res) => {
    
    Admin.findAll({}).then( admins => {
        res.render('admin/admins/index', {admins})
    })
})

router.get('/admin/login', (req, res) => {

    res.render('admin/index')
})

router.post('/admin/authenticate', (req, res) => {
    
    var email = req.body.email
    var password = req.body.password

    Admin.findOne({where: { email: email}}).then( admin => {
        if(admin != undefined){
            var validation = bcrypt.compareSync(password, admin.password)
            if(validation){
                req.session.admin = {
                    name: admin.name,
                    email: admin.email
                }
                res.redirect('/admin/students')
            }
        }else{
            res.redirect('/admin/login')
        }
    })
})

router.get('/admin/admin/new', adminAuth,(req, res) => {
    res.render('admin/admins/new')
})

router.post('/admin/admin/save', adminAuth, (req, res) => {

    var password = req.body.password
    var salt = bcrypt.genSaltSync(10)
    var hash = bcrypt.hashSync(password, salt)

    Admin.create({
        name: req.body.name,
        email: req.body.email,
        password: hash

    }).then( () => {
        res.redirect('/admin/admins')
    })
})

router.post('/admin/admin/update', adminAuth, (req, res) => {

    if(req.body.password.length <= 0){
        Admin.update({name: req.body.name, email: req.body.email}, {
            where: {
                id: req.body.adminId
            }
        }).then(() => {
            res.redirect('/admin/admins')
        })
    }else{
        var password = req.body.password
        var salt = bcrypt.genSaltSync(10)
        var hash = bcrypt.hashSync(password, salt)

        Admin.update({name: req.body.name, 
                        email: req.body.email,
                        password: hash}, {
            where:{
                id: req.body.adminId
            }
        }).then(() => {
            res.redirect('/admin/admins')
        })
    }
})

router.get('/admin/admin/view/:adminId', adminAuth, (req, res) => {
    var adminId = req.params.adminId
    Admin.findByPk(adminId).then( admin => {
        res.render('admin/admins/admin', {admin})
    })
})

router.get('/admin/admin/delete/:adminId', adminAuth, (req, res) => {
    Admin.destroy({
        where:{
            id:req.params.adminId
        }
    }).then( () =>{
        res.redirect('/admin/admins')
    })
})

module.exports = router