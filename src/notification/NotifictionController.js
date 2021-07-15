const express = require('express')
const router = express.Router()

router.get('/admin/notification', (req, res) => {
    res.render('admin/notifications/index')
})

module.exports = router