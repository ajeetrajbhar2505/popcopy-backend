const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const bookRoutes = require('./routes/bookRoutes'); // Import the routes
const path = require('path'); // Add this line

const app = express();
const port = 3000;

// Enable CORS for all routes with preflight support
app.use(cors({
    origin: '*'  // This allows requests from any origin
  }));
  
// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Middleware to parse URL-encoded bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'kdeditor')));
app.use(express.static(path.join(__dirname, 'kdeditor/assets')));

// Use the book routes
app.use('/api', bookRoutes);

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
