require('dotenv').config();

const axios = require('axios');

// Recursive function to fetch book content
const fetchBookContent = async (id, currentPartNo) => {
    try {
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${currentPartNo}`);
        return response?.data || null;
    } catch (error) {
        return null;
    }
};

function formatResponse(response) {
    let formattedResponse = response.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
    formattedResponse = formattedResponse.replace(/\n/g, '<br>');
    formattedResponse = formattedResponse.replace(/\*/g, '');
    return postClean(formattedResponse);
}

function postClean(text) {
  return text
    .replace(/thanks for reading.*$/gim, '')
    .replace(/song used.*$/gim, '')
    .replace(/short story.*$/gim, '')
    .trim();
}

async function run(prompt) {
    try {
        const res = await fetch("http://localhost:11434/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "phi3:mini", // 🔥 faster than llama3
                prompt: prompt,
                stream: false
            })
        });

        const data = await res.json();
        return data.response;
    } catch (error) {
        console.error("LLaMA error:", error.message);
        return null;
    }
}
const getAllBooks = async (req, res) => {
    try {
        const booksArray = req.body;
        let allBooks = "";

        for (let i = 0; i < booksArray.length; i++) {
            const book = booksArray[i];
            const { id, partNo } = book;

            let bookContent = '';
            let currentPartNo = partNo;
            let partAvailable = true;

            // Fetch content
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
                } catch {
                    partAvailable = false;
                }
            }

            // ✅ Process with LLaMA (FREE)
            const prompt = `
Clean the text and keep ONLY story content.

Remove:
- author notes, credits, names
- titles like "short story", "thanks for reading"
- song/music mentions
- social lines (follow, like, share)
- headings, intros, outros, disclaimers
- symbols, emojis, separators

Keep only narration and dialogues.

Return only clean story text.

TEXT:
${bookContent}
`;
            const response = await run(prompt);

            if (response) {
                bookContent = formatResponse(response);
            } else {
                console.log(`No valid response for Book ID: ${id}`);
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
    } catch {
        return input;
    }
};

const getTextWithoutHtml = (content) => {
    return removeHtmlTags(content);
};

const getBookById = async (req, res) => {
    const { id, pageNo } = req.params;
    try {
        const response = await axios.get(`https://www.wattpad.com/apiv2/?m=storytext&id=${id}&page=${pageNo}`);

        if (response?.data) {
            res.status(200).json({ bookId: id, pageNo, content: response.data });
        } else {
            res.status(404).json({ message: 'Book not found or page not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = { getAllBooks, getBookById };