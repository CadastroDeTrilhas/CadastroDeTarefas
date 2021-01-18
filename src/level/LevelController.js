const express = require('express')
const router = express.Router()
const Level = require('./Level')
const Subject = require('../subjects/Subject')
const slugify = require('slugify')

router.get('/admin/levels', (req, res) => {
    Level.findAll().then(levels => {
        res.render('admin/levels/index', {levels})
    })
})

router.post('/admin/levels/new', (req, res) => {
    console.log('bosta')
    res.render('admin/levels/new') 
})

router.post('/admin/levels/save', (req, res) => {

    var title = req.body.title
    var slug = slugify(title)

    if(title != undefined){
        Level.findOne({
            where: {slug: slug}
        }).then( level => {
            if(!level){
                Level.create({
                    title: title,
                    slug: slug
                }).then(() => {
                    res.redirect('/admin/levels')
                })
            }else{
                res.redirect('/admin/levels')
            }
        })
    }else{
        res.redirect('/admin/levels/new')
    }
})



module.exports = router