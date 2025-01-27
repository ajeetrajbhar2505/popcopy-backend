
const axios = require('axios');


const getAllBooks = async (req, res) => {
    try {
        // Assuming the request body contains an array of books
        const booksArray = req.body;
        let books = ''; // constiable to accumulate the response data

        for (let i = 0; i < booksArray.length; i++) {
            const book = booksArray[i];
            const { bookId, pageNo } = book;

            try {
                const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${bookId}&page=${pageNo}`);
                if (response && response.data) {
                    books += response.data; // Concatenate book content directly without extra new lines
                } else {
                    books += `Book ID: ${bookId}, Page: ${pageNo} - Page not found`; // In case the page is not found
                }
            } catch (error) {
                books += `Book ID: ${bookId}, Page: ${pageNo} - Error fetching data`; // Error handling for each book
            }
        }

        res.status(200).json({ books }); // Return the concatenated books data
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};




const getBookById = async (req, res) => {
    const { id, pageNo } = req.params; // Destructure the bookId and pageNo from the URL params
    try {
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${pageNo}`);
        
        if (response && response.data) {
            // If the book data is found, return it
            res.status(200).json({ bookId: id, pageNo, content: response.data });
        } else {
            // If no data is found, respond with a 404
            res.status(404).json({ message: 'Book not found or page not found' });
        }
    } catch (error) {
        // If an error occurs, handle it gracefully
        res.status(500).json({ message: error.message });
    }
};




module.exports = { getAllBooks, getBookById };
