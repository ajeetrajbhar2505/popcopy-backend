
const axios = require('axios');


// Recursive function to fetch book content
const fetchBookContent = async (id, currentPartNo) => {
    try {
        // Fetch content for the current part
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${currentPartNo}`);

        // If content is available, accumulate it
        if (response && response.data) {
            return response.data;
        } else {
            // No content found, return null to stop further fetching
            return null;
        }
    } catch (error) {
        // If there's an error fetching the page, return null to indicate failure
        console.error(`Error fetching Book ID: ${id}, Page: ${currentPartNo}`, error);
        return null;
    }
};

// Main function to get all books
// Main function to get all books
const getAllBooks = async (req, res) => {
    try {
        const booksArray = req.body; // Array of books
        let allBooks = ''; // Concatenate all books' content as a single string

        // Loop through each book in the array
        for (let i = 0; i < booksArray.length; i++) {
            const book = booksArray[i];
            const { id, partNo } = book;

            let bookContent = ''; // Variable to accumulate content for the current book
            let currentPartNo = partNo; // Start with the given partNo
            let partAvailable = true; // Flag to check if parts are available

            // Fetch content recursively for the current book
            while (partAvailable) {
                const content = await fetchBookContent(id, currentPartNo);

                if (content) {
                    // If content is found, accumulate it
                    bookContent += content;
                    currentPartNo++; // Move to the next part
                } else {
                    // If no content is found for this part, stop fetching this book
                    console.log(`No data found for Book ID: ${id}, Page: ${currentPartNo}. Moving to next book.`);
                    partAvailable = false; // Exit the loop for this book
                }
            }

            // If we have valid content for the book, concatenate it to the result
            if (bookContent) {
                allBooks += bookContent;
            }
        }

        // Send back the concatenated result
        res.send({ status: 200, books: allBooks });

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
