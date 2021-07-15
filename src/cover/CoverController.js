const express = require('express')
const router = express.Router()
const Cover = require('./Cover')
const multer = require('multer')
const multerConfig = require('../config/multer')
const aws = require('aws-sdk')

const s3 = new aws.S3()

router.get('/admin/cover', (req, res) => {

    Cover.findAll({}).then( covers => {
        res.render('admin/cover/index', {covers})
    })
})

router.get('/admin/cover/new', (req, res) => {
    res.render('admin/cover/new')
})

router.post('/admin/cover/upload', multer(multerConfig).single('file'), (req, res) => {

    var name = req.body.name
    var key = req.file.key
    var url = req.file.location

    Cover.create({
        name: name,
        key: key,
        url: url,
        selected: false
    }).then(() => {
        res.redirect('/admin/cover')
    })

})

router.get('/admin/cover/view/:coverId', (req, res) => {

    var coverId = req.params.coverId

    Cover.findByPk(coverId).then( cover => {
        res.render('admin/cover/view', {cover})
    })
})

router.get('/admin/cover/delete/:coverId', (req, res) => {
    
    Cover.findByPk(req.params.coverId).then( cover => {

        s3.deleteObject({
            Bucket: `${process.env.AWS_BUCKET}`,
            Key: cover.key,
        }).promise()

        Cover.destroy({
            where:{
                id: cover.id
            }
        }).then(() => {
            res.redirect('/admin/cover')
        })
    })
})

router.get('/admin/cover/edit/:coverId', (req, res) => {
    Cover.findByPk(req.params.coverId).then( cover => {
        res.render('admin/cover/edit', {cover})
    })
})

router.post('/admin/cover/edition', multer(multerConfig).single('file'), (req, res) => {

    var id = req.body.id
    var name = req.body.name
    var oldKey = req.body.oldKey
    var key = req.file.key
    var url = req.file.location
    
    s3.deleteObject({
        Bucket: `${process.env.AWS_BUCKET}`,
        Key: oldKey,
    }).promise().then(() => {
        Cover.update({name: name, key: key, url: url}, {
            where: {
                id: id
            }
        }).then( () => {
            res.redirect('/admin/cover')
        })
    })
})

module.exports = router