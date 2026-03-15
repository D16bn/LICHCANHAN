const calendarGrid = document.getElementById('calendarGrid');
const currentMonthYear = document.getElementById('currentMonthYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const btnToday = document.getElementById('btnToday');
const jumpDateInput = document.getElementById('jumpDateInput');

// Language element
const btnLangToggle = document.getElementById('btnLangToggle');
const flagIcon = document.getElementById('flagIcon');

// Right panel elements
const displayDayName = document.getElementById('displayDayName');
const displayDate = document.getElementById('displayDate');
const displayMonthYear = document.getElementById('displayMonthYear');
const displayLunarDate = document.getElementById('displayLunarDate');

// Checkboxes
const checkThien = document.getElementById('checkThien');
const checkYoga = document.getElementById('checkYoga');
const checkPushup = document.getElementById('checkPushup');
const dailyNote = document.getElementById('dailyNote');

// Stats Elements
const tabBtns = document.querySelectorAll('.tab-btn');
const statThien = document.getElementById('statThien');
const statYoga = document.getElementById('statYoga');
const statPushup = document.getElementById('statPushup');

let currentDate = new Date();
let selectedDate = new Date();
let habitData = {}; // Thay vì gán localStorage, để rỗng trước đợi DB kéo về
let currentLang = localStorage.getItem('calendarLang') || 'vi';

// --------------------------------------------------------------------
// FIREBASE CONFIGURATION (Lấy từ User)
// --------------------------------------------------------------------
const firebaseConfig = {
    apiKey: "AIzaSyChFcXv6-6wiLDKlyP-n3i_Mo7gX0qughw",
    authDomain: "lichcanhan-8f468.firebaseapp.com",
    databaseURL: "https://lichcanhan-8f468-default-rtdb.firebaseio.com",
    projectId: "lichcanhan-8f468",
    storageBucket: "lichcanhan-8f468.firebasestorage.app",
    messagingSenderId: "584109712301",
    appId: "1:584109712301:web:73e5ab9d2f1ba5d76f3724"
};

// Khởi tạo Firebase App và Database
firebase.initializeApp(firebaseConfig);
const database = firebase.database();
// --------------------------------------------------------------------

const i18n = {
    vi: {
        title: "Lịch Tập Luyện Cá Nhân",
        todayBtn: "Hôm nay",
        lunarText: "Âm lịch: ",
        habitsTitle: "Thói Quen Mỗi Ngày",
        habitsSub: "Đánh dấu khi bạn hoàn thành",
        habitThien: "Thiền",
        habitYoga: "Yoga",
        habitPushup: "Push up",
        statsTitle: "Thống Kê Tiến Độ",
        notesTitle: "Ghi chú",
        notesPlaceholder: "Nhập ghi chú cho ngày này...",
        tabWeek: "Tuần",
        tabMonth: "Tháng",
        tabYear: "Năm",
        statThien: "Thiền",
        statYoga: "Yoga",
        statPushup: "Push up",
        monthName: "Tháng",
        dayNames: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
    },
    en: {
        title: "Personal Training Calendar",
        todayBtn: "Today",
        lunarText: "Lunar: ",
        habitsTitle: "Daily Habits",
        habitsSub: "Check when completed",
        habitThien: "Meditation",
        habitYoga: "Yoga",
        habitPushup: "Push up",
        statsTitle: "Progress Stats",
        notesTitle: "Notes",
        notesPlaceholder: "Enter notes for this day...",
        tabWeek: "Week",
        tabMonth: "Month",
        tabYear: "Year",
        statThien: "Meditation",
        statYoga: "Yoga",
        statPushup: "Push up",
        monthName: "Month",
        dayNames: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    }
};

// Remove hardcoded dayNames
// const dayNames = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];

// Initialize App
function init() {
    flagIcon.src = currentLang === 'vi' ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
    flagIcon.alt = currentLang.toUpperCase();
    applyLanguage(currentLang);
    renderCalendar();
    updateDetailPanel(selectedDate);
    updateStats('week');
    
    // LẮNG NGHE DATA TỪ FIREBASE ĐÁM MÂY (Realtime Sync)
    database.ref('habitTrackerData').on('value', (snapshot) => {
        const data = snapshot.val();
        if (data) {
            habitData = data;
        } else {
            habitData = {};
        }
        // Data về -> Render lại Lịch và Bảng thông báo
        renderCalendar();
        updateDetailPanel(selectedDate);
        const activeTabEle = document.querySelector('.tab-btn.active');
        if (activeTabEle) updateStats(activeTabEle.dataset.range);
    });
    
    // Event Listeners
    prevMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
    });
    
    nextMonthBtn.addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
    });
    
    // Jump to Today
    btnToday.addEventListener('click', () => {
        const today = new Date();
        currentDate = new Date(today);
        selectedDate = new Date(today);
        renderCalendar();
        updateDetailPanel(selectedDate);
    });

    // Jump to specific Date
    jumpDateInput.addEventListener('change', (e) => {
        if (!e.target.value) return;
        const [year, month, day] = e.target.value.split('-');
        const targetDate = new Date(year, month - 1, day);
        currentDate = new Date(targetDate);
        selectedDate = new Date(targetDate);
        renderCalendar();
        updateDetailPanel(selectedDate);
    });

    // Checkbox Listeners
    [checkThien, checkYoga, checkPushup].forEach(checkbox => {
        checkbox.addEventListener('change', handleCheckChange);
    });

    // Note Listener
    dailyNote.addEventListener('input', (e) => {
        const dateStr = formatDate(selectedDate);
        if (!habitData[dateStr]) {
            habitData[dateStr] = { thien: false, yoga: false, pushup: false, note: '' };
        }
        habitData[dateStr].note = e.target.value;
        
        // Clean up if all empty
        if (!habitData[dateStr].thien && !habitData[dateStr].yoga && !habitData[dateStr].pushup && !habitData[dateStr].note.trim()) {
            delete habitData[dateStr]; // Nếu đang xóa khỏi object
        }
        
        // Push object Lên Firebase (thay thế LocalStorage)
        database.ref('habitTrackerData').set(habitData);
        // Lưu ý: Không cần gọi renderCalendar() ở đây nữa vì sự kiện 'value' từ Firebase sẽ tự động fire và gọi hàm đó!
    });
    
    // Tab Listeners
    tabBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            tabBtns.forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            updateStats(e.target.dataset.range);
        });
    });

    // Language Toggle Listener
    btnLangToggle.addEventListener('click', () => {
        const nextLang = currentLang === 'vi' ? 'en' : 'vi';
        switchLanguage(nextLang);
    });
}

