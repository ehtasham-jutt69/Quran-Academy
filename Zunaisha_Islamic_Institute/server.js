const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// ─── Middleware ───────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Canonical 301 redirects: www -> apex domain and /index.html -> /
app.use((req, res, next) => {
  const host = req.headers.host || '';
  if (host.startsWith('www.')) {
    const nonWww = host.slice(4);
    const protocol = req.headers['x-forwarded-proto'] || (req.secure ? 'https' : 'https');
    return res.redirect(301, `${protocol}://${nonWww}${req.originalUrl}`);
  }
  if (req.path === '/index.html') {
    return res.redirect(301, '/');
  }
  next();
});

// ─── Static Files ────────────────────────────────────────────────────────────
// On Vercel, __dirname is /var/task/api — we need the actual project root.
// We detect this by checking if index.html exists one level up.
const projectRoot = require('fs').existsSync(path.join(__dirname, 'index.html'))
  ? __dirname
  : path.join(__dirname, '..');

// Serve root static assets and provide /public alias for compatibility
app.use(express.static(projectRoot));
app.use('/public', express.static(projectRoot));

// Prevent search indexing of the admin panel via HTTP headers
app.use('/admin-dashboard.html', (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
  next();
});

// Google Search Console verification handler
app.get('/googleab98400d8ab1173f.html', (req, res) => {
  res.setHeader('Content-Type', 'text/html; charset=UTF-8');
  res.send('google-site-verification: googleab98400d8ab1173f.html\n');
});

// Any other probing google verification file returns strict 404
app.use((req, res, next) => {
  if (req.path.startsWith('/google') && req.path.endsWith('.html')) {
    return res.status(404).send('Not Found');
  }
  next();
});

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
    const { name, age, phone, gender, subject, day, hours, proposedFee } = req.body;
    if (!name || !age || !phone || !gender || !subject || !day || !hours || !proposedFee) {
      return res.status(400).json({ success: false, message: 'Please fill in all required fields.' });
    }
    await connectToDatabase();
    const submission = new FormSubmission(req.body);
    await submission.save();
    console.log(`📝 New registration: ${name} | ${subject} | ${phone}`);
    res.status(201).json({ success: true, message: 'Registration submitted successfully! We will contact you soon.' });
  } catch (err) {
    console.warn('MongoDB submission failed, saving to offline backup:', err.message);
    try {
      const offlineDb = require('./offline-db');
      offlineDb.saveFormSubmission(req.body);
      return res.status(201).json({ success: true, message: 'Registration submitted successfully! We will contact you soon.' });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
  }
});

// 2) Quick Contact / Footer Form  POST /api/submit-quick-contact
app.post('/api/submit-quick-contact', async (req, res) => {
  try {
    const { name, phone } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ success: false, message: 'Name and phone number are required.' });
    }
    await connectToDatabase();
    const contact = new QuickContact({ name, phone });
    await contact.save();
    console.log(`📞 Quick contact: ${name} | ${phone}`);
    res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.' });
  } catch (err) {
    console.warn('MongoDB quick contact failed, saving to offline backup:', err.message);
    try {
      const offlineDb = require('./offline-db');
      offlineDb.saveQuickContact(req.body);
      return res.status(201).json({ success: true, message: 'Thank you! We will contact you shortly.' });
    } catch (fallbackErr) {
      res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
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
      { upsert: true, returnDocument: 'after' }
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

// ─── Authentication Middleware for Admin Protection ──────────────────────────
const createAuthMiddleware = require('./auth-middleware');
const requireAuth = createAuthMiddleware(mongoose, connectToDatabase);

// 4) Get all form submissions (admin protected)  GET /api/admin/submissions
app.get('/api/admin/submissions', requireAuth, async (req, res) => {
  try {
    const offlineDb = require('./offline-db');
    if (offlineDb.isOffline()) {
      return res.json({ success: true, data: offlineDb.getSubmissions() });
    }
    await connectToDatabase();
    const submissions = await FormSubmission.find().sort({ submittedAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (err) {
    try {
      const offlineDb = require('./offline-db');
      res.json({ success: true, data: offlineDb.getSubmissions() });
    } catch (e) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// 5) Delete a form submission (admin protected)  DELETE /api/admin/submissions/:id
app.delete('/api/admin/submissions/:id', requireAuth, async (req, res) => {
  try {
    const offlineDb = require('./offline-db');
    if (offlineDb.isOffline()) {
      offlineDb.deleteSubmission(req.params.id);
      return res.json({ success: true, message: 'Submission deleted successfully' });
    }
    await connectToDatabase();
    await FormSubmission.findByIdAndDelete(req.params.id);
    offlineDb.deleteSubmission(req.params.id);
    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 6) Get all quick contacts (admin protected)  GET /api/admin/quick-contacts
app.get('/api/admin/quick-contacts', requireAuth, async (req, res) => {
  try {
    const offlineDb = require('./offline-db');
    if (offlineDb.isOffline()) {
      return res.json({ success: true, data: offlineDb.getQuickContacts() });
    }
    await connectToDatabase();
    const contacts = await QuickContact.find().sort({ submittedAt: -1 });
    res.json({ success: true, data: contacts });
  } catch (err) {
    try {
      const offlineDb = require('./offline-db');
      res.json({ success: true, data: offlineDb.getQuickContacts() });
    } catch (e) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
});

// 7) Delete quick contact (admin protected)  DELETE /api/admin/quick-contacts/:id
app.delete('/api/admin/quick-contacts/:id', requireAuth, async (req, res) => {
  try {
    const offlineDb = require('./offline-db');
    if (offlineDb.isOffline()) {
      offlineDb.deleteQuickContact(req.params.id);
      return res.json({ success: true, message: 'Contact deleted successfully' });
    }
    await connectToDatabase();
    await QuickContact.findByIdAndDelete(req.params.id);
    offlineDb.deleteQuickContact(req.params.id);
    res.json({ success: true, message: 'Contact deleted successfully' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ─── CMS Routes (Blog CRUD, Auth, SSR) ────────────────────────────────────────
require('./cms-routes')(app, mongoose, connectToDatabase);

// ─── Clean URLs and Strict 404 Handler ────────────────────────────────────────
// Page mappings for clean extensionless URLs
const staticPages = [
  'contact',
  'about-us',
  'our-teachers',
  'free-trial',
  'courses',
  'online-quran-classes-for-kids',
  'noorani-qaida-online',
  'online-tajweed-course',
  'online-hifz-program',
  'female-quran-teacher-online',
  'learn-quran-for-adults',
  'online-arabic-course',
  'islamic-studies-for-kids',
  'online-quran-classes-uk',
  'online-quran-classes-usa',
  'online-quran-classes-canada',
  'online-quran-classes-australia'
];

staticPages.forEach((page) => {
  app.get(`/${page}`, (req, res, next) => {
    const file = path.join(projectRoot, `${page}.html`);
    if (require('fs').existsSync(file)) {
      return res.sendFile(file);
    }
    next();
  });
});

// Any unmatched route returns genuine 404 Not Found (eliminating soft-404s)
app.use((req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ success: false, message: 'API endpoint not found' });
  }
  const notFoundFile = path.join(projectRoot, '404.html');
  if (require('fs').existsSync(notFoundFile)) {
    return res.status(404).sendFile(notFoundFile);
  }
  res.status(404).send('<h1>404 - Page Not Found</h1><p>The page you requested could not be found.</p><a href="/">Return to Homepage</a>');
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
