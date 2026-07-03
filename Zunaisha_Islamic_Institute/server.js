const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve frontend static files
app.use(express.static(__dirname));

// MongoDB Connection Configuration
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ahtashamkingking5_db_user:WammpfgXA02XkbkO@cluster0.bgmxzaj.mongodb.net/zunaishaislamicinstitute?appName=Cluster0";

const offlineDb = require('./offline-db');

// Handle caching the connection because Serverless Functions spin up and down
let cachedDb = null;
let connectionPromise = null;

async function connectToDatabase() {
    if (offlineDb.isOffline()) {
        return null;
    }
    if (cachedDb) {
        return cachedDb;
    }
    if (!connectionPromise) {
        connectionPromise = mongoose.connect(MONGODB_URI, {
            serverSelectionTimeoutMS: 4000 // 4 seconds timeout for fast fallback
        }).then((db) => {
            cachedDb = db;
            offlineDb.setOfflineMode(false);
            console.log('✅ Connected to MongoDB successfully');
            return db;
        }).catch((err) => {
            connectionPromise = null;
            offlineDb.setOfflineMode(true);
            console.warn('⚠️ MongoDB connection failed. Falling back to local offline JSON database.');
            return null;
        });
    }
    return connectionPromise;
}

// Define Schema & Model
const formSchema = new mongoose.Schema({
    name: { type: String, required: true },
    age: { type: String, required: true },
    phone: { type: String, required: true },
    gender: { type: String, required: true },
    subject: { type: String, required: true },
    day: { type: String, required: true },
    hours: { type: String, required: true },
    proposedFee: { type: String, required: true },
    time: { type: String, required: false },
    trial: { type: String, required: false },
    location: { type: String, required: false },
    submittedAt: { type: Date, default: Date.now }
});

const FormSubmission = mongoose.models.FormSubmission || mongoose.model('FormSubmission', formSchema);

// API Endpoint to handle form submissions
app.post('/api/submit-form', async (req, res) => {
    try {
        await connectToDatabase();
        if (offlineDb.isOffline()) {
            offlineDb.saveFormSubmission(req.body);
            return res.status(201).json({ success: true, message: 'Form submitted successfully! (Saved locally offline)' });
        }
        const newData = new FormSubmission(req.body);
        await newData.save();
        res.status(201).json({ success: true, message: 'Form submitted successfully!' });
    } catch (error) {
        console.error('Error saving form data:', error);
        res.status(500).json({ success: false, message: 'Server error, please try again.', error: error.message });
    }
});

// Quick Contact Schema & Model
const quickContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});

const QuickContact = mongoose.models.QuickContact || mongoose.model('QuickContact', quickContactSchema);

const ContactForm = mongoose.models.ContactForm || mongoose.model('ContactForm', formSchema);

const blogSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    date: { type: Date, default: Date.now }
});
const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);

// API RoutesEndpoint for quick contact form (Footer)
app.post('/api/submit-quick-contact', async (req, res) => {
    try {
        await connectToDatabase();
        if (offlineDb.isOffline()) {
            offlineDb.saveQuickContact(req.body);
            return res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly. (Saved locally offline)' });
        }
        const newData = new QuickContact(req.body);
        await newData.save();
        res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.' });
    } catch (error) {
        console.error('Error saving quick contact data:', error);
        res.status(500).json({ success: false, message: 'Server error, please try again.', error: error.message });
    }
});
// Require the comprehensive CMS routes (Auth, Blog CRUD, SSR, Sitemap)
require('./cms-routes')(app, mongoose, connectToDatabase);

// For any other request, send back the index.html so the frontend works LOCALLY
if (process.env.NODE_ENV !== 'production' && require.main === module) {
    app.use((req, res, next) => {
        if (req.url.startsWith('/api')) {
            return next();
        }
        res.sendFile(path.join(__dirname, 'index.html'));
    });
}

// Export the app for Vercel
module.exports = app;

// Start Server locally if not required as a module
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`🚀 Server is running on http://localhost:${PORT}`);
    });
}
