// Import Firebase SDK (Setup placeholder)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDnbgqXr1K13W1MYwNlO83vmgyL3K4-aPw",
    authDomain: "haid-calender.firebaseapp.com",
    projectId: "haid-calender",
    storageBucket: "haid-calender.firebasestorage.app",
    messagingSenderId: "1064891928895",
    appId: "1:1064891928895:web:1343006879fc35ae6b038a",
    measurementId: "G-BW27ZX84TQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// GROQ API KEY
const GROQ_API_KEY = "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";

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// User & Data System
let currentUser = null;
let cycleHistory = [];
let cycleData = { start: "", end: "", note: "" };
let userProfile = { name: "", age: "", duration: "", condition: "" };

const loginOverlay = document.getElementById('loginOverlay');
const loginGoogleBtn = document.getElementById('loginGoogleBtn');
const userInfo = document.getElementById('userInfo');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const greetingText = document.getElementById('greetingText');

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUser = user;
        loginOverlay.classList.add('hidden');
        userInfo.classList.remove('hidden');
        userAvatar.src = user.photoURL || 'https://via.placeholder.com/35';
        await loadUserData(user.email);
        initCalendar();
        updateAIInsight();
        renderChart();
    } else {
        currentUser = null;
        loginOverlay.classList.remove('hidden');
        userInfo.classList.add('hidden');
        cycleHistory = [];
        cycleData = { start: "", end: "", note: "" };
        userProfile = { name: "", age: "", duration: "", condition: "" };
        greetingText.innerText = "";
        initCalendar();
    }
});

loginGoogleBtn.addEventListener('click', () => {
    signInWithPopup(auth, provider).catch(error => console.error("Login Error", error));
});

// Dropdown Logic
const userDropdown = document.getElementById('userDropdown');
userAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    userDropdown.classList.toggle('active');
});
document.addEventListener('click', () => userDropdown.classList.remove('active'));

logoutBtn.addEventListener('click', () => {
    signOut(auth);
});

// Profile Modal Logic
const profileModal = document.getElementById('profileModal');
const openProfileBtn = document.getElementById('openProfileBtn');
const closeProfileBtn = document.getElementById('closeProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');

openProfileBtn.addEventListener('click', () => {
    document.getElementById('profileName').value = userProfile.name || "";
    document.getElementById('profileAge').value = userProfile.age || "";
    document.getElementById('profileDuration').value = userProfile.duration || "";
    document.getElementById('profileCondition').value = userProfile.condition || "";
    profileModal.classList.remove('hidden');
});

closeProfileBtn.addEventListener('click', () => profileModal.classList.add('hidden'));

saveProfileBtn.addEventListener('click', () => {
    userProfile.name = document.getElementById('profileName').value;
    userProfile.age = document.getElementById('profileAge').value;
    userProfile.duration = document.getElementById('profileDuration').value;
    userProfile.condition = document.getElementById('profileCondition').value;
    saveUserData();
    updateGreeting();
    updateAIInsight();
    profileModal.classList.add('hidden');
});

function updateGreeting() {
    if (userProfile.name) {
        greetingText.innerText = `Hai, ${userProfile.name}!`;
    } else {
        greetingText.innerText = "";
    }
}

async function loadUserData(email) {
    const userDocRef = doc(db, "users", email);
    try {
        const docSnap = await getDoc(userDocRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            cycleHistory = data.cycleHistory || [];
            userProfile = data.userProfile || { name: "", age: "", duration: "", condition: "" };
        } else {
            cycleHistory = [];
        }
        cycleData = cycleHistory.length > 0 ? cycleHistory[cycleHistory.length - 1] : { start: "", end: "", note: "" };
        updateGreeting();
    } catch(e) { console.error("Error loading data", e); }
}

async function saveUserData() {
    if (!currentUser) return;
    const userDocRef = doc(db, "users", currentUser.email);
    try {
        await setDoc(userDocRef, {
            cycleHistory: cycleHistory,
            userProfile: userProfile,
            lastUpdated: new Date()
        }, { merge: true });
    } catch(e) { console.error("Error saving data", e); }
}

