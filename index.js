require('dotenv').config()

const express = require('express')
const app = express()
const session = require('express-session')
const flash = require('express-flash')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const connection = require('./src/database/database')

const subjectsController = require('./src/subjects/SubjectsController')
const studentsController = require('./src/students/StudentsController')
const tasksController = require('./src/tasks/TasksController')
const levelsController = require('./src/level/LevelController')
const trailsController = require('./src/trails/TrailsController')
const notificationController = require('./src/notification/NotifictionController')
const adminController = require('./src/Admin/AdminController')
const userController = require('./src/user/UserController')
const coverController =  require('./src/cover/CoverController')

const port = 3000

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use(cookieParser('123deoliveira4'))

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
}))

app.use(flash())

app.use('/', subjectsController)
app.use('/', studentsController)
app.use('/', tasksController)
app.use('/', levelsController)
app.use('/', trailsController)
app.use('/', notificationController)
app.use('/', adminController)
app.use('/', userController)
app.use('/', coverController)

app.get('/', (req, res) => {
    res.redirect('/user/login')
})

app.get('/admin', (req, res) => {
    res.redirect('/admin/login')
})

app.listen(port, () => {
    console.log('Server Online!\nPort:', port)
})