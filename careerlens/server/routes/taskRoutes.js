const express = require('express');
const router = express.Router();
const { generateTasks, getTasks, getTaskTest, submitTaskTest } = require('../controller/taskController');

router.post('/generate', generateTasks);
router.get('/', getTasks);
router.get('/test/:taskId', getTaskTest);
router.post('/submit-test', submitTaskTest);

module.exports = router;
