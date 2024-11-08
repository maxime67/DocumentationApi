const express = require('express');
const router = express.Router();
const {MongoClient, ObjectId} = require('mongodb');
const res = require("express/lib/response");
require('dotenv').config();

// MongoDB connection configuration
const mongoUri = process.env.MONGOURL;
console.log(process.env.MONGOURL);
if (!mongoUri) {
    console.error('MONGOURL environment variable is not set');
    process.exit(1); // Exit if the essential config is missing
}

// Validate MongoDB URI format
if (!mongoUri.startsWith('mongodb://') && !mongoUri.startsWith('mongodb+srv://')) {
    console.error('Invalid MONGOURL format. Must start with mongodb:// or mongodb+srv://');
    process.exit(1);
}
const dbName = 'documentation';


// Reusable MongoDB connection function
async function getMongoClient() {
    try {
        // Add proper options object and error handling
        const client = new MongoClient(mongoUri, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
        });

        // Connect explicitly
        await client.connect();
        console.log('Successfully connected to MongoDB');
        return client;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
}

// Get all documents
router.get('/', async (req, res) => {
    let client;
    try {
        client = await getMongoClient();
        const db = client.db(dbName);

        const documents = await db.collection('documentation')
            .find({status: "published"})
            .toArray();

        res.json(documents);
    } catch (error) {
        console.error('Error fetching all documents:', error);
        res.status(500).json({error: `Internal server error: ${error.message}`});
    } finally {
        if (client) {
            await client.close();
        }
    }
});
router.get('/allCategories', async (req, res) => {
    let client;
    try {
        client = await getMongoClient();
        const db = client.db(dbName);

        const documents = await db.collection('documentation_categories')
            .find()
            .toArray();
        res.json(documents);
    } catch (error) {
        console.error('Error fetching categories:', error);
        res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

// Get documents by multiple categories
router.get('/category', async (req, res) => {
    let client;
    try {
        // Get categories from query parameter, fallback to all valid categories if none specified
        let categories = req.query.categories ? req.query.categories.split(',') : [];

        // Define valid categories
        const validCategories = ['apache', 'nodejs', 'mongodb', 'mysql',"jenkins",'docker', 'kubernetes', 'gitLab','postgresql','redis', 'python', 'java', 'php','nginx'];

        // If no categories specified or invalid ones provided, use all valid categories
        if (categories.length === 0) {
            categories = validCategories;
        } else {
            // Filter out any invalid categories
            categories = categories.filter(cat => validCategories.includes(cat));

            // If all provided categories were invalid, return error
            if (categories.length === 0) {
                return res.status(400).json({
                    error: `Invalid categories. Must be one or more of: ${validCategories.join(', ')}`,
                    validCategories: validCategories
                });
            }
        }

        client = await getMongoClient();
        const db = client.db(dbName);

        // Create an object to store results for each category
        const results = {};

        // Initialize results object with empty arrays for all requested categories
        categories.forEach(category => {
            results[category] = [];
        });

        // Fetch documents for all requested categories in a single query
        const documents = await db.collection('documentation')
            .find({
                category: {$in: categories},
                status: "published"
            })
            .toArray();
        const response = {
            totalDocuments: documents.length,
            results: documents
        };
        res.json(response)
    } catch (error) {
        console.error('Error fetching documents by categories:', error);
        res.status(500).json({
            error: `Internal server error: ${error.message}`
        });
    } finally {
        if (client) {
            await client.close();
        }
    }
});

module.exports = router;