const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve all static files from the project folder
app.use(express.static(__dirname));

// ─── MongoDB Connection ───────────────────────────────────────────────────────
const MONGODB_URI =
  process.env.MONGODB_URI ||
  'mongodb+srv://ahtashamkingking5_db_user:Spiderman.71@cluster0.baj6vz0.mongodb.net/zunaishaislamicinstitute?retryWrites=true&w=majority';

let cachedDb = null;
let connectionPromise = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  if (!connectionPromise) {
    connectionPromise = mongoose
      .connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 })
      .then((db) => {
        cachedDb = db;
        console.log('✅ MongoDB connected successfully');
        return db;
      })
      .catch((err) => {
        connectionPromise = null;
        console.error('❌ MongoDB connection failed:', err.message);
        throw err;
      });
  }
  return connectionPromise;
}

// ─── Schemas & Models ─────────────────────────────────────────────────────────

// Student Registration / Contact Form
const formSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  age:         { type: String, required: true },
  phone:       { type: String, required: true },
  gender:      { type: String, required: true },
  subject:     { type: String, required: true },
  day:         { type: String, required: true },
  hours:       { type: String, required: true },
  proposedFee: { type: String, required: true },
  time:        { type: String },
  trial:       { type: String },
  location:    { type: String },
  submittedAt: { type: Date, default: Date.now }
});
const FormSubmission =
  mongoose.models.FormSubmission ||
  mongoose.model('FormSubmission', formSchema);

// Quick Contact (footer form)
const quickContactSchema = new mongoose.Schema({
  name:        { type: String, required: true },
  phone:       { type: String, required: true },
  submittedAt: { type: Date, default: Date.now }
});
const QuickContact =
  mongoose.models.QuickContact ||
  mongoose.model('QuickContact', quickContactSchema);

// Newsletter Subscriber
const newsletterSchema = new mongoose.Schema({
  email:       { type: String, required: true, unique: true, lowercase: true, trim: true },
  subscribedAt:{ type: Date, default: Date.now }
});
const Newsletter =
  mongoose.models.Newsletter ||
  mongoose.model('Newsletter', newsletterSchema);

// ─── API Routes ───────────────────────────────────────────────────────────────

// 1) Student Registration Form  POST /api/submit-form
app.post('/api/submit-form', async (req, res) => {
  try {
    await connectToDatabase();
    const { name, age, phone, gender, subject, day, hours, proposedFee } = req.body;
    if (!name || !age || !phone || !gender || !subject || !day || !hours || !proposedFee) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    const submission = new FormSubmission(req.body);
    await submission.save();
    console.log(`📝 New registration: ${name} | ${subject} | ${phone}`);
    res.status(201).json({ success: true, message: 'Registration submitted successfully! We will contact you soon.' });
  } catch (err) {
    console.error('Error saving form submission:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.', error: err.message });
  }
});

// 2) Quick Contact / Footer Form  POST /api/submit-quick-contact
app.post('/api/submit-quick-contact', async (req, res) => {
  try {
    await connectToDatabase();
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }
    const contact = new QuickContact({ name, phone });
    await contact.save();
    console.log(`📞 Quick contact: ${name} | ${phone}`);
    res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.' });
  } catch (err) {
    console.error('Error saving quick contact:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.', error: err.message });
  }
});

// 3) Newsletter Subscribe  POST /api/subscribe-newsletter
app.post('/api/subscribe-newsletter', async (req, res) => {
  try {
    await connectToDatabase();
    const { email } = req.body;
    if (!email || !email.includes('@')) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }
    // Upsert — silently succeed if already subscribed
    await Newsletter.findOneAndUpdate(
      { email: email.toLowerCase().trim() },
      { email: email.toLowerCase().trim() },
      { upsert: true, new: true }
    );
    console.log(`📧 Newsletter subscriber: ${email}`);
    res.status(201).json({ success: true, message: 'Thank you for subscribing! Jazakumullahu Khairan.' });
  } catch (err) {
    // Duplicate key error — already subscribed
    if (err.code === 11000) {
      return res.status(200).json({ success: true, message: 'You are already subscribed. Jazakumullahu Khairan!' });
    }
    console.error('Error saving newsletter subscription:', err.message);
    res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
  }
});

// 4) Get all form submissions (admin)  GET /api/admin/submissions
app.get('/api/admin/submissions', async (req, res) => {
  try {
    await connectToDatabase();
    const submissions = await FormSubmission.find().sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CMS Routes (Blog CRUD, Auth, SSR) ────────────────────────────────────────
require('./cms-routes')(app, mongoose, connectToDatabase);

// ─── Catch-all: serve index.html for unmatched non-API routes ─────────────────
app.use((req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  const htmlFile = path.join(__dirname, 'index.html');
  res.sendFile(htmlFile, (err) => {
    if (err) next();
  });
});

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📊 Admin dashboard: http://localhost:${PORT}/admin-dashboard.html`);
    console.log(`📝 Blog page:       http://localhost:${PORT}/blog.html`);
  });
}

// Export for Vercel / serverless
module.exports = app;
