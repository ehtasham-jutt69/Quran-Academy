const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const offlineDb = require('./offline-db');

module.exports = function(app, mongoose, connectToDatabase) {

    // --- Extended Blog Schema ---
    const blogSchema = new mongoose.Schema({
        title: { type: String, required: true },
        seoTitle: { type: String },
        description: { type: String, required: true },
        keywords: { type: String }, // Comma-separated keywords
        slug: { type: String, required: true, unique: true },
        content: { type: String, required: true },
        author: { type: String, default: 'Admin' },
        category: { type: String, default: 'General' },
        tags: [{ type: String }],
        imageUrl: { type: String },
        readingTime: { type: String },
        date: { type: Date, default: Date.now },
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        status: { type: String, enum: ['published', 'draft', 'scheduled'], default: 'published' },
        scheduledDate: { type: Date },
        comments: [{
            name: { type: String, required: true },
            email: { type: String },
            comment: { type: String, required: true },
            date: { type: Date, default: Date.now }
        }]
    });
    
    // Admin Auth Schema
    const adminSchema = new mongoose.Schema({
        username: { type: String, required: true, unique: true },
        passwordHash: { type: String, required: true },
        token: { type: String }
    });

    const Blog = mongoose.models.Blog || mongoose.model('Blog', blogSchema);
    const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);

    // --- HTML Sanitization for XSS protection ---
    const escapeHtml = (text) => {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };

    // --- Dynamic Scheduler Execution ---
    // In serverless, cron jobs aren't active, so we trigger scheduler checks
    // on incoming public blog requests dynamically and seamlessly.
    const checkScheduledBlogs = async () => {
        try {
            await connectToDatabase();
            const now = new Date();
            const result = await Blog.updateMany(
                { status: 'scheduled', scheduledDate: { $lte: now } },
                { $set: { status: 'published', date: now } }
            );
            if (result.modifiedCount > 0) {
                console.log(`[Scheduler] Automatically published ${result.modifiedCount} scheduled blogs.`);
            }
        } catch (e) {
            console.error('[Scheduler] Error publishing scheduled blogs:', e);
        }
    };

    // --- Automatic Seeding of 5 High-Quality SEO Blogs ---
    const seedBlogs = async () => {
        try {
            await connectToDatabase();
            if (offlineDb.isOffline()) {
                console.log('🌱 Database is offline. Seeded blogs preloaded in offline-db.');
                return;
            }
            const count = await Blog.countDocuments();
        if (count === 0) {
            console.log('🌱 Database is empty. Seeding 5 highly SEO-optimized Islamic blogs...');
            
            const blogsToSeed = [
                {
                    title: "10 Life-Changing Benefits of Learning Quran Online",
                    seoTitle: "10 Life-Changing Benefits of Learning Quran Online | Zunaisha",
                    description: "Explore the ultimate guide to learning the Quran online. Understand how professional online classes with Tajweed offer safe, convenient, and highly effective tutoring for children and adults globally.",
                    keywords: "learn quran online, online quran classes, online quran tutoring, tajweed learning online, hifz quran classes, learn quran for kids, zunaisha islamic institute",
                    slug: "benefits-of-learning-quran-online",
                    category: "Online Quran Classes",
                    tags: ["Quran Classes", "Online Learning", "Tajweed Benefits"],
                    imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
                    author: "Ustadha Zunaisha",
                    date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
                    views: 284,
                    likes: 42,
                    status: "published",
                    readingTime: "5 min read",
                    content: `
                        <p class="lead">In our fast-paced modern world, technology has opened up incredible opportunities for spiritual enrichment. For millions of Muslims across the globe, learning the Holy Quran has become more accessible, flexible, and interactive than ever before through online learning platforms.</p>
                        
                        <p>At <strong>Zunaisha Islamic Institute</strong>, we bridge the gap between traditional Islamic scholarship and modern digital education, offering premium one-on-one sessions that adapt perfectly to your schedule. Below, we discuss the ten major life-changing benefits of learning the Quran online.</p>
                        
                        <h2>1. Safety and Comfort of Learning From Home</h2>
                        <p>One of the greatest benefits is the safety and security of home-based study. Parents can easily supervise their children's lessons without having to commute to physical academies, saving time and ensuring peace of mind.</p>
                        
                        <div class="quran-verse-card">
                            <p class="arabic-text">وَنُنَزِّلُ مِنَ الْقُرْآنِ مَا هُوَ شِفَاءٌ وَرَحْمَةٌ لِّلْمُؤْمِنِينَ</p>
                            <p class="translation">"And We send down of the Quran that which is a healing and a mercy to the believers." (Surah Al-Isra, 17:82)</p>
                        </div>

                        <h2>2. Hand-Picked Certified Male and Female Tutors</h2>
                        <p>Online platforms remove geographical limitations. You are no longer limited to local resources. We recruit highly qualified, certified, and fluent multilingual teachers (including graduates from elite universities like Al-Azhar) who specialize in Tajweed and Hifz pedagogy.</p>
                        
                        <h2>3. High-Quality Personalized One-on-One Attention</h2>
                        <p>Unlike crowded traditional madrasas, online classes are typically taught one-on-one. This ensures that the teacher can focus entirely on the student's pronunciation (Makhraj), pacing, and corrections, leading to significantly faster and more accurate learning.</p>

                        <h2>4. Flexible Scheduling and Timings</h2>
                        <p>With 24/7 availability, online Quran learning lets you customize your classes around school, work, or family commitments. Whether you prefer early morning recitations or late night lessons, there is a slot for everyone.</p>

                        <h2>5. Structured Interactive Curriculum</h2>
                        <p>Modern classes utilize interactive digital whiteboards, Quranic software, slides, and educational games. This structured layout keeps young students engaged and motivated to learn the alphabets, rules of Tajweed, and memorization of Surahs.</p>

                        <div class="alert alert-info py-3 border-0 rounded-3 my-4">
                            <h5 class="fw-bold text-primary mb-2"><i class="fa-solid fa-graduation-cap me-2"></i>Start Your Free Trial!</h5>
                            <p class="mb-0 text-dark">Ready to experience these benefits yourself? Zunaisha Islamic Institute offers <strong>3 Free Trial Classes</strong> with zero obligation. <a href="https://wa.me/+923089646732" target="_blank" class="fw-bold text-decoration-underline text-primary">Chat with us on WhatsApp to register!</a></p>
                        </div>
                    `
                },
                {
                    title: "How to Improve Tajweed: A Step-by-Step Guide to Beautiful Recitation",
                    seoTitle: "How to Improve Tajweed and Recite Quran Beautifully | Zunaisha",
                    description: "Learn how to master Tajweed rules, correct your pronunciation (Makharij), and recite the Holy Quran with proper accent and deep spiritual impact.",
                    keywords: "how to improve tajweed, learn tajweed rules, correct makharij, beautiful quran recitation, tajweed classes, zunaisha islamic institute",
                    slug: "how-to-improve-tajweed",
                    category: "Tajweed",
                    tags: ["Tajweed Rules", "Quran Recitation", "Makharij Guide"],
                    imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=800",
                    author: "Qari Muhammad Ehtasham",
                    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
                    views: 412,
                    likes: 58,
                    status: "published",
                    readingTime: "6 min read",
                    content: `
                        <p class="lead">Reciting the Holy Quran beautifully is not just an art; it is a duty and a form of worship. The word 'Tajweed' means to beautify, refine, or master. In the context of Quranic study, it refers to the set of rules governing how the words of the Quran should be pronounced.</p>
                        
                        <p>Allah commands us in the Quran to recite it with slow, measured tones. Achieving this beautiful tone requires systematic effort. Here is our expert guide on how to improve your Tajweed step-by-step.</p>

                        <div class="quran-verse-card">
                            <p class="arabic-text">وَرَتِّلِ الْقُرْآنَ تَرْتِيلًا</p>
                            <p class="translation">"...And recite the Quran with measured recitation." (Surah Al-Muzzammil, 73:4)</p>
                        </div>

                        <h2>Step 1: Master the Correct Makharij (Articulation Points)</h2>
                        <p>Every Arabic letter originates from a specific part of the mouth, throat, or lips. If you alter the articulation point, you change the letter's sound, which can inadvertently change the entire meaning of a Quranic word. Spend time practicing the differences between throat letters like <strong>ح (Ha)</strong> and <strong>ه (ha)</strong>, or <strong>ع (Ayn)</strong> and <strong>أ (Hamza)</strong>.</p>
                        
                        <h2>Step 2: Understand the Noon and Meem Sakinah Rules</h2>
                        <p>These are the core building blocks of Tajweed. Memorize and apply the rules of:
                            <ul>
                                <li><strong>Izhar</strong> (clarity)</li>
                                <li><strong>Idgham</strong> (merging/nasalizing)</li>
                                <li><strong>Iqlab</strong> (changing sound to 'Meem')</li>
                                <li><strong>Ikhfa</strong> (hiding/soft nasal sound)</li>
                            </ul>
                        </p>

                        <h2>Step 3: Listen Attentively to Expert Qaris</h2>
                        <p>Imitation is a powerful learning tool. Listen to legendary Qaris known for their slow and precise Tajweed, such as Sheikh Mahmoud Khalil Al-Husary or Sheikh Minshawi. Try to mimic their pauses, nasalization duration (Ghunnah), and vowel stretches (Madd).</p>

                        <h2>Step 4: Record Yourself Reciting</h2>
                        <p>Often, we cannot hear our own mistakes while reciting. Record your voice reading a short passage and play it back while listening closely. Compare your recording to an expert recitation of the same verse to identify discrepancies.</p>

                        <h2>Step 5: Get Professional One-on-One Mentorship</h2>
                        <p>Self-study has limits because the Quran is an oral tradition passed down from teacher to student. Having a certified Qari or Hafiz point out subtle flaws in your recitation is indispensable. At <strong>Zunaisha Islamic Institute</strong>, we specialize in personalized Tajweed corrections for students of all ages.</p>
                    `
                },
                {
                    title: "What is the Best Age for Kids to Memorize the Quran (Hifz)?",
                    seoTitle: "Best Age for Hifz Quran | When Should Children Start Memorization? | Zunaisha",
                    description: "Learn about the optimal age for children to start Hifzul Quran, cognitive development, memorization methods, and tips for parents supporting Hifz.",
                    keywords: "best age for hifz, when to start memorizing quran, child quran memorization, hifz tips for kids, online hifz, zunaisha islamic institute",
                    slug: "best-age-for-hifz",
                    category: "Hifz Tips",
                    tags: ["Hifz Tips", "Parenting", "Islamic Hifz"],
                    imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800",
                    author: "Hafiz Muhammad",
                    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
                    views: 319,
                    likes: 49,
                    status: "published",
                    readingTime: "4 min read",
                    content: `
                        <p class="lead">Memorizing the entire Quran is one of the most noble achievements a young Muslim can attain, carrying profound blessings for both the child and their parents. But as a parent, a common question arises: <em>When is the best age to enroll my child in a Hifz program?</em></p>
                        
                        <p>While every child develops uniquely, cognitive research and historical practices indicate a clear window where child memorization is exceptionally fertile. Let us look at what makes this period ideal and how to prepare your children.</p>

                        <h2>The Golden Age: 5 to 12 Years Old</h2>
                        <p>Most scholars and educators agree that the golden age for Quran memorization is between **5 and 12 years**. Here is why:</p>
                        <ul>
                            <li><strong>Superb Cognitive Flexibility:</strong> Children's brains are like sponges. They possess a high capacity for acoustic retention, allowing them to memorize sounds rapidly without needing to understand complex grammar rules first.</li>
                            <li><strong>Fewer Distractions:</strong> During this period, children are relatively free from the intense academic stress, career pressure, and social concerns that accumulate in teenage and adult years.</li>
                            <li><strong>Pure Minds:</strong> A child's mind is clear and receptive, making it easier for spiritual concepts and words of the divine to make a deep, lifelong imprint.</li>
                        </ul>

                        <div class="quran-verse-card">
                            <p class="arabic-text">وَلَقَدْ يَسَّرْنَا الْقُرْآنَ لِلذِّكْرِ فَهَلْ مِن مُّدَّكِرٍ</p>
                            <p class="translation">"And We have certainly made the Quran easy for remembrance, so is there any who will remember?" (Surah Al-Qamar, 54:17)</p>
                        </div>

                        <h2>How to Prepare Your Child Before Hifz</h2>
                        <p>Do not rush a 5-year-old straight into rigorous memorization. Lay down a solid foundation first:
                            <ol>
                                <li><strong>Ensure Flawless Reading (Nazra):</strong> A student must be able to read Arabic fluently from the page with proper Tajweed before starting memorization. Correcting errors in a memorized verse is incredibly difficult.</li>
                                <li><strong>Build a Habit of Listening:</strong> Play the Quran regularly at home, especially Surahs they are preparing to memorize. Familiarity with the sounds simplifies Hifz immensely.</li>
                                <li><strong>Positive Reinforcement:</strong> Never force or shame a child. Instead, use reward charts, words of encouragement, and celebrate small milestones like memorizing a Juz or a long Surah.</li>
                            </ol>
                        </p>
                    `
                },
                {
                    title: "The Importance of Islamic Education in a Modern World",
                    seoTitle: "Importance of Islamic Education in Modern Era | Zunaisha Islamic",
                    description: "Explore the vital role of Islamic studies, moral character development (Akhlaq), and identity preservation for Muslim youths growing up today.",
                    keywords: "importance of islamic education, islamic studies for kids, moral character akhlaq, modern islamic education, zunaisha islamic institute",
                    slug: "importance-of-islamic-education",
                    category: "Islamic Education",
                    tags: ["Islamic Studies", "Modern World", "Akhlaq Development"],
                    imageUrl: "https://images.unsplash.com/photo-1506784983877-45594efa4cbe?auto=format&fit=crop&q=80&w=800",
                    author: "Mawlana Abdul Haq",
                    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
                    views: 196,
                    likes: 31,
                    status: "published",
                    readingTime: "5 min read",
                    content: `
                        <p class="lead">In an era dominated by social media, globalized secular views, and constant ideological shifts, raising children with a strong moral compass is one of the greatest challenges facing Muslim families today. Secular schooling provides academic tools, but it does not nourish the soul.</p>
                        
                        <p>This is where comprehensive <strong>Islamic Education</strong> becomes vital. It is not just about learning how to pray or recite; it is about building a robust identity, deep-rooted beliefs (Aqeedah), and exemplary character (Akhlaq).</p>

                        <h2>1. Preserving Islamic Identity</h2>
                        <p>When children understand the core beliefs and foundations of Islam, they develop a resilient identity. This knowledge shields them from doubt and peer pressure, helping them navigate complex modern questions with confidence and intellectual maturity.</p>

                        <div class="quran-verse-card">
                            <p class="arabic-text">يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا مِنكُمْ وَالَّذِينَ أُوتُوا الْعِلْمَ دَرَجَاتٍ</p>
                            <p class="translation">"...Allah will raise those who have believed among you and those who were given knowledge, by degrees." (Surah Al-Mujadila, 58:11)</p>
                        </div>

                        <h2>2. Developing High Moral Character (Akhlaq)</h2>
                        <p>Knowledge without character is empty. Islamic studies emphasize respect for parents, honesty in dealings, kindness to all creatures, and service to society. By learning the biography (Seerah) of the Prophet Muhammad (peace be upon him), youth gain a perfect role model for empathy, leadership, and integrity.</p>

                        <h2>3. The Spiritual Purpose of Academic Success</h2>
                        <p>Islam does not separate secular and religious knowledge. A strong Islamic foundation teaches students that pursuit of medicine, engineering, technology, or humanities is a form of worship when used to serve humanity and honor the Creator. This infuses their secular studies with transcendent purpose and higher drive.</p>
                    `
                },
                {
                    title: "Quran Learning for Kids: Making Quran Fun and Engaging",
                    seoTitle: "Quran Learning for Kids | Make Quran Memorization Fun | Zunaisha",
                    description: "Learn how to keep your kids motivated and excited about online Quran classes and Tajweed learning with positive reinforcement and interactive lessons.",
                    keywords: "quran learning for kids, learn quran fun, child quran classes, online tajweed for kids, parent guide quran, zunaisha islamic institute",
                    slug: "quran-learning-for-kids",
                    category: "Kids Islamic Learning",
                    tags: ["Kids Education", "Interactive Learning", "Quran for Kids"],
                    imageUrl: "https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?auto=format&fit=crop&q=80&w=800",
                    date: new Date(Date.now() - 12 * 60 * 60 * 1000), // 12 hours ago
                    author: "Ustadha Ayesha",
                    views: 228,
                    likes: 38,
                    status: "published",
                    readingTime: "5 min read",
                    content: `
                        <p class="lead">Teaching children the Quran requires a blend of patience, empathy, and creative teaching methods. If lessons feel dry or overly demanding, young children can quickly lose focus, experience burnout, or associate Quran study with frustration. Our role as parents and teachers is to foster a lifelong love for the word of Allah.</p>
                        
                        <p>At <strong>Zunaisha Islamic Institute</strong>, we specialize in kids' education by utilizing modern pedagogical techniques. Here are the top ways to make online Quran learning fun and deeply engaging for your kids.</p>

                        <h2>1. Utilize Interactive Digital Whiteboards and Games</h2>
                        <p>Traditional learning often relies on passive repetition. Online classes change this by incorporating colorful digital tools, virtual flashcards, and Tajweed games. Children can drag-and-drop letters, match rules, and compete in interactive quizzes, which keeps their brains actively engaged and excited.</p>

                        <div class="quran-verse-card">
                            <p class="arabic-text">خَيْرُكُمْ مَنْ تَعَلَّمَ الْقُرْآنَ وَعَلَّمَهُ</p>
                            <p class="translation">"The best of you are those who learn the Quran and teach it." (Sahih Al-Bukhari)</p>
                        </div>

                        <h2>2. Break Lessons into Bite-Sized Goals</h2>
                        <p>Avoid marathon recitation hours. A child's attention span typically ranges from 15 to 30 minutes. Structuring a 30-minute class with a 15-minute core recitation, a 5-minute explanation of a story behind a Surah, and a 10-minute Tajweed game ensures maximum retention and enjoyment.</p>

                        <h2>3. Connect Verses with Stories</h2>
                        <p>Children love narratives. Instead of reciting Surah Al-Fil (The Elephant) repeatedly without context, tell them the thrilling story of Abrahah, the birds with clay pebbles, and how Allah protected the Kaaba. This storytelling makes the recitation meaningful and memorable.</p>

                        <h2>4. Create a Dedicated Home Study Sanctuary</h2>
                        <p>Set up a bright, quiet, and comfortable study space just for their Quran lessons. Equip it with a good headset, a high-quality camera, and beautiful Islamic wall stickers. Let them choose their own notebook and prayer mat, giving them a sense of ownership and pride in their spiritual journey.</p>
                    `
                }
            ];

            await Blog.insertMany(blogsToSeed);
            console.log('✅ Successfully seeded 5 premium SEO-optimized Islamic blogs.');
        }
        } catch (e) {
            console.warn('⚠️ Seeding check failed (database offline or connection blocked):', e.message);
        }
    };
    seedBlogs();

    // --- Authentication Middleware ---
    const requireAuth = async (req, res, next) => {
        try {
            const token = req.headers.authorization;
            if(!token) return res.status(401).json({ success: false, message: 'Unauthorized' });
            
            const rawToken = token.replace('Bearer ', '');
            if (offlineDb.isOffline()) {
                if (offlineDb.checkAdminToken(rawToken)) {
                    req.isAdmin = true;
                    return next();
                }
                return res.status(401).json({ success: false, message: 'Invalid token' });
            }

            await connectToDatabase();
            const admin = await Admin.findOne({ token: rawToken });
            if(!admin) return res.status(401).json({ success: false, message: 'Invalid token' });
            
            next();
        } catch(e) {
            console.error('requireAuth Error:', e);
            res.status(500).json({ success: false, message: 'Internal Server Error authenticating request.' });
        }
    };

    // --- Initial Setup Default Admin ---
    const setupAdmin = async () => {
        try {
            if (offlineDb.isOffline()) {
                console.log('✅ Default Admin configured offline. Username: admin, Password: admin123');
                return;
            }
            await connectToDatabase();
            if (offlineDb.isOffline()) {
                console.log('✅ Default Admin configured offline. Username: admin, Password: admin123');
                return;
            }
            const existing = await Admin.findOne({ username: 'admin' });
            if(!existing) {
                const hash = crypto.createHash('sha256').update('admin123').digest('hex');
                await new Admin({ username: 'admin', passwordHash: hash }).save();
                console.log('✅ Default Admin created. Username: admin, Password: admin123');
            }
        } catch (e) {
            console.warn('⚠️ Could not connect to database on startup. Running in offline/cached mode:', e.message);
        }
    };
    setupAdmin();

    // --- Auth Routes ---
    app.post('/api/admin/login', async (req, res) => {
        try {
            const { username, password } = req.body;
            if (offlineDb.isOffline()) {
                const token = offlineDb.loginAdmin(username, password);
                if (token) {
                    return res.json({ success: true, token });
                } else {
                    return res.status(401).json({ success: false, message: 'Invalid credentials' });
                }
            }

            await connectToDatabase();
            const hash = crypto.createHash('sha256').update(password).digest('hex');
            
            const admin = await Admin.findOne({ username, passwordHash: hash });
            if(admin) {
                const token = crypto.randomBytes(32).toString('hex');
                admin.token = token;
                await admin.save();
                res.json({ success: true, token });
            } else {
                res.status(401).json({ success: false, message: 'Invalid credentials' });
            }
        } catch (e) {
            console.error('Login Route Error:', e);
            res.status(500).json({ success: false, message: 'Database Connection Error. Please try again.' });
        }
    });

    app.post('/api/admin/logout', requireAuth, async (req, res) => {
        try {
            const token = req.headers.authorization.replace('Bearer ', '');
            if (offlineDb.isOffline()) {
                offlineDb.logoutAdmin(token);
                return res.json({ success: true });
            }
            await Admin.updateOne({ token }, { $set: { token: null } });
            res.json({ success: true });
        } catch(e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // --- CRUD Routes ---
    // Create
    app.post('/api/blogs/extended', requireAuth, async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                offlineDb.createBlog(req.body);
                return res.json({ success: true, message: 'Blog published successfully' });
            }
            await connectToDatabase();
            const blog = new Blog(req.body);
            
            // Calculate reading time
            const words = blog.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
            blog.readingTime = Math.ceil(words / 200) + ' min read';

            await blog.save();
            res.json({ success: true, message: 'Blog published successfully' });
        } catch(e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // Update
    app.put('/api/blogs/extended/:id', requireAuth, async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                offlineDb.updateBlog(req.params.id, req.body);
                return res.json({ success: true, message: 'Blog updated successfully' });
            }
            await connectToDatabase();
            const data = req.body;
            
            // Calculate reading time
            if (data.content) {
                const words = data.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
                data.readingTime = Math.ceil(words / 200) + ' min read';
            }

            await Blog.findByIdAndUpdate(req.params.id, data);
            res.json({ success: true, message: 'Blog updated successfully' });
        } catch(e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // Delete
    app.delete('/api/blogs/extended/:id', requireAuth, async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                offlineDb.deleteBlog(req.params.id);
                return res.json({ success: true, message: 'Blog deleted' });
            }
            await connectToDatabase();
            await Blog.findByIdAndDelete(req.params.id);
            res.json({ success: true, message: 'Blog deleted' });
        } catch(e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // Get All (Public / Admin filtered)
    app.get('/api/blogs/extended', async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                const token = req.headers.authorization;
                let isAdmin = false;
                if (token) {
                    isAdmin = offlineDb.checkAdminToken(token.replace('Bearer ', ''));
                }
                const blogs = offlineDb.getBlogs({
                    category: req.query.category,
                    search: req.query.search,
                    tag: req.query.tag,
                    status: req.query.status,
                    popular: req.query.popular,
                    isAdmin
                });
                const pageVal = parseInt(req.query.page || 1);
                const limitVal = parseInt(req.query.limit || 9);
                const start = (pageVal - 1) * limitVal;
                const paginated = blogs.slice(start, start + limitVal);
                return res.json({ blogs: paginated, total: blogs.length, page: pageVal, pages: Math.ceil(blogs.length / limitVal) });
            }

            await checkScheduledBlogs(); // Trigger dynamic scheduler check
            
            await connectToDatabase();
            const { category, search, tag, limit = 9, page = 1, status, popular } = req.query;
            let query = {};
            
            // Public filtering (only show published unless authenticated admin)
            const token = req.headers.authorization;
            let isAdmin = false;
            if (token) {
                const admin = await Admin.findOne({ token: token.replace('Bearer ', '') });
                if (admin) isAdmin = true;
            }

            if (!isAdmin) {
                query.status = 'published';
            } else if (status) {
                query.status = status;
            }

            if(category) query.category = category;
            if(tag) query.tags = tag;
            if(search) {
                query.$or = [
                    { title: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                    { keywords: { $regex: search, $options: 'i' } }
                ];
            }

            let queryExec = Blog.find(query);
            
            if (popular === 'true') {
                queryExec = queryExec.sort({ views: -1 });
            } else {
                queryExec = queryExec.sort({ date: -1 });
            }

            const blogs = await queryExec
                .limit(parseInt(limit))
                .skip((parseInt(page) - 1) * parseInt(limit));
            
            const total = await Blog.countDocuments(query);
            res.json({ blogs, total, page: parseInt(page), pages: Math.ceil(total / limit) });
        } catch(e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // --- Interactive Comments / Likes API Endpoints ---
    // Submit comment
    app.post('/api/blogs/:slug/comments', async (req, res) => {
        try {
            const { name, email, comment } = req.body;
            if (!name || !comment) {
                return res.status(400).json({ success: false, message: 'Name and comment are required.' });
            }

            if (offlineDb.isOffline()) {
                const comments = offlineDb.addComment(req.params.slug, req.body);
                if (!comments) return res.status(404).json({ success: false, message: 'Blog not found' });
                return res.json({ success: true, message: 'Comment submitted successfully!', comments });
            }

            await connectToDatabase();
            const blog = await Blog.findOne({ slug: req.params.slug });
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

            blog.comments.push({ name, email: email || '', comment, date: new Date() });
            await blog.save();

            res.json({ success: true, message: 'Comment submitted successfully!', comments: blog.comments });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // Submit Like
    app.post('/api/blogs/:slug/like', async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                const likes = offlineDb.addLike(req.params.slug);
                if (!likes) return res.status(404).json({ success: false, message: 'Blog not found' });
                return res.json({ success: true, likes });
            }
            await connectToDatabase();
            const blog = await Blog.findOne({ slug: req.params.slug });
            if (!blog) return res.status(404).json({ success: false, message: 'Blog not found' });

            blog.likes = (blog.likes || 0) + 1;
            await blog.save();

            res.json({ success: true, likes: blog.likes });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // Admin Dashboard Analytics endpoint
    app.get('/api/admin/analytics', requireAuth, async (req, res) => {
        try {
            if (offlineDb.isOffline()) {
                const stats = offlineDb.getAnalytics();
                const drafts = offlineDb.getBlogs({ isAdmin: true, status: 'draft' }).length;
                const scheduled = offlineDb.getBlogs({ isAdmin: true, status: 'scheduled' }).length;
                return res.json({
                    ...stats,
                    drafts,
                    scheduled
                });
            }

            await connectToDatabase();
            const totalArticles = await Blog.countDocuments();
            
            const viewsAgg = await Blog.aggregate([
                { $group: { _id: null, totalViews: { $sum: '$views' }, totalLikes: { $sum: '$likes' } } }
            ]);
            
            const commentsCount = await Blog.aggregate([
                { $project: { commentsCount: { $size: '$comments' } } },
                { $group: { _id: null, count: { $sum: '$commentsCount' } } }
            ]);

            const drafts = await Blog.countDocuments({ status: 'draft' });
            const scheduled = await Blog.countDocuments({ status: 'scheduled' });

            res.json({
                totalArticles,
                totalViews: viewsAgg[0] ? viewsAgg[0].totalViews : 0,
                totalLikes: viewsAgg[0] ? viewsAgg[0].totalLikes : 0,
                totalComments: commentsCount[0] ? commentsCount[0].count : 0,
                drafts,
                scheduled
            });
        } catch (e) {
            res.status(500).json({ success: false, message: e.message });
        }
    });

    // --- Dynamic SEO SSR Engine for Single Blog ---
    app.get('/blog/:slug', async (req, res) => {
        try {
            let blog;
            if (offlineDb.isOffline()) {
                blog = offlineDb.getBlogBySlug(req.params.slug);
            } else {
                await checkScheduledBlogs(); // Trigger scheduler check
                await connectToDatabase();
                blog = await Blog.findOne({ slug: req.params.slug, status: { $ne: 'draft' } });
            }
            
            if(!blog) return res.status(404).send('Blog not found');

            // Read the template
            const templatePath = path.join(__dirname, 'blog-detail.html');
            if(!fs.existsSync(templatePath)) return res.status(404).send('Template missing');
            
            let html = fs.readFileSync(templatePath, 'utf8');

            const baseUrl = `${req.secure ? 'https' : 'http'}://${req.headers.host}`;
            const canonicalUrl = `${baseUrl}/blog/${blog.slug}`;
            const seoTitle = blog.seoTitle || blog.title;
            const fullTitle = `${seoTitle} | Zunaisha Islamic Institute`;
            
            // --- INJECT SEO META ---
            html = html.replace(/<title>.*?<\/title>/i, `<title>${fullTitle}</title>`);
            
            const metaDescriptionStr = `<meta name="description" content="${blog.description.replace(/"/g, '&quot;')}">`;
            if (html.includes('<meta name="description"')) {
                html = html.replace(/<meta name="description"[^>]*>/i, metaDescriptionStr);
            } else {
                html = html.replace('</head>', `${metaDescriptionStr}\n</head>`);
            }

            const publishDate = typeof blog.date === 'string' ? new Date(blog.date) : blog.date;

            // Injected dynamic Open Graph & Twitter Cards inside head
            const seoTags = `
                <link rel="canonical" href="${canonicalUrl}">
                <meta name="keywords" content="${(blog.keywords || '').replace(/"/g, '&quot;')}">
                <meta property="og:type" content="article">
                <meta property="og:title" content="${fullTitle.replace(/"/g, '&quot;')}">
                <meta property="og:description" content="${blog.description.replace(/"/g, '&quot;')}">
                <meta property="og:url" content="${canonicalUrl}">
                <meta property="og:image" content="${blog.imageUrl || `${baseUrl}/images/seo/logo.jpg`}">
                <meta property="og:image:width" content="800">
                <meta property="og:image:height" content="450">
                <meta name="twitter:card" content="summary_large_image">
                <meta name="twitter:title" content="${fullTitle.replace(/"/g, '&quot;')}">
                <meta name="twitter:description" content="${blog.description.replace(/"/g, '&quot;')}">
                <meta name="twitter:image" content="${blog.imageUrl || `${baseUrl}/images/seo/logo.jpg`}">
                
                <!-- Structured JSON-LD Schema Markup -->
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "BlogPosting",
                  "mainEntityOfPage": {
                    "@type": "WebPage",
                    "@id": "${canonicalUrl}"
                  },
                  "headline": "${blog.title.replace(/"/g, '\\"')}",
                  "description": "${blog.description.replace(/"/g, '\\"')}",
                  "image": "${blog.imageUrl || `${baseUrl}/images/seo/logo.jpg`}",
                  "author": {
                    "@type": "Person",
                    "name": "${blog.author.replace(/"/g, '\\"')}"
                  },
                  "publisher": {
                    "@type": "Organization",
                    "name": "Zunaisha Islamic Institute",
                    "logo": {
                      "@type": "ImageObject",
                      "url": "${baseUrl}/images/logos/logo.png"
                    }
                  },
                  "datePublished": "${publishDate.toISOString()}",
                  "dateModified": "${publishDate.toISOString()}"
                }
                </script>
                
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "BreadcrumbList",
                  "itemListElement": [
                    {
                      "@type": "ListItem",
                      "position": 1,
                      "name": "Home",
                      "item": "${baseUrl}/"
                    },
                    {
                      "@type": "ListItem",
                      "position": 2,
                      "name": "Blog",
                      "item": "${baseUrl}/blog.html"
                    },
                    {
                      "@type": "ListItem",
                      "position": 3,
                      "name": "${blog.title.replace(/"/g, '\\"')}",
                      "item": "${canonicalUrl}"
                    }
                  ]
                }
                </script>
            `;
            html = html.replace('</head>', `${seoTags}\n</head>`);

            // --- INJECT BLOG VALUES ---
            html = html.replace(/<!-- BLOG_TITLE -->/g, blog.title);
            html = html.replace(/<!-- BLOG_AUTHOR -->/g, blog.author || 'Admin');
            html = html.replace(/<!-- BLOG_DATE -->/g, publishDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
            html = html.replace(/<!-- BLOG_READING_TIME -->/g, blog.readingTime || '3 min read');
            html = html.replace(/<!-- BLOG_CATEGORY -->/g, blog.category || 'Quran');
            html = html.replace(/<!-- BLOG_VIEWS -->/g, blog.views || 0);
            html = html.replace(/<!-- BLOG_LIKES -->/g, blog.likes || 0);
            
            if (blog.imageUrl) {
                html = html.replace(/<!-- BLOG_FEATURED_IMAGE -->/g, `<img src="${blog.imageUrl}" class="img-fluid rounded-4 shadow-sm mb-4 featured-image" alt="${blog.title}" style="width:100%; height:400px; object-fit:cover;">`);
            } else {
                html = html.replace(/<!-- BLOG_FEATURED_IMAGE -->/g, '');
            }

            // Convert double newlines/paragraphs if raw text, or serve rich text HTML
            html = html.replace(/<!-- BLOG_CONTENT -->/g, blog.content);

            // --- INJECT RELATED ARTICLES ---
            let relatedBlogs = [];
            if (offlineDb.isOffline()) {
                relatedBlogs = offlineDb.getBlogs({ category: blog.category }).filter(b => b.slug !== blog.slug).slice(0, 3);
            } else {
                relatedBlogs = await Blog.find({ category: blog.category, slug: { $ne: blog.slug }, status: 'published' }).limit(3);
            }
            let relatedHtml = '';
            if (relatedBlogs.length > 0) {
                relatedHtml = relatedBlogs.map(b => `
                    <div class="col-md-4 mb-4">
                        <div class="card related-card h-100 shadow-sm border-0" style="border-radius: 16px; cursor: pointer; transition: 0.3s;" onclick="window.location.href='/blog/${b.slug}'">
                            ${b.imageUrl ? `<img src="${b.imageUrl}" class="card-img-top" style="height: 180px; object-fit: cover; border-top-left-radius: 16px; border-top-right-radius: 16px;" alt="${b.title}" loading="lazy">` : ''}
                            <div class="card-body p-3">
                                <span class="badge bg-primary bg-opacity-10 text-primary mb-2" style="font-size:11px;">${b.category}</span>
                                <h5 class="fw-bold mb-0 text-main text-truncate-2" style="font-size:14px; line-height: 1.4; color: var(--main);">${b.title}</h5>
                            </div>
                        </div>
                    </div>
                `).join('');
            } else {
                relatedHtml = '<p class="text-muted text-center py-3">No related articles found in this category.</p>';
            }
            html = html.replace(/<!-- BLOG_RELATED_ARTICLES -->/g, relatedHtml);

            // --- INJECT COMMENTS STREAM ---
            let commentsHtml = '';
            if (blog.comments && blog.comments.length > 0) {
                commentsHtml = blog.comments.map(c => `
                    <div class="comment-card border-bottom py-3">
                        <div class="d-flex justify-content-between align-items-center mb-1">
                            <h6 class="fw-bold mb-0 text-dark" style="font-size: 15px;"><i class="fa-solid fa-circle-user me-2 text-primary text-opacity-50"></i>${escapeHtml(c.name)}</h6>
                            <span class="text-muted" style="font-size: 11px;">${new Date(c.date).toLocaleDateString()}</span>
                        </div>
                        <p class="text-muted mb-0 ps-4" style="font-size: 14px; white-space: pre-line;">${escapeHtml(c.comment)}</p>
                    </div>
                `).join('');
            } else {
                commentsHtml = '<p class="text-muted text-center py-4 bg-light rounded-3" id="noCommentsText">Be the first to leave a comment on this article!</p>';
            }
            html = html.replace(/<!-- BLOG_COMMENTS_STREAM -->/g, commentsHtml);
            html = html.replace(/<!-- BLOG_COMMENTS_COUNT -->/g, blog.comments.length);

            res.send(html);

            // Increment views if NOT offline
            if (!offlineDb.isOffline()) {
                blog.views++;
                await blog.save();
            }

        } catch(e) {
            console.error('SSR Error:', e);
            res.status(500).send('Server Error rendering the blog post.');
        }
    });

    // --- Dynamic Sitemap XML Route ---
    app.get('/sitemap.xml', async (req, res) => {
        try {
            let blogs;
            if (offlineDb.isOffline()) {
                blogs = offlineDb.getBlogs({ status: 'published' });
            } else {
                await checkScheduledBlogs(); // Trigger scheduler check
                await connectToDatabase();
                blogs = await Blog.find({ status: 'published' }, 'slug date');
            }
            let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
            
            const baseUrl = `${req.secure ? 'https' : 'http'}://${req.headers.host}`;
            
            // Base Static URLs
            xml += `  <url><loc>${baseUrl}/</loc><priority>1.0</priority></url>\n`;
            xml += `  <url><loc>${baseUrl}/blog.html</loc><priority>0.8</priority></url>\n`;
            xml += `  <url><loc>${baseUrl}/contact.html</loc><priority>0.7</priority></url>\n`;
            
            // Dynamic Blog URLs
            blogs.forEach(b => {
                const bDate = typeof b.date === 'string' ? new Date(b.date) : b.date;
                xml += `  <url><loc>${baseUrl}/blog/${b.slug}</loc><lastmod>${bDate.toISOString().split('T')[0]}</lastmod><priority>0.7</priority></url>\n`;
            });
            
            xml += '</urlset>';
            res.header('Content-Type', 'application/xml');
            res.send(xml);
        } catch (e) {
            console.error('Sitemap generation error:', e);
            res.status(500).send('Error generating sitemap');
        }
    });

    // --- Dynamic Robots.txt Route ---
    app.get('/robots.txt', (req, res) => {
        const baseUrl = `${req.secure ? 'https' : 'http'}://${req.headers.host}`;
        res.header('Content-Type', 'text/plain');
        res.send(`User-agent: *\nAllow: /\nDisallow: /admin-dashboard.html\n\nSitemap: ${baseUrl}/sitemap.xml`);
    });

};