function saveCycle(type, val) {
    if (!val) return;
    const dateObj = new Date(val);
    const month = dateObj.getMonth();
    const year = dateObj.getFullYear();
    
    let existing = cycleHistory.find(c => {
        if (!c.start && !c.end) return false;
        const refDate = new Date(c.start || c.end);
        return refDate.getMonth() === month && refDate.getFullYear() === year;
    });

    if (existing) {
        if (type === 'start') existing.start = val;
        if (type === 'end') existing.end = val;
    } else {
        let newCycle = { start: "", end: "", note: "" };
        if (type === 'start') newCycle.start = val;
        if (type === 'end') newCycle.end = val;
        cycleHistory.push(newCycle);
    }
    
    cycleHistory.sort((a, b) => {
        const d1 = a.start ? new Date(a.start) : new Date(a.end || 0);
        const d2 = b.start ? new Date(b.start) : new Date(b.end || 0);
        return d1 - d2;
    });
    
    cycleData = cycleHistory[cycleHistory.length - 1];
    saveUserData();
}

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let currentDateObj = new Date();
let currentMonth = currentDateObj.getMonth();
let currentYear = currentDateObj.getFullYear();

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    // Dipanggil saat auth state berubah
});

function renderChart() {
    const chart = document.getElementById('cycleChart');
    chart.innerHTML = '';
    
    if (cycleHistory.length === 0 || !cycleHistory[0].start) {
        chart.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-light); font-size: 0.9rem; margin-top: 20px;">Belum ada siklus yang dicatat.</p>';
        return;
    }

    const recent = cycleHistory.slice(-7);
    
    recent.forEach((c, index) => {
        if (!c.start) return;
        
        let cycleLength = 0;
        if (index > 0 && recent[index - 1].start) {
            const prevStart = new Date(recent[index - 1].start);
            const currStart = new Date(c.start);
            cycleLength = Math.round((currStart - prevStart) / (1000 * 60 * 60 * 24));
        } else {
            cycleLength = 28;
        }
        
        const m = new Date(c.start).getMonth();
        let h = Math.min(Math.max(cycleLength, 10), 45); 
        
        const isActive = (index === recent.length - 1) ? 'active' : '';
        const safeNote = c.note ? c.note.replace(/'/g, "\\'") : 'Tidak ada catatan';
        
        chart.innerHTML += `
            <div class="bar ${isActive}" style="--h: ${h}px" 
                 onclick="window.showChartTooltip('${monthNames[m]}', ${cycleLength}, '${c.start}', '${c.end || '-'}', '${safeNote}')">
                <span class="bar-label">${monthNames[m].substring(0, 3)}<br>${cycleLength}h</span>
            </div>`;
    });
}

window.showChartTooltip = (month, length, start, end, note) => {
    document.getElementById('ttMonth').innerText = `Bulan ${month}`;
    document.getElementById('ttLength').innerText = length;
    document.getElementById('ttRange').innerText = `${start} s/d ${end}`;
    document.getElementById('ttNote').innerText = note;
    document.getElementById('chartTooltip').classList.remove('hidden');
};

window.closeChartTooltip = () => {
    document.getElementById('chartTooltip').classList.add('hidden');
};

function initCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');

    grid.style.opacity = 0;
    setTimeout(() => {
        grid.innerHTML = '';
        monthDisplay.innerText = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDay = new Date(currentYear, currentMonth, 1).getDay();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

        // Fill Empty Slots
        for (let i = 0; i < (firstDay === 0 ? 6 : firstDay - 1); i++) {
            grid.innerHTML += `<div></div>`;
        }

        // Fill Days
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            let classes = 'day';

            if (cycleHistory.some(c => c.start === dateStr)) classes += ' range-start';
            else if (cycleHistory.some(c => c.end === dateStr)) classes += ' range-end';
            else if (cycleHistory.some(c => c.start && c.end && dateStr > c.start && dateStr < c.end)) classes += ' in-range';

            grid.innerHTML += `<div class="${classes}" onclick="selectDate('${dateStr}')">${day}</div>`;
        }

        grid.style.transition = "opacity 0.3s ease";
        grid.style.opacity = 1;
    }, 150);
}

document.getElementById('prevMonth').addEventListener('click', () => {
    currentMonth--;
    if (currentMonth < 0) { currentMonth = 11; currentYear--; }
    initCalendar();
});

