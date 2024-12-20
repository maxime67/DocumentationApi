const express = require('express');
const router = express.Router();
const {MongoClient, ObjectId} = require('mongodb');
require('dotenv').config();

const mongoUri = process.env.MONGOURL;
const dbName = 'doc2';

async function getMongoClient() {
    try {
        const client = new MongoClient(mongoUri, {
            connectTimeoutMS: 5000,
            serverSelectionTimeoutMS: 5000,
        });
        await client.connect();
        return client;
    } catch (error) {
        console.error('MongoDB connection error:', error);
        throw new Error(`MongoDB connection failed: ${error.message}`);
    }
}
//
// Get all categories with their subcategories
//
router.get('/categories', async (req, res) => {
    let client;
    try {
        client = await getMongoClient();
        const db = client.db(dbName);

        const categories = await db.collection('categories')
            .find()
            .toArray();

        res.json(categories);
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

// Get documents by multiple subcategories
router.get('/category', async (req, res) => {
    let client;
    try {
        client = await getMongoClient();
        const db = client.db(dbName);

        const categoriesData = await db.collection('categories').find().toArray();
        const validSubcategories = categoriesData.reduce((acc, category) => {
            return [...acc, ...category.subcategories.map(sub => sub.toLowerCase())];
        }, []);

        let subcategories = req.query.categories ? req.query.categories.split(',') : [];

        if (subcategories.length === 0) {
            subcategories = validSubcategories;
        } else {
            subcategories = subcategories.filter(cat => validSubcategories.includes(cat));

            if (subcategories.length === 0) {
                return res.status(400).json({
                    error: `Invalid categories. Must be one or more of: ${validSubcategories.join(', ')}`,
                    validSubcategories: validSubcategories
                });
            }
        }

        const documents = await db.collection('documentation')
            .find({
                category: {$in: subcategories},
                status: "published"
            })
            .toArray();

        const response = {
            totalDocuments: documents.length,
            results: documents
        };
        res.json(response);
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