
const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI('AIzaSyCvU1YQebIBYmcoFg06nN4SC_fd2x3u8tI');


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


function formatResponse(response) {
    // Replace **text** with <b>text</b>
    let formattedResponse = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');

    // Replace \n with <br>
    formattedResponse = formattedResponse.replace(/\n/g, '<br>');
    formattedResponse = formattedResponse.replace(/\*/g, '');

    return formattedResponse;
}

async function run(prompt) {
    try {
        // For text-only input, use the gemini-pro model
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        // Add a check for safety-related error and throw it
        if (isSafetyError(error)) {
            throw new Error("SafetyError");
        } else {
            throw error;
        }
    }
}

const getAllBooks = async (req, res) => {
    try {
        const booksArray = req.body; // Array of books
        let allBooks = ""; // Variable to accumulate content for all books

        // Loop through each book in the array
        for (let i = 0; i < booksArray.length; i++) {
            const book = booksArray[i];
            const { id, partNo } = book;

            let bookContent = ''; // Variable to accumulate content for the current book
            let currentPartNo = partNo; // Start with the given partNo
            let partAvailable = true; // Flag to check if parts are available

            // Fetch content recursively for the current book
            while (partAvailable) {
                try {
                    const content = await fetchBookContent(id, currentPartNo);
                    const cleanContent = getTextWithoutHtml(content);

                    if (cleanContent) {
                        // If content is found, accumulate it
                        bookContent += cleanContent;
                        currentPartNo++; // Move to the next part
                    } else {
                        // If no content is found for this part, stop fetching this book
                        console.log(`No data found for Book ID: ${id}, Part: ${currentPartNo}. Moving to next book.`);
                        partAvailable = false; // Exit the loop for this book
                    }
                } catch (err) {
                    console.error(`Error fetching content for Book ID: ${id}, Part: ${currentPartNo}:`, err);
                    partAvailable = false; // Stop on error
                }
            }

            // After fetching all parts for the book, process the content
            const prompt = 'Just focus on the main content. Skip all commentary and extra details from this : ';
            try {
                const response = await run(prompt + bookContent);
                
                // Handle AI response (ensure it's not empty or invalid)
                if (response && response.text) {
                    bookContent = formatResponse(response);
                } else {
                    console.log(`No valid story content returned for Book ID: ${id}.`);
                }
            } catch (err) {
                console.error(`Error processing Book ID: ${id} content with AI:`, err);
            }

            // If we have valid content for the book, add it to the final result
            if (bookContent) {
                allBooks += bookContent; // Add content into the accumulated string
            }
        }

        // Send the accumulated content for all books as a response
        res.status(200).send({ books: allBooks }); // Use res.status(200) directly

    } catch (error) {
        console.error('Error in getAllBooks:', error);
        res.status(500).json({ message: error.message });
    }
};



const removeHtmlTags = (input) => {
    try {
        // First, remove all text inside <i> tags
        input = input.replace(/<i.*?>(.*?)<\/i>/g, "");
        // Then, remove all HTML tags
        return input.replace(/<\/?[^>]+(>|$)/g, "");
    } catch (error) {
        return input;
    }
};


// Function to get text without HTML tags
const getTextWithoutHtml = (content) => {
    return removeHtmlTags(content);
};

// Example function to check if the error is related to safety concerns
function isSafetyError(error) {
    // Implement your logic to check if the error is related to safety concerns
    // For example, you might check the error message or error code here
    return error.message.includes("safety") || error.code === "SAFETY_CONCERN";
}


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
