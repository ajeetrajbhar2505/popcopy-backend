const express = require('express');
const router = express.Router();

const controller = require('../controllers/wattpadController');

router.get('/login', controller.login);
router.get('/scrape', controller.scrapeStory);

module.exports = router;