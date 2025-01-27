const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bookRoutes = require('./routes/bookRoutes'); // Import the routes

const app = express();
const port = 3000;

// Enable CORS for all routes with preflight support
app.use(cors({
    origin: 'http://localhost:4200',  // Allow your frontend domain
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],  // Allow necessary methods, including OPTIONS
    allowedHeaders: ['Content-Type', 'Authorization']  // Allow the headers your frontend might use
}));

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

// Use the book routes
app.use('/', bookRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
