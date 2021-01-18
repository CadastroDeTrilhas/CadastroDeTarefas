require('dotenv').config()

const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const connection = require('./src/database/database')

const subjectsController = require('./src/subjects/SubjectsController')
const studentsController = require('./src/students/StudentsController')
const tasksController = require('./src/tasks/TasksController')
const levelsController = require('./src/level/LevelController')
const trailsController = require('./src/trails/TrailsController')

const port = 3000
 

app.set('view engine', 'ejs')

app.use(express.static('public'))

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/', subjectsController)
app.use('/', studentsController)
app.use('/', tasksController)
app.use('/', levelsController)
app.use('/', trailsController)

app.get('/', (req, res) => {
    res.render('index')
})

app.listen(port, () => {
    console.log('Server Online!\nPort:', port)
})