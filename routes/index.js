const express = require('express');
const router = express.Router();
const { MongoClient, ObjectId } = require('mongodb');
require('dotenv').config();

// MongoDB connection configuration
const mongoUri = process.env.MONGOURL;
const dbName = 'documentation';


// Reusable MongoDB connection function
async function getMongoClient() {
  try {
    // Add proper options object and error handling
    const client = new MongoClient(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
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

    const documents = await db.collection('object')
        .find({})
        .toArray();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching all documents:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get documents by status (published/draft/etc)
router.get('/status/:status', async (req, res) => {
  let client;
  try {
    const { status } = req.params;

    // Validate status
    const validStatuses = ['draft', 'published', 'archived', 'deprecated'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be one of: draft, published, archived, deprecated' });
    }

    client = await getMongoClient();
    const db = client.db(dbName);

    const documents = await db.collection('object')
        .find({ status: status })
        .sort({ updatedAt: -1 })
        .toArray();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents by status:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get documents by category
router.get('/category/:category',async (req, res) => {
  let client;
  try {
    const { category } = req.params;

    // Validate category
    const validCategories = ['apache', 'nodejs', 'mongodb', 'mysql'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: 'Invalid category. Must be one of: API, Tutorial, Guide, Reference, Other' });
    }

    client = await getMongoClient();
    const db = client.db(dbName);

    const documents = await db.collection('object')
        .find({ category: category, status: "published" })
        .toArray();

    res.json(documents);
  } catch (error) {
    console.error('Error fetching documents by category:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

// Get document by ID
router.get('/:id',  async (req, res) => {
  let client;
  try {
    const { id } = req.params;

    // Validate ObjectId format
    if (!ObjectId.isValid(id)) {
      return res.status(400).json({ error: 'Invalid document ID format' });
    }

    client = await getMongoClient();
    const db = client.db(dbName);

    const document = await db.collection('object')
        .findOne({ _id: new ObjectId(id) });

    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }

    res.json(document);
  } catch (error) {
    console.error('Error fetching document by ID:', error);
    res.status(500).json({ error: `Internal server error: ${error.message}` });
  } finally {
    if (client) {
      await client.close();
    }
  }
});

module.exports = router;