const express = require('express')
const router = express.Router()
const Subject = require('./Subject')
const SubjectHistory = require('./SubjectsHistory')
const slugify = require('slugify')
const adminAuth = require('../middleware/adminAuth')

router.get('/admin/subjects', adminAuth, (req, res) => {

    Subject.findAll({
        order: [['slug']]
    }).then( subjects => {
        res.render('admin/subjects/index', {subjects})
    })
    
})

router.get('/admin/subjects/new', adminAuth, (req, res) => {
    res.render('admin/subjects/new')
})

router.post('/subjects/save', adminAuth, (req, res) => {

    var title = req.body.subject
    var slug = slugify(title)

    if(title != undefined){

        Subject.findOne({

            where:{title: title}}).then( subject => {
                if(!subject){

                    Subject.create({
                        title: title,
                        slug: slug
                    }).then(() => {
                        res.redirect('/admin/subjects')
                    })

                }else{
                    res.redirect('/admin/subjects')
                }
        })
    }else{
        res.redirect('/admin/subjects/new')
    }
})

router.get('/admin/subjects/edit/:id', adminAuth, (req, res) => {
    
    var id = req.params.id

    if(isNaN(id)){
        res.redirect('/admin/subjects')

    }else{

        Subject.findByPk(id).then(subject => {
            if(subject != undefined){
                res.render('admin/subjects/edit', {subject})
            }else{
                res.redirect('/admin/subjects')
            }
        }).catch(err => {
            res.redirect('/admin/subjects')
        })

    }
})

router.post('/subjects/update', adminAuth, (req, res) => {

    var id = req.body.id
    var title = req.body.subject
    var slug = slugify(title)

    Subject.update({title: title, slug: slug}, {
        where: {
            id
        }
    }).then(() => {
        res.redirect('/admin/subjects')
    })
})

router.post('/admin/subjects/delete', adminAuth, (req, res) => {

    var id = req.body.id

    if(id != undefined){
        if(!isNaN(id)){
            Subject.destroy({
                where: {
                    id: id
                }
            }).then(()  => {
                res.redirect('/admin/subjects')
            })
        }else{
            res.redirect('/admin/subjects')
        }
    }else{
        res.redirect('/admin/subjects')
    }
})



module.exports = router