const express = require('express')

const calendarController = require('../controllers/calendar')

const router = express.Router()

router.post('/postcsv', calendarController.postCsv)

module.exports = router