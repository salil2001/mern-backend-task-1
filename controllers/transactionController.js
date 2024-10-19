const Transaction = require('../models/Transaction'); // Import the Transaction model
const axios = require('axios'); // Import axios for data fetching

// Function to initialize the database by fetching data from the third-party API
const initializeDB = async (req, res) => {
    try {
        // Fetch data from the third-party API
        const { data } = await axios.get('https://s3.amazonaws.com/roxiler.com/product_transaction.json');

        // Delete any existing data in the Transaction collection
        await Transaction.deleteMany({});

        // Insert the new data into the database
        await Transaction.insertMany(data);

        res.status(200).json({ message: 'Database initialized successfully with the fetched data' });
    } catch (error) {
        console.error('Error initializing database:', error);
        res.status(500).json({ message: 'Error initializing database', error });
    }
};

// Function to get paginated and searchable transactions
const getTransactions = async (req, res) => {
    try {
        const { page = 1, perPage = 10, search = '', month } = req.query;  // Extract query parameters

        // Build a filter for the month
        const monthFilter = month ? { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } } : {};

        // Search query across title, description, and price
        const searchQuery = search ? {
            $or: [
                { title: { $regex: search, $options: 'i' } },  // Case-insensitive search
                { description: { $regex: search, $options: 'i' } },
                { price: { $regex: search, $options: 'i' } }
            ]
        } : {};

        // Combine filters
        const filter = { ...monthFilter, ...searchQuery };

        // Get paginated transactions
        const transactions = await Transaction.find(filter)
            .skip((page - 1) * perPage)
            .limit(Number(perPage));

        // Get total transaction count
        const totalTransactions = await Transaction.countDocuments(filter);

        res.status(200).json({
            transactions,
            currentPage: Number(page),
            totalPages: Math.ceil(totalTransactions / perPage),
            totalTransactions
        });
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ message: 'Error fetching transactions', error });
    }
};

// Function to get sales statistics for the selected month
const getSalesStatistics = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ message: 'Month parameter is required' });
        }

        // Filter transactions by the selected month
        const filter = { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } };

        // Total sales amount
        const totalSales = await Transaction.aggregate([
            { $match: filter },
            { $group: { _id: null, total: { $sum: "$price" } } }
        ]);

        // Number of sold items
        const soldItems = await Transaction.countDocuments({ ...filter, sold: true });

        // Number of not sold items
        const notSoldItems = await Transaction.countDocuments({ ...filter, sold: false });

        res.status(200).json({
            totalSales: totalSales[0]?.total || 0,  // Handle case where no sales exist
            soldItems,
            notSoldItems
        });
    } catch (error) {
        console.error('Error fetching sales statistics:', error);
        res.status(500).json({ message: 'Error fetching sales statistics', error });
    }
};

// Function to get price range data for the selected month
const getPriceRangeData = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ message: 'Month parameter is required' });
        }

        // Filter transactions by the selected month
        const filter = { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } };

        // Price ranges
        const priceRanges = await Transaction.aggregate([
            { $match: filter },
            {
                $bucket: {
                    groupBy: "$price",
                    boundaries: [0, 100, 200, 300, 400, 500, 600, 700, 800, 900, Infinity],
                    default: "901 and above",
                    output: { count: { $sum: 1 } }
                }
            }
        ]);

        res.status(200).json(priceRanges);
    } catch (error) {
        console.error('Error fetching price range data:', error);
        res.status(500).json({ message: 'Error fetching price range data', error });
    }
};

// Function to get category distribution for the selected month
const getCategoryData = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ message: 'Month parameter is required' });
        }

        // Filter transactions by the selected month
        const filter = { $expr: { $eq: [{ $month: "$dateOfSale" }, Number(month)] } };

        // Get categories and number of items per category
        const categories = await Transaction.aggregate([
            { $match: filter },
            { $group: { _id: "$category", count: { $sum: 1 } } }
        ]);

        res.status(200).json(categories);
    } catch (error) {
        console.error('Error fetching category data:', error);
        res.status(500).json({ message: 'Error fetching category data', error });
    }
};

// Function to get combined statistics, price range, and category data
const getCombinedData = async (req, res) => {
    try {
        const { month } = req.query;

        if (!month) {
            return res.status(400).json({ message: 'Month parameter is required' });
        }

        // Fetch statistics, price range, and category data
        const [statistics, priceRanges, categories] = await Promise.all([
            getSalesStatistics(req, res),
            getPriceRangeData(req, res),
            getCategoryData(req, res)
        ]);

        res.status(200).json({
            statistics: statistics.data,
            priceRanges: priceRanges.data,
            categories: categories.data
        });
    } catch (error) {
        console.error('Error fetching combined data:', error);
        res.status(500).json({ message: 'Error fetching combined data', error });
    }
};

module.exports = {
    initializeDB,
    getTransactions,
    getSalesStatistics,
    getPriceRangeData,
    getCategoryData,
    getCombinedData
};
