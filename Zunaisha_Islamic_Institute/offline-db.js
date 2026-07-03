const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DB_FILE = path.join(__dirname, 'offline_db.json');

// Preloaded 5 SEO-optimized blogs to seed when db is created
const SEED_BLOGS = [
    {
        _id: "seed-blog-1",
        title: "10 Life-Changing Benefits of Learning Quran Online",
        seoTitle: "10 Life-Changing Benefits of Learning Quran Online | Zunaisha",
        description: "Explore the ultimate guide to learning the Quran online. Understand how professional online classes with Tajweed offer safe, convenient, and highly effective tutoring for children and adults globally.",
        keywords: "learn quran online, online quran classes, online quran tutoring, tajweed learning online, hifz quran classes, learn quran for kids, zunaisha islamic institute",
        slug: "benefits-of-learning-quran-online",
        category: "Online Quran Classes",
        tags: ["Quran Classes", "Online Learning", "Tajweed Benefits"],
        imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800",
        author: "Ustadha Zunaisha",
        date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        views: 284,
        likes: 42,
        status: "published",
        readingTime: "5 min read",
        comments: [],
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
        _id: "seed-blog-2",
        title: "How to Improve Tajweed: A Step-by-Step Guide to Beautiful Recitation",
        seoTitle: "How to Improve Tajweed and Recite Quran Beautifully | Zunaisha",
        description: "Learn how to master Tajweed rules, correct your pronunciation (Makharij), and recite the Holy Quran with proper accent and deep spiritual impact.",
        keywords: "how to improve tajweed, learn tajweed rules, correct makharij, beautiful quran recitation, tajweed classes, zunaisha islamic institute",
        slug: "how-to-improve-tajweed",
        category: "Tajweed",
        tags: ["Tajweed Rules", "Quran Recitation", "Makharij Guide"],
        imageUrl: "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?auto=format&fit=crop&q=80&w=800",
        author: "Qari Muhammad Ehtasham",
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        views: 412,
        likes: 58,
        status: "published",
        readingTime: "6 min read",
        comments: [],
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
            <p>These are the core building blocks of Tajweed. Memorize and apply the rules of Izhar (clarity), Idgham (nasalizing), Iqlab (changing to Meem), and Ikhfa (nasal hiding).</p>
            <h2>Step 3: Listen Attentively to Expert Qaris</h2>
            <p>Imitation is a powerful learning tool. Listen to legendary Qaris known for their slow and precise Tajweed, such as Sheikh Mahmoud Khalil Al-Husary or Sheikh Minshawi.</p>
            <h2>Step 4: Record Yourself Reciting</h2>
            <p>Often, we cannot hear our own mistakes while reciting. Record your voice reading a short passage and play it back while listening closely.</p>
            <h2>Step 5: Get Professional One-on-One Mentorship</h2>
            <p>At <strong>Zunaisha Islamic Institute</strong>, we specialize in personalized Tajweed corrections for students of all ages.</p>
        `
    },
    {
        _id: "seed-blog-3",
        title: "What is the Best Age for Kids to Memorize the Quran (Hifz)?",
        seoTitle: "Best Age for Hifz Quran | When Should Children Start Memorization? | Zunaisha",
        description: "Learn about the optimal age for children to start Hifzul Quran, cognitive development, memorization methods, and tips for parents supporting Hifz.",
        keywords: "best age for hifz, when to start memorizing quran, child quran memorization, hifz tips for kids, online hifz, zunaisha islamic institute",
        slug: "best-age-for-hifz",
        category: "Hifz Tips",
        tags: ["Hifz Tips", "Parenting", "Islamic Hifz"],
        imageUrl: "https://images.unsplash.com/photo-1518156677180-95a2893f3e9f?auto=format&fit=crop&q=80&w=800",
        author: "Hafiz Muhammad",
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        views: 319,
        likes: 49,
        status: "published",
        readingTime: "4 min read",
        comments: [],
        content: `
            <p class="lead">Memorizing the entire Quran is one of the most noble achievements a young Muslim can attain, carrying profound blessings for both the child and their parents. But as a parent, a common question arises: <em>When is the best age to enroll my child in a Hifz program?</em></p>
            <p>While every child develops uniquely, cognitive research and historical practices indicate a clear window where child memorization is exceptionally fertile. Let us look at what makes this period ideal and how to prepare your children.</p>
            <h2>The Golden Age: 5 to 12 Years Old</h2>
            <p>Most scholars and educators agree that the golden age for Quran memorization is between 5 and 12 years. Here is why:</p>
            <ul>
                <li><strong>Superb Cognitive Flexibility:</strong> Children's brains are like sponges. They possess a high capacity for acoustic retention.</li>
                <li><strong>Fewer Distractions:</strong> During this period, children are relatively free from teenage and adult concerns.</li>
            </ul>
        `
    }
];

// Offline database state holder
let state = {
    submissions: [],
    quickContacts: [],
    blogs: [...SEED_BLOGS],
    admin: {
        username: "admin",
        passwordHash: "8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", // sha256 of "admin123"
        token: null
    }
};

function readDb() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            const parsed = JSON.parse(data);
            state = { ...state, ...parsed };
        } else {
            writeDb();
        }
    } catch (e) {
        console.error("Error reading offline DB file:", e);
    }
}

function writeDb() {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 4), 'utf8');
    } catch (e) {
        console.error("Error writing offline DB file:", e);
    }
}

// Initial reading
readDb();

module.exports = {
    isOffline: () => {
        return !!global.isOfflineMode;
    },
    
    setOfflineMode: (val) => {
        global.isOfflineMode = !!val;
    },

    saveFormSubmission: (data) => {
        const item = {
            _id: 'sub-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            ...data,
            submittedAt: new Date().toISOString()
        };
        state.submissions.push(item);
        writeDb();
        return item;
    },

    saveQuickContact: (data) => {
        const item = {
            _id: 'qc-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            ...data,
            submittedAt: new Date().toISOString()
        };
        state.quickContacts.push(item);
        writeDb();
        return item;
    },

    getBlogs: (queryOpts = {}) => {
        let list = [...state.blogs];
        
        // Filter drafts unless an admin token is passed
        const { category, search, tag, status, popular } = queryOpts;
        
        if (status) {
            list = list.filter(b => b.status === status);
        } else if (!queryOpts.isAdmin) {
            list = list.filter(b => b.status === 'published');
        }

        if (category) {
            list = list.filter(b => b.category && b.category.toLowerCase() === category.toLowerCase());
        }

        if (tag) {
            list = list.filter(b => b.tags && b.tags.some(t => t.toLowerCase() === tag.toLowerCase()));
        }

        if (search) {
            const s = search.toLowerCase();
            list = list.filter(b => 
                (b.title && b.title.toLowerCase().includes(s)) ||
                (b.description && b.description.toLowerCase().includes(s)) ||
                (b.keywords && b.keywords.toLowerCase().includes(s))
            );
        }

        // Sorting
        if (popular === 'true') {
            list.sort((a, b) => (b.views || 0) - (a.views || 0));
        } else {
            list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        }

        return list;
    },

    getBlogBySlug: (slug) => {
        const idx = state.blogs.findIndex(b => b.slug === slug);
        if (idx === -1) return null;
        
        // Auto increment views
        state.blogs[idx].views = (state.blogs[idx].views || 0) + 1;
        writeDb();
        
        return state.blogs[idx];
    },

    addComment: (slug, commentData) => {
        const idx = state.blogs.findIndex(b => b.slug === slug);
        if (idx === -1) return null;

        const newComment = {
            _id: 'comment-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            name: commentData.name,
            email: commentData.email || '',
            comment: commentData.comment,
            date: new Date().toISOString()
        };

        if (!state.blogs[idx].comments) {
            state.blogs[idx].comments = [];
        }

        state.blogs[idx].comments.push(newComment);
        writeDb();
        return state.blogs[idx].comments;
    },

    addLike: (slug) => {
        const idx = state.blogs.findIndex(b => b.slug === slug);
        if (idx === -1) return null;

        state.blogs[idx].likes = (state.blogs[idx].likes || 0) + 1;
        writeDb();
        return state.blogs[idx].likes;
    },

    createBlog: (blogData) => {
        // Calculate reading time
        const words = (blogData.content || '').replace(/<[^>]*>?/gm, '').split(/\s+/).length;
        const readingTime = Math.ceil(words / 200) + ' min read';

        const newBlog = {
            _id: 'blog-' + Date.now() + '-' + Math.floor(Math.random() * 1000),
            title: blogData.title,
            seoTitle: blogData.seoTitle || blogData.title,
            description: blogData.description,
            keywords: blogData.keywords || '',
            slug: blogData.slug,
            content: blogData.content,
            author: blogData.author || 'Admin',
            category: blogData.category || 'General',
            tags: Array.isArray(blogData.tags) ? blogData.tags : (blogData.tags ? blogData.tags.split(',').map(x => x.trim()) : []),
            imageUrl: blogData.imageUrl || '',
            readingTime,
            date: new Date().toISOString(),
            views: 0,
            likes: 0,
            status: blogData.status || 'published',
            comments: [],
            scheduledDate: blogData.scheduledDate ? new Date(blogData.scheduledDate).toISOString() : null
        };

        state.blogs.push(newBlog);
        writeDb();
        return newBlog;
    },

    updateBlog: (id, blogData) => {
        const idx = state.blogs.findIndex(b => b._id === id);
        if (idx === -1) return false;

        let tags = blogData.tags;
        if (tags && !Array.isArray(tags)) {
            tags = tags.split(',').map(x => x.trim());
        }

        let readingTime = state.blogs[idx].readingTime;
        if (blogData.content) {
            const words = blogData.content.replace(/<[^>]*>?/gm, '').split(/\s+/).length;
            readingTime = Math.ceil(words / 200) + ' min read';
        }

        state.blogs[idx] = {
            ...state.blogs[idx],
            ...blogData,
            tags: tags || state.blogs[idx].tags,
            readingTime
        };

        writeDb();
        return true;
    },

    deleteBlog: (id) => {
        const lenBefore = state.blogs.length;
        state.blogs = state.blogs.filter(b => b._id !== id);
        writeDb();
        return state.blogs.length < lenBefore;
    },

    getAnalytics: () => {
        let totalViews = 0;
        let totalLikes = 0;
        let totalComments = 0;

        state.blogs.forEach(b => {
            totalViews += (b.views || 0);
            totalLikes += (b.likes || 0);
            totalComments += (b.comments ? b.comments.length : 0);
        });

        return {
            totalArticles: state.blogs.length,
            totalViews,
            totalLikes,
            totalComments
        };
    },

    loginAdmin: (username, password) => {
        const hash = crypto.createHash('sha256').update(password).digest('hex');
        if (username === state.admin.username && hash === state.admin.passwordHash) {
            const token = crypto.randomBytes(32).toString('hex');
            state.admin.token = token;
            writeDb();
            return token;
        }
        return null;
    },

    logoutAdmin: (token) => {
        if (state.admin.token === token) {
            state.admin.token = null;
            writeDb();
            return true;
        }
        return false;
    },

    checkAdminToken: (token) => {
        return state.admin.token && state.admin.token === token;
    }
};