function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('calendarLang', lang);
    applyLanguage(lang);
    
    // Update button visual
    flagIcon.src = lang === 'vi' ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
    flagIcon.alt = lang.toUpperCase();
    
    // Re-render UI text based on date
    renderCalendar();
    updateDetailPanel(selectedDate);
}

function applyLanguage(lang) {
    const dict = i18n[lang];
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (dict[key]) {
            el.textContent = dict[key];
        }
    });

    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (dict[key]) {
            el.placeholder = dict[key];
        }
    });
}

// Format Date as YYYY-MM-DD
function formatDate(date) {
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [year, month, day].join('-');
}

// Get Lunar Date String
function getLunarInfo(year, month, day) {
    try {
        if (typeof Solar !== 'undefined') {
            const solar = Solar.fromYmd(year, month, day);
            const lunar = solar.getLunar();
            return `${lunar.getDay()}/${lunar.getMonth()}`;
        }
    } catch (e) {
        console.warn("Lunar logic missing or error");
    }
    return '';
}

// Render the calendar grid
function renderCalendar() {
    calendarGrid.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Using currentLang for Month Text
    const monthPrefix = i18n[currentLang].monthName;
    if (currentLang === 'vi') {
        currentMonthYear.textContent = `${monthPrefix} ${month + 1}, ${year}`;
    } else {
        // Example EN: Month 10, 2023 -> October, 2023 (or simpler: Month 10)
        const enMonths = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
        currentMonthYear.textContent = `${enMonths[month]} ${year}`;
    }
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells for the start of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty');
        calendarGrid.appendChild(emptyCell);
    }
    
    const todayStr = formatDate(new Date());
    const selectedStr = formatDate(selectedDate);
    
    // Day cells
    for (let i = 1; i <= daysInMonth; i++) {
        const cellDate = new Date(year, month, i);
        const cellDateStr = formatDate(cellDate);
        
        const cell = document.createElement('div');
        cell.classList.add('day-cell');
        
        if (cellDateStr === todayStr) {
            cell.classList.add('today');
        }
        
        if (cellDateStr === selectedStr) {
            cell.classList.add('active-day');
        }
        
        // Solar number
        const solarSpan = document.createElement('span');
        solarSpan.classList.add('solar-num');
        solarSpan.textContent = i;
        
        // Lunar number
        const lunarSpan = document.createElement('span');
        lunarSpan.classList.add('lunar-num');
        const lunarStr = getLunarInfo(year, month + 1, i);
        lunarSpan.textContent = lunarStr;
        
        // Habit Dots
        const dotsDiv = document.createElement('div');
        dotsDiv.classList.add('habit-dots');
        
        const dayData = habitData[cellDateStr] || {};
        
        if (dayData.thien) {
            const dot = document.createElement('div');
            dot.classList.add('dot', 'thien', 'active');
            dotsDiv.appendChild(dot);
        }
        if (dayData.yoga) {
            const dot = document.createElement('div');
            dot.classList.add('dot', 'yoga', 'active');
            dotsDiv.appendChild(dot);
        }
        if (dayData.pushup) {
            const dot = document.createElement('div');
            dot.classList.add('dot', 'pushup', 'active');
            dotsDiv.appendChild(dot);
        }
        
        // Note Indicator
        if (dayData.note && dayData.note.trim() !== '') {
            const noteIcon = document.createElement('i');
            noteIcon.classList.add('fa-solid', 'fa-pen', 'note-indicator');
            cell.appendChild(noteIcon);
        }
        
        cell.appendChild(solarSpan);
        cell.appendChild(lunarSpan);
        cell.appendChild(dotsDiv);
        
        cell.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            document.querySelectorAll('.day-cell').forEach(c => c.classList.remove('active-day'));
            cell.classList.add('active-day');
            updateDetailPanel(selectedDate);
        });
        
        calendarGrid.appendChild(cell);
    }
}

