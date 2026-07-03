const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ahtashamkingking5_db_user:WammpfgXA02XkbkO@cluster0.bgmxzaj.mongodb.net/zunaishaislamicinstitute?appName=Cluster0";
const DB_FILE = path.join(__dirname, 'offline_db.json');

// Schemas matching server.js
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

const quickContactSchema = new mongoose.Schema({
    name: { type: String, required: true },
    phone: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now }
});
const QuickContact = mongoose.models.QuickContact || mongoose.model('QuickContact', quickContactSchema);

async function migrate() {
    if (!fs.existsSync(DB_FILE)) {
        console.log("ℹ️ No local offline database file found. Nothing to migrate.");
        return;
    }

    let localData;
    try {
        const fileContent = fs.readFileSync(DB_FILE, 'utf8');
        localData = JSON.parse(fileContent);
    } catch (e) {
        console.error("❌ Error reading local offline database file:", e.message);
        return;
    }

    const submissionsCount = localData.submissions ? localData.submissions.length : 0;
    const quickContactsCount = localData.quickContacts ? localData.quickContacts.length : 0;

    if (submissionsCount === 0 && quickContactsCount === 0) {
        console.log("ℹ️ Local database contains no submissions or quick contacts. Migration skipped.");
        return;
    }

    console.log(`🚀 Connecting to MongoDB Atlas cluster...`);
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected successfully to live MongoDB cluster!");
    } catch (err) {
        console.error("❌ Failed to connect to MongoDB Atlas. Ensure your IP address is whitelisted in Atlas Network Access!");
        console.error(err.message);
        process.exit(1);
    }

    // Migrate Form Submissions
    if (submissionsCount > 0) {
        console.log(`⏳ Migrating ${submissionsCount} student registration submissions...`);
        let imported = 0;
        for (const sub of localData.submissions) {
            // Check if already exists in Atlas using a combined lookup (name + phone + submittedAt)
            const exists = await FormSubmission.findOne({
                name: sub.name,
                phone: sub.phone,
                submittedAt: sub.submittedAt
            });
            if (!exists) {
                // Remove ID field to let Mongo generate a new safe _id
                const cleanedSub = { ...sub };
                delete cleanedSub._id;
                await new FormSubmission(cleanedSub).save();
                imported++;
            }
        }
        console.log(`✅ Student registrations: Imported ${imported} new records.`);
    }

    // Migrate Quick Contacts
    if (quickContactsCount > 0) {
        console.log(`⏳ Migrating ${quickContactsCount} quick contacts...`);
        let imported = 0;
        for (const qc of localData.quickContacts) {
            const exists = await QuickContact.findOne({
                name: qc.name,
                phone: qc.phone,
                submittedAt: qc.submittedAt
            });
            if (!exists) {
                const cleanedQc = { ...qc };
                delete cleanedQc._id;
                await new QuickContact(cleanedQc).save();
                imported++;
            }
        }
        console.log(`✅ Quick contacts: Imported ${imported} new records.`);
    }

    console.log("\n🎉 Data migration process completed successfully!");
    mongoose.connection.close();
}

migrate();
