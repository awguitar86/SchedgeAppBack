const express = require('express')

const exportExcelController = require('../controllers/exportExcel')

const router = express.Router()

router.post('/postexcel', exportExcelController.postExcel)

module.exports = router