const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors'); // Optional, but useful if you're making frontend requests
const transactionRoutes = require('./routes/transactionRoutes'); // Import your transaction routes

// Initialize dotenv to read environment variables
dotenv.config();

// Initialize Express app
const app = express();

// Middleware to parse JSON bodies
app.use(express.json());

// Optional: Use CORS if your frontend and backend are running on different domains
app.use(cors());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch((error) => console.error('Error connecting to MongoDB:', error));

// Routes
app.use('/api', transactionRoutes);  // All transaction routes will be prefixed with /api

// Root Route (optional)
app.get('/', (req, res) => {
    res.send('API is running...');
});

// Error handling for non-existent routes (optional)
app.use((req, res) => {
    res.status(404).send('Route not found');
});

// Set the port from the environment or default to 5000
const PORT = process.env.PORT || 5000;

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
