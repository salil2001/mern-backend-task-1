const express = require('express');
const router = express.Router();

// Import controller functions
const {
    initializeDB,
    getTransactions,
    getSalesStatistics,
    getPriceRangeData,
    getCategoryData,
    getCombinedData
} = require('../controllers/transactionController');

// Initialize the database (seed data from third-party API)
router.get('/initialize', initializeDB);

// Get paginated and searchable transactions
router.get('/transactions', getTransactions);

// Get sales statistics for the selected month
router.get('/statistics', getSalesStatistics);

// Get price range data for the selected month
router.get('/price-range', getPriceRangeData);

// Get category data for the selected month
router.get('/categories', getCategoryData);

// Get combined data (statistics, price range, and categories) for the selected month
router.get('/combined', getCombinedData);

module.exports = router;
