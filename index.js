const express = require('express');
const bodyParser = require('body-parser');
const bookRoutes = require('./routes/bookRoutes'); // Import the routes

const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Use the book routes
app.use('/api/books', bookRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
