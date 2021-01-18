const express = require('express')
const router = express.Router()
const Subject = require('./Subject')
const SubjectHistory = require('./SubjectsHistory')
const slugify = require('slugify')

router.get('/admin/subjects', (req, res) => {

    Subject.findAll().then( subjects => {
        res.render('admin/subjects/index', {subjects})
    })
    
})

router.get('/admin/subjects/new', (req, res) => {
    res.render('admin/subjects/new')
})

router.post('/subjects/save', (req, res) => {

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

router.get('/admin/subjects/edit/:id', (req, res) => {
    
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

router.post('/subjects/update', (req, res) => {

    var id = req.body.id
    var title = req.body.title
    var slug = slugify(title)

    Subject.update({title: title, slug: slug}, {
        where: {
            id
        }
    }).then(() => {
        res.redirect('/admin/subjects')
    })
})

router.post('/admin/subjects/delete', (req, res) => {

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