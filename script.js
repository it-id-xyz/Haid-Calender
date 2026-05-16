// Import Firebase SDK (Setup placeholder)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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

// GROQ API KEY
const GROQ_API_KEY = "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";

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const isDark = document.body.classList.contains('dark-theme');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// Data Mockup
let cycleData = {
    start: "2024-05-05",
    end: "2024-05-10",
    note: ""
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let currentDateObj = new Date();
let currentMonth = currentDateObj.getMonth();
let currentYear = currentDateObj.getFullYear();

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    initCalendar();
    updateAIInsight();
    renderChart();
});

function renderChart() {
    const chart = document.getElementById('cycleChart');
    chart.innerHTML = '';
    if (!cycleData.start || !cycleData.end) {
        chart.innerHTML = '<p style="text-align:center; width:100%; color:var(--text-light); font-size: 0.9rem; margin-top: 20px;">Belum ada siklus yang dicatat.</p>';
        return;
    }

    // Create a dynamic chart based on current month
    const currentM = new Date(cycleData.start).getMonth();
    for (let i = 4; i >= 0; i--) {
        let m = currentM - i;
        if (m < 0) m += 12;
        // Simulate previous cycles based on random height, except current one
        const h = i === 0 ? 28 : Math.floor(Math.random() * 10) + 25;
        const isActive = i === 0 ? 'active' : '';
        chart.innerHTML += `<div class="bar ${isActive}" style="--h: ${h}px" data-label="${monthNames[m].substring(0, 3)}"></div>`;
    }
}

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

            if (dateStr === cycleData.start) classes += ' range-start';
            else if (dateStr === cycleData.end) classes += ' range-end';
            else if (cycleData.start && cycleData.end && dateStr > cycleData.start && dateStr < cycleData.end) classes += ' in-range';

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
        updateAIInsight();
    }
};

// Date inputs logic
document.getElementById('startDateInput').addEventListener('change', (e) => {
    cycleData.start = e.target.value;
    initCalendar();
    updateAIInsight();
    renderChart();
});

document.getElementById('endDateInput').addEventListener('change', (e) => {
    cycleData.end = e.target.value;
    initCalendar();
    updateAIInsight();
    renderChart();
});

// AI Insight Logic with Groq
async function updateAIInsight() {
    const statusEl = document.getElementById('aiStatus');
    const recEl = document.querySelector('.recommendation-grid');

    if (!cycleData.start || !cycleData.end) return;

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
        const noteContext = cycleData.note ? `. Catatan tambahan saya: ${cycleData.note}.` : "";
        const prompt = `Siklus haid saya mulai tanggal ${cycleData.start} dan berakhir ${cycleData.end}. Hari ini tanggal ${new Date().toISOString().split('T')[0]}${noteContext} Berikan analisis singkat status saya dan 2 rekomendasi (1 makanan dan minuman, 1 kegiatan) dalam format JSON: {"status": "string", "makanan dan minuman": "string", "kegiatan": "string"}. Ingat, kembalikan HANYA JSON murni tanpa markdown, tanpa kalimat tambahan.`;

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

let chatHistory = [];

openChatBtn.addEventListener('click', () => chatModal.classList.remove('hidden'));
closeChat.addEventListener('click', () => chatModal.classList.add('hidden'));

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
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GROQ_API_KEY}`
            },
            body: JSON.stringify({
                model: 'llama-3.3-70b-versatile',
                messages: [
                    { role: "system", content: `Kamu adalah Aina AI, asisten spesialis kesehatan reproduksi wanita. User saat ini sedang mencatat siklus haid dari ${cycleData.start} s/d ${cycleData.end}. Catatan keluhan: ${cycleData.note || 'tidak ada'}. Jawab dengan ramah, suportif, informatif, dan ringkas menggunakan bahasa Indonesia.` },
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