document.getElementById('nextMonth').addEventListener('click', () => {
    currentMonth++;
    if (currentMonth > 11) { currentMonth = 0; currentYear++; }
    initCalendar();
});

window.selectDate = (date) => {
    console.log("Date selected on calendar:", date);
};

window.openCatatan = () => {
    const note = prompt("Masukkan catatan (contoh: Kram perut, mood swing, dll):", cycleData.note || "");
    if (note !== null) {
        cycleData.note = note;
        saveUserData();
        updateAIInsight();
    }
};

// Date inputs logic
document.getElementById('startDateInput').addEventListener('change', (e) => {
    saveCycle('start', e.target.value);
    initCalendar();
    updateAIInsight();
    renderChart();
});

document.getElementById('endDateInput').addEventListener('change', (e) => {
    saveCycle('end', e.target.value);
    initCalendar();
    updateAIInsight();
    renderChart();
});

// AI Insight Logic with Groq
async function updateAIInsight() {
    const statusEl = document.getElementById('aiStatus');
    const recEl = document.querySelector('.recommendation-grid');

    if (cycleHistory.length === 0 || !cycleHistory[0].start) return;

    statusEl.innerText = "Status: AI menganalisis siklus Anda...";

    if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith("gsk_")) {
        statusEl.innerText = "Status: API Key Groq belum diisi. Menampilkan data default.";
        recEl.innerHTML = `
            <div class="rec-item"><i class="fas fa-utensils"></i><span>Makanan: Air kelapa, cokelat hitam</span></div>
            <div class="rec-item"><i class="fas fa-person-running"></i><span>Kegiatan: Yoga ringan, istirahat cukup</span></div>
        `;
        return;
    }

    try {
        let historyText = cycleHistory.map(c => `Bulan ${c.start ? new Date(c.start).getMonth()+1 : '?'}: Mulai ${c.start}, Selesai ${c.end}`).join('; ');
        const noteContext = cycleData.note ? `. Catatan terakhir bulan ini: ${cycleData.note}.` : "";
        const profileContext = userProfile.name ? ` Nama saya ${userProfile.name}, umur ${userProfile.age} tahun. Durasi haid normal saya ${userProfile.duration} hari. Keluhan umum: ${userProfile.condition}.` : "";
        const prompt = `Riwayat haid saya beberapa bulan terakhir: ${historyText}. Hari ini tanggal ${new Date().toISOString().split('T')[0]}${noteContext}${profileContext} Berikan analisis singkat status saya dan 2 rekomendasi (1 makanan dan minuman, 1 kegiatan) dalam format JSON: {"status": "string", "makanan dan minuman": "string", "kegiatan": "string"}. Ingat, kembalikan HANYA JSON murni tanpa markdown, tanpa kalimat tambahan.`;

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [{ role: "user", content: prompt }]
            })
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error?.message || "Network response was not ok");

        let content = data.choices[0].message.content.trim();
        const firstBrace = content.indexOf('{');
        const lastBrace = content.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            content = content.substring(firstBrace, lastBrace + 1);
        }

        const result = JSON.parse(content);
        const makananValue = result["makanan dan minuman"] || result.makanan || "Air putih yang cukup";

        statusEl.innerText = `Status: ${result.status}`;
        recEl.innerHTML = `
            <div class="rec-item"><i class="fas fa-utensils"></i><span>Makanan: ${makananValue}</span></div>
            <div class="rec-item"><i class="fas fa-person-running"></i><span>Kegiatan: ${result.kegiatan}</span></div>
        `;
    } catch (error) {
        statusEl.innerText = "Status: Gagal menghubungi AI.";
    }
}

// Chat AI Logic
const openChatBtn = document.getElementById('openChatBtn');
const closeChat = document.getElementById('closeChat');
const chatModal = document.getElementById('chatModal');
const chatBox = document.getElementById('chat-box');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');

// Sidebar Logic
const chatSidebar = document.getElementById('chatSidebar');
const toggleSidebar = document.getElementById('toggleSidebar');
const closeSidebar = document.getElementById('closeSidebar');
const newChatBtn = document.querySelector('.new-chat-btn');

toggleSidebar.addEventListener('click', () => chatSidebar.classList.remove('collapsed'));
closeSidebar.addEventListener('click', () => chatSidebar.classList.add('collapsed'));

