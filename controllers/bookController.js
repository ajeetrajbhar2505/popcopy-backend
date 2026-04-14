require('dotenv').config();

const axios = require('axios');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const genAI = new GoogleGenerativeAI(process.env.v1);
const { cleanFanfictionText } = require('../fanfictionCleaner');

// Recursive function to fetch book content
const fetchBookContent = async (id, currentPartNo) => {
    try {
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${currentPartNo}`);
        if (response && response.data) {
            return response.data;
        } else {
            return null;
        }
    } catch (error) {
        return null;
    }
};

function formatResponse(response) {
    // Replace **text** with <b>text</b>
    let formattedResponse = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    // Replace \n with <br>
    formattedResponse = formattedResponse.replace(/\n/g, '<br>');
    // Remove single asterisks
    formattedResponse = formattedResponse.replace(/\*/g, '');
    return formattedResponse;
}

// ✅ FIXED: Updated to use current Gemini model
async function run(prompt) {
    try {
        // Use latest model - gemini-1.5-flash or gemini-1.5-pro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); // Changed from "gemini-pro"
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return response.text();
    } catch (error) {
        if (isSafetyError(error)) {
            throw new Error("SafetyError");
        } else {
            throw error;
        }
    }
}

// ✅ Alternative: If you want to try multiple models
async function runWithFallback(prompt) {
    const models = ["gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.0-flash-exp"];
    
    for (const modelName of models) {
        try {
            const model = genAI.getGenerativeModel({ model: modelName });
            const result = await model.generateContent(prompt);
            const response = await result.response;
            return response.text();
        } catch (error) {
            console.log(`Model ${modelName} failed:`, error.message);
            continue;
        }
    }
    throw new Error("All models failed");
}

const getAllBooks = async (req, res) => {
    try {
        const booksArray = req.body;
        let allBooks = "";

        for (let i = 0; i < booksArray.length; i++) {
            const book = booksArray[i];
            const { id, partNo, chapterName } = book;

            let bookContent = '';
            let currentPartNo = partNo;
            let partAvailable = true;

            // Fetch content recursively
            while (partAvailable) {
                try {
                    const content = await fetchBookContent(id, currentPartNo);
                    const cleanContent = getTextWithoutHtml(content);

                    if (cleanContent) {
                        bookContent += cleanContent;
                        currentPartNo++;
                    } else {
                        partAvailable = false;
                    }
                } catch (err) {
                    partAvailable = false;
                }
            }

            // Process with AI using updated model
            const prompt = 'Just focus on the main content. Skip all commentary and extra details from this : ';
            try {
                const response = await run(prompt + bookContent);
                
                if (response) {
                    bookContent = formatResponse(response);
                } else {
                    console.log(`No valid story content returned for Book ID: ${id}.`);
                }
            } catch (err) {
                if (err.message === "SafetyError") {
                    console.log(`Safety block for Book ID: ${id}`);
                } else {
                    console.error(`Error processing Book ID: ${id} content with AI:`, err);
                }
            }

            if (bookContent) {
                allBooks += bookContent;
            }
        }

        res.status(200).send({ books: allBooks });

    } catch (error) {
        console.error('Error in getAllBooks:', error);
        res.status(500).json({ message: error.message });
    }
};

const removeHtmlTags = (input) => {
    try {
        return input.replace(/<\/?[^>]+(>|$)/g, "");
    } catch (error) {
        return input;
    }
};

const getTextWithoutHtml = (content) => {
    return removeHtmlTags(content);
};

function isSafetyError(error) {
    return error.message.includes("safety") || error.code === "SAFETY_CONCERN";
}

const getBookById = async (req, res) => {
    const { id, pageNo } = req.params;
    try {
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${pageNo}`);

        if (response && response.data) {
            res.status(200).json({ bookId: id, pageNo, content: response.data });
        } else {
            res.status(404).json({ message: 'Book not found or page not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllBooks, getBookById };