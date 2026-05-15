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

// DOM Elements
const themeToggle = document.getElementById('themeToggle');
const html = document.documentElement;

// Theme Logic
themeToggle.addEventListener('click', () => {
    html.classList.toggle('dark');
    const isDark = html.classList.contains('dark');
    themeToggle.innerHTML = isDark ? '<i class="fas fa-sun"></i>' : '<i class="fas fa-moon"></i>';
});

// AI Recommendation Mockup (Logic Placeholder)
function updateAIInsight(status) {
    const statusEl = document.getElementById('statusHaid');
    const recEl = document.getElementById('recommendations');

    if (status === 'normal') {
        statusEl.innerText = "Siklus Anda bulan ini terpantau normal. Tetap jaga hidrasi!";
        recEl.innerHTML = `
            <li>Konsumsi air kelapa atau cokelat hitam</li>
            <li>Lakukan yoga ringan atau stretching</li>
            <li>Istirahat minimal 7-8 jam</li>
        `;
    }
}

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentDate').innerText = new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
    updateAIInsight('normal');
});

// Data Mockup (Nanti dikonek ke Firestore)
let cycleData = {
    start: "2024-05-05",
    end: "2024-05-10"
};

const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function initCalendar() {
    const grid = document.getElementById('calendarGrid');
    const monthDisplay = document.getElementById('monthDisplay');
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
        else if (dateStr > cycleData.start && dateStr < cycleData.end) classes += ' in-range';

        grid.innerHTML += `<div class="${classes}" onclick="selectDate('${dateStr}')">${day}</div>`;
    }
}

// Theme Toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark-theme');
    const icon = document.querySelector('#themeToggle i');
    icon.className = document.body.classList.contains('dark-theme') ? 'fas fa-sun' : 'fas fa-moon';
});

window.selectDate = (date) => {
    console.log("Selected:", date);
    // Logika input start/end date haid
};

window.openInput = (type) => {
    alert(`Membuka Input untuk: ${type}`);
};

document.addEventListener('DOMContentLoaded', initCalendar);
