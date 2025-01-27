const express = require('express');
const { getAllBooks, getBookById } = require('../controllers/bookController');
const router = express.Router();

// Route to get all books
router.post('/getAllBooks', getAllBooks);

// Route to get a book by ID and page number
router.get('/getBookById/:id/:pageNo', getBookById);

module.exports = router;