let chatHistory = [];

openChatBtn.addEventListener('click', () => {
    chatModal.classList.remove('hidden');
    // Tampilkan sidebar secara default di desktop, sembunyikan di mobile
    if (window.innerWidth <= 768) chatSidebar.classList.add('collapsed');
    else chatSidebar.classList.remove('collapsed');
});
closeChat.addEventListener('click', () => chatModal.classList.add('hidden'));

newChatBtn.addEventListener('click', () => {
    chatBox.innerHTML = `
        <div class="welcome-card">
            <div class="icon-circle primary-bg" style="margin:0 auto 10px auto;"><i class="fas fa-robot text-white"></i></div>
            <h2>Aina AI - Haid Edition</h2>
            <p class="tagline">Tanya apapun tentang siklus haid, kewanitaan, dan kesehatan.</p>
        </div>
    `;
    chatHistory = [];
    if(window.innerWidth <= 768) chatSidebar.classList.add('collapsed');
});

chatInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendChatMessage();
        this.style.height = 'auto';
    }
});

chatInput.addEventListener('input', function () {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 100) + 'px';
});

sendChatBtn.addEventListener('click', sendChatMessage);

async function sendChatMessage() {
    const msg = chatInput.value.trim();
    if (!msg) return;

    // Hide welcome card if exists
    const welcome = chatBox.querySelector('.welcome-card');
    if (welcome) welcome.remove();

    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    // Append User Message
    chatBox.insertAdjacentHTML('beforeend', `
        <div class="message outgoing">
            <div class="bubble">${msg}<span class="time">${timeStr}</span></div>
        </div>
    `);

    chatInput.value = '';

    // Append AI Loading
    chatBox.insertAdjacentHTML('beforeend', `
        <div class="message incoming">
            <div class="bubble" id="loadingBubble">
                <i class="fas fa-circle-notch fa-spin"></i> AI sedang berpikir...
                <span class="time">${timeStr}</span>
            </div>
        </div>
    `);

    chatBox.scrollTop = chatBox.scrollHeight;

    chatHistory.push({ role: "user", content: msg });

    if (!GROQ_API_KEY || !GROQ_API_KEY.startsWith("gsk_")) {
        document.getElementById('loadingBubble').parentElement.remove();
        chatBox.insertAdjacentHTML('beforeend', `
            <div class="message incoming">
                <div class="bubble">API Key Groq belum diatur di script.js! Silakan isi variabel GROQ_API_KEY.<span class="time">${timeStr}</span></div>
            </div>
        `);
        return;
    }

    try {
        let historyText = cycleHistory.map(c => `Bulan ${c.start ? new Date(c.start).getMonth()+1 : '?'}: Mulai ${c.start}, Selesai ${c.end}`).join('; ');
        const profileContext = userProfile.name ? `Nama User: ${userProfile.name}, Umur: ${userProfile.age}, Durasi Normal: ${userProfile.duration} hari, Keluhan Umum: ${userProfile.condition}.` : "";
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: `Kamu adalah Aina AI, asisten spesialis kesehatan reproduksi wanita. ${profileContext} User memiliki riwayat haid: ${historyText}. Catatan keluhan bulan ini: ${cycleData.note || 'tidak ada'}. Jawab dengan ramah, suportif, informatif, dan ringkas menggunakan bahasa Indonesia.` },
                    ...chatHistory.slice(-5) // Send last 5 messages for context
                ]
            })
        });

        const data = await response.json();
        const jawaban = data.choices[0].message.content;

        chatHistory.push({ role: "assistant", content: jawaban });

        // Remove loading bubble
        document.getElementById('loadingBubble').parentElement.remove();

        // Append real AI response
        chatBox.insertAdjacentHTML('beforeend', `
            <div class="message incoming">
                <div class="bubble">${jawaban.replace(/\n/g, '<br>')}<span class="time">${timeStr}</span></div>
            </div>
        `);

        chatBox.scrollTop = chatBox.scrollHeight;
    } catch (error) {
        document.getElementById('loadingBubble').parentElement.remove();
        chatBox.insertAdjacentHTML('beforeend', `
            <div class="message incoming">
                <div class="bubble">Gagal terhubung ke AI.<span class="time">${timeStr}</span></div>
            </div>
        `);
    }
}