// Helper to get month name for display
function getMonthName(monthIndex, lang) {
    if (lang === 'vi') {
        return `Tháng ${monthIndex + 1}`;
    } else {
        const enMonths = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        return enMonths[monthIndex];
    }
}

// Helper to get day names array
function getDayNameArray(lang) {
    return i18n[lang].dayNames;
}

// Update Right Panel for Selected Date
function updateDetailPanel(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayIndex = date.getDay();
    
    // Đồng bộ ô Nhập ngày (đã format yyyy-mm-dd sẵn)
    jumpDateInput.value = formatDate(date);

    displayDayName.textContent = getDayNameArray(currentLang)[dayIndex];
    displayDate.textContent = day;
    displayMonthYear.textContent = getMonthName(month, currentLang) + ', ' + year;
    displayLunarDate.textContent = getLunarInfo(year, month + 1, day);
    
    const dateStr = formatDate(date);
    const dayData = habitData[dateStr] || { thien: false, yoga: false, pushup: false, note: '' };
    
    checkThien.checked = dayData.thien;
    checkYoga.checked = dayData.yoga;
    checkPushup.checked = dayData.pushup;
    dailyNote.value = dayData.note || '';
}

// Handle Checkbox Changes
function handleCheckChange() {
    const dateStr = formatDate(selectedDate);
    
    if (!habitData[dateStr]) {
        habitData[dateStr] = { thien: false, yoga: false, pushup: false, note: '' };
    }
    
    habitData[dateStr].thien = checkThien.checked;
    habitData[dateStr].yoga = checkYoga.checked;
    habitData[dateStr].pushup = checkPushup.checked;
    
    // Clean up if all false to save space
    if (!habitData[dateStr].thien && !habitData[dateStr].yoga && !habitData[dateStr].pushup && !habitData[dateStr].note.trim()) {
        delete habitData[dateStr];
    }
    
    // Đẩy Dữ liệu lên Cloud Database
    database.ref('habitTrackerData').set(habitData);
    // (RenderCalendar và updateStats sẽ được Firebase 'value' event lo lắng tự động kích hoạt)
}

// Utility: get ISO week number (1-52)
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
}

// Calculate Statistics
function updateStats(range) {
    let thienCount = 0;
    let yogaCount = 0;
    let pushupCount = 0;
    
    const activeDate = selectedDate; 
    const targetWeek = getWeekNumber(activeDate);
    
    for (const [dateStr, data] of Object.entries(habitData)) {
        const d = new Date(dateStr);
        let inRange = false;
        
        if (range === 'week') {
            const w = getWeekNumber(d);
            inRange = (w[0] === targetWeek[0] && w[1] === targetWeek[1]);
        } else if (range === 'month') {
            inRange = (d.getMonth() === activeDate.getMonth() && d.getFullYear() === activeDate.getFullYear());
        } else if (range === 'year') {
            inRange = (d.getFullYear() === activeDate.getFullYear());
        }
        
        if (inRange) {
            if (data.thien) thienCount++;
            if (data.yoga) yogaCount++;
            if (data.pushup) pushupCount++;
        }
    }
    
    // Animate numbers up
    animateValue(statThien, parseInt(statThien.textContent), thienCount, 300);
    animateValue(statYoga, parseInt(statYoga.textContent), yogaCount, 300);
    animateValue(statPushup, parseInt(statPushup.textContent), pushupCount, 300);
}

function animateValue(obj, start, end, duration) {
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}

// Initial Call (wait for lunar JS if slow)
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(init, 100); 
});
