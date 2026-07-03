const mongoose = require('mongoose');
const crypto = require('crypto');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://ahtashamkingking5_db_user:WammpfgXA02XkbkO@cluster0.bgmxzaj.mongodb.net/zunaishaislamicinstitute?appName=Cluster0";

mongoose.connect(MONGODB_URI).then(async () => {
    const adminSchema = new mongoose.Schema({ username: String, passwordHash: String, token: String });
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
    
    await Admin.deleteMany({});
    
    const hash = crypto.createHash('sha256').update('admin123').digest('hex');
    await new Admin({ username: 'admin', passwordHash: hash }).save();
    
    console.log('Admin reset successfully to admin / admin123');
    process.exit(0);
});
