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

// Mảng Cấu Hình Ngôn Ngữ Bổ sung cho settingsModal
const i18n = {
    vi: {
        title: "Lịch Tập Luyện Cá Nhân",
        todayBtn: "Hôm nay",
        lunarText: "Âm lịch: ",
        habitsTitle: "Thói Quen Mỗi Ngày",
        habitsSub: "Đánh dấu khi bạn hoàn thành",
        statsTitle: "Thống Kê Tiến Độ",
        notesTitle: "Ghi chú",
        notesPlaceholder: "Nhập ghi chú cho ngày này...",
        tabWeek: "Tuần",
        tabMonth: "Tháng",
        tabYear: "Năm",
        monthName: "Tháng",
        dayNames: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
        dayNamesFull: ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'],
        settingsTitle: "Cài đặt Hoạt động",
        settingsWarning: "* Lưu ý: Đổi tên / Xóa hoạt động cũ có thể làm lệch dữ liệu thống kê cũ.",
        saveBtn: "Lưu & Áp Dụng",
        quickAddPlaceholder: "Thêm hoạt động..."
    },
    en: {
        title: "Personal Training Calendar",
        todayBtn: "Today",
        lunarText: "Lunar: ",
        habitsTitle: "Daily Habits",
        habitsSub: "Check when completed",
        statsTitle: "Progress Stats",
        notesTitle: "Notes",
        notesPlaceholder: "Enter notes for this day...",
        tabWeek: "Week",
        tabMonth: "Month",
        tabYear: "Year",
        monthName: "Month",
        dayNames: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        dayNamesFull: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
        settingsTitle: "Activity Settings",
        settingsWarning: "* Note: Renaming or deleting old activities might affect previous statistics.",
        saveBtn: "Save & Apply",
        quickAddPlaceholder: "Add habit..."
    }
};

// State Manager
let currentDate = new Date();
let selectedDate = new Date();
let habitData = {}; 
let currentLang = localStorage.getItem('calendarLang') || 'vi';

// Cấu hình Hoạt động Mặc định (Sẽ bị ghi đè bởi Firebase nếu có)
let activityConfig = [
    { id: 'act_1', nameVi: 'Thiền', nameEn: 'Meditation', color: '#10b981', icon: 'fa-om' },
    { id: 'act_2', nameVi: 'Yoga', nameEn: 'Yoga', color: '#8b5cf6', icon: 'fa-person-praying' },
    { id: 'act_3', nameVi: 'Push up', nameEn: 'Push up', color: '#f59e0b', icon: 'fa-dumbbell' }
];

// Setting Modal Elements
const btnSettings = document.getElementById('btnSettings');
const settingsModal = document.getElementById('settingsModal');
const closeModal = document.getElementById('closeModal');
const btnAddActivity = document.getElementById('btnAddActivity');
const btnSaveConfig = document.getElementById('btnSaveConfig');
const activityListEl = document.getElementById('activityList');

// Dynamic Containers
const dynamicHabitList = document.getElementById('dynamicHabitList');
const dynamicStatsGrid = document.getElementById('dynamicStatsGrid');
const weekdaysGrid = document.getElementById('weekdaysGrid');

// Quick Add / Quick Edit Elements
const quickAddInput = document.getElementById('quickAddInput');
const btnQuickAdd = document.getElementById('btnQuickAdd');
const btnToggleEdit = document.getElementById('btnToggleEdit');

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

// Initialize App
function init() {
    flagIcon.src = currentLang === 'vi' ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
    flagIcon.alt = currentLang.toUpperCase();
    applyLanguage(currentLang);
    
    // LẮNG NGHE DATA TỪ FIREBASE ĐÁM MÂY (Realtime Sync)
    database.ref('/').on('value', (snapshot) => {
        const data = snapshot.val() || {};
        
        if (data.userConfig && data.userConfig.activities) {
            activityConfig = data.userConfig.activities;
        }
        
        habitData = data.habitTrackerData || {};
        
        // Re-render mọi thứ khi có data
        renderDynamicLayout();
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

    // Delegated Checkbox Event cho Dynamic Habit List
    dynamicHabitList.addEventListener('change', (e) => {
        if (e.target.tagName === 'INPUT' && e.target.type === 'checkbox') {
            handleDynamicCheckChange(e.target.dataset.id, e.target.checked);
            renderCalendar(); // Ép render lịch ngay lập tức để hiện Dấu Chấm
            updateStats(document.querySelector('.tab-btn.active').dataset.range); // Ép update thống kê
        }
    });

    // Delegated Quick Delete Event cho Dynamic Habit List
    dynamicHabitList.addEventListener('click', (e) => {
        let btn = e.target.closest('.quick-delete-act-btn');
        if (btn) {
            const actId = btn.dataset.id;
            if(confirm(currentLang === 'vi' ? 'Bạn có chắc muốn xóa hoạt động này?' : 'Are you sure you want to delete this habit?')) {
                activityConfig = activityConfig.filter(a => a.id !== actId);
                saveConfigToCloud();
            }
        }
    });

    // Quick Add Listeners
    if(btnQuickAdd) btnQuickAdd.addEventListener('click', handleQuickAdd);
    if(quickAddInput) quickAddInput.addEventListener('keypress', (e) => {
        if(e.key === 'Enter') handleQuickAdd();
    });
    if(btnToggleEdit) btnToggleEdit.addEventListener('click', () => {
        dynamicHabitList.classList.toggle('edit-mode');
    });

// Note Listener
    const dailyNote = document.getElementById('dailyNote');
    dailyNote.addEventListener('input', (e) => {
        const dateStr = formatDate(selectedDate);
        if (!habitData[dateStr]) {
            habitData[dateStr] = { note: '' };
        }
        habitData[dateStr].note = e.target.value;
        
        // Clean up
        if (checkIfEmptyData(habitData[dateStr])) {
            delete habitData[dateStr]; 
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
    
    // Modal Listeners
    btnSettings.addEventListener('click', openSettingsModal);
    closeModal.addEventListener('click', () => settingsModal.classList.remove('show'));
    btnAddActivity.addEventListener('click', handleAddNewActivity);
    btnSaveConfig.addEventListener('click', saveConfigToCloud);
    
    // Activity List Xóa Listener (Delegation)
    activityListEl.addEventListener('click', (e) => {
        let btn = e.target.closest('.btn-delete-act');
        if (btn) {
            const actId = btn.dataset.id;
            activityConfig = activityConfig.filter(a => a.id !== actId);
            renderSettingsActivityList();
        }
    });
}

function checkIfEmptyData(dayData) {
    let isEmpty = true;
    for (const key in dayData) {
        if (key === 'note' && dayData.note.trim() !== '') isEmpty = false;
        if (key !== 'note' && dayData[key] === true) isEmpty = false;
    }
    return isEmpty;
}

function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    localStorage.setItem('calendarLang', lang);
    applyLanguage(lang);
    
    flagIcon.src = lang === 'vi' ? 'https://flagcdn.com/w40/vn.png' : 'https://flagcdn.com/w40/gb.png';
    flagIcon.alt = lang.toUpperCase();
    
    renderDynamicLayout();
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

// Render UI Components Dynamic (Layout)
function renderDynamicLayout() {
    const langIdx = currentLang === 'vi' ? 'nameVi' : 'nameEn';
    
    // 1. Render Weekdays T2 T3 T4
    weekdaysGrid.innerHTML = '';
    const shortNames = i18n[currentLang].dayNames;
    shortNames.forEach(d => {
        const div = document.createElement('div');
        div.textContent = d;
        weekdaysGrid.appendChild(div);
    });

    // 2. Render Habit List HTML (Right Panel)
    dynamicHabitList.innerHTML = '';
    activityConfig.forEach(act => {
        const hHTML = `
            <div class="habit-item-container">
                <label class="habit-item">
                    <input type="checkbox" data-id="${act.id}" value="${act.id}">
                    <span class="checkmark" style="border-color: ${act.color}"></span>
                    <div class="habit-info">
                        <i class="fa-solid ${act.icon} habit-icon" style="color: ${act.color}"></i>
                        <span>${act[langIdx]}</span>
                    </div>
                </label>
                <button class="quick-delete-act-btn" data-id="${act.id}" title="Xóa"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        dynamicHabitList.innerHTML += hHTML;
    });
    
    // Fix checkmark style injection for pseudo element isn't easy, we use JS logic to border color mapping.
    
    // 3. Render Stats Grid
    dynamicStatsGrid.innerHTML = '';
    activityConfig.forEach(act => {
        const sHTML = `
            <div class="stat-item">
                <div class="stat-icon" style="color: ${act.color}; background: rgba(255,255,255,0.1)">
                    <i class="fa-solid ${act.icon}"></i>
                </div>
                <div class="stat-details">
                    <span class="stat-label">${act[langIdx]}</span>
                    <span class="stat-value" id="stat_${act.id}">0</span>
                </div>
            </div>
        `;
        dynamicStatsGrid.innerHTML += sHTML;
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
        
        // Dynamic Habit Icons
        const iconsDiv = document.createElement('div');
        iconsDiv.classList.add('habit-icons-grid');
        
        const dayData = habitData[cellDateStr] || {};
        
        activityConfig.forEach(act => {
            if (dayData[act.id]) {
                const iconContainer = document.createElement('div');
                iconContainer.classList.add('habit-icon-day');
                
                const icon = document.createElement('i');
                icon.className = `fa-solid ${act.icon}`;
                icon.style.color = act.color;
                
                iconContainer.appendChild(icon);
                iconsDiv.appendChild(iconContainer);
            }
        });
        
        // Note Indicator
        if (dayData.note && dayData.note.trim() !== '') {
            const noteIcon = document.createElement('i');
            noteIcon.classList.add('fa-solid', 'fa-pen', 'note-indicator');
            cell.appendChild(noteIcon);
        }
        
        cell.appendChild(solarSpan);
        cell.appendChild(lunarSpan);
        cell.appendChild(iconsDiv);
        
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

// Helper to get day names array (Full names for detail panel)
function getDayNameArrayFull(lang) {
    return i18n[lang].dayNamesFull;
}

// Update Right Panel for Selected Date
function updateDetailPanel(date) {
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();
    const dayIndex = date.getDay();
    
    jumpDateInput.value = formatDate(date);

    displayDayName.textContent = getDayNameArrayFull(currentLang)[dayIndex];
    displayDate.textContent = day;
    displayMonthYear.textContent = getMonthName(month, currentLang) + ', ' + year;
    displayLunarDate.textContent = getLunarInfo(year, month + 1, day);
    
    const dateStr = formatDate(date);
    const dayData = habitData[dateStr] || { note: '' };
    
    // Set checkbox values dynamically
    const allCheckboxes = dynamicHabitList.querySelectorAll('input[type="checkbox"]');
    allCheckboxes.forEach(cb => {
        const actId = cb.dataset.id;
        cb.checked = !!dayData[actId]; 
        
        // CSS Style trick for dynamically colored checkmark after checked
        // Since we can't easily style pseudo inputs with inline JS color mapping, 
        // we map color on the span itself.
        const checkmark = cb.nextElementSibling;
        const actObj = activityConfig.find(a => a.id === actId);
        if (cb.checked) {
            checkmark.style.backgroundColor = actObj.color;
            checkmark.style.borderColor = actObj.color;
        } else {
            checkmark.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            checkmark.style.borderColor = 'var(--text-secondary)';
        }
    });
    
    const dailyNote = document.getElementById('dailyNote');
    dailyNote.value = dayData.note || '';
}

// Handle Dynamic Checkbox Changes
function handleDynamicCheckChange(actId, isChecked) {
    const dateStr = formatDate(selectedDate);
    
    if (!habitData[dateStr]) {
        habitData[dateStr] = { note: '' };
    }
    
    habitData[dateStr][actId] = isChecked;
    
    if (checkIfEmptyData(habitData[dateStr])) {
        delete habitData[dateStr];
    }
    
    database.ref('habitTrackerData').set(habitData);
    
    // Immediate Visual Update for Checkbox Background
    const cb = document.querySelector(`input[data-id="${actId}"]`);
    if(cb) {
        const checkmark = cb.nextElementSibling;
        const actObj = activityConfig.find(a => a.id === actId);
        if (isChecked) {
            checkmark.style.backgroundColor = actObj.color;
            checkmark.style.borderColor = actObj.color;
        } else {
             checkmark.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
             checkmark.style.borderColor = 'var(--text-secondary)';
        }
    }
}

// Utility: get ISO week number (1-52)
function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7);
    return [d.getUTCFullYear(), weekNo];
}

// Calculate Statistics (Dynamic Array Mapping)
function updateStats(range) {
    const activeDate = selectedDate; 
    const targetWeek = getWeekNumber(activeDate);
    
    // Khởi tạo các biến đếm dựa trên ID dynamic
    const countMap = {};
    activityConfig.forEach(act => {
        countMap[act.id] = 0;
    });
    
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
            activityConfig.forEach(act => {
                if(data[act.id]) {
                     countMap[act.id]++;
                }
            });
        }
    }
    
    // Animate numbers up
    activityConfig.forEach(act => {
        const statEl = document.getElementById(`stat_${act.id}`);
        if(statEl) {
             animateValue(statEl, parseInt(statEl.textContent) || 0, countMap[act.id], 300);
        }
    });
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

/* =====================================
   QUẢN LÝ SETUP HOẠT ĐỘNG (MODAL)
===================================== */
function openSettingsModal() {
    renderSettingsActivityList();
    settingsModal.classList.add('show');
}

function renderSettingsActivityList() {
    activityListEl.innerHTML = '';
    activityConfig.forEach(act => {
        const hHTML = `
            <div class="setting-act-item" style="border-left-color: ${act.color}">
                <div class="act-name-group">
                    <span class="act-name-vi">${act.nameVi}</span>
                    <span class="act-name-en">${act.nameEn}</span>
                </div>
                <button class="btn-delete-act" data-id="${act.id}" title="Xóa"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        activityListEl.innerHTML += hHTML;
    });
}

function handleAddNewActivity() {
    const vi = document.getElementById('newActVi').value.trim();
    const en = document.getElementById('newActEn').value.trim() || vi; // Mặc định EN giống VI nếu rỗng
    const col = document.getElementById('newActColor').value;
    
    if (!vi) {
        alert("Vui lòng nhập tên Hoạt động!");
        return;
    }
    
    // Tạo ID siêu độc nhất
    const newId = 'act_' + Date.now();
    activityConfig.push({
        id: newId,
        nameVi: vi,
        nameEn: en,
        color: col,
        icon: 'fa-star' // Thay vì bắt user chọn icon phức tạp, set sao để cho gọn
    });
    
    // Reset Form Input
    document.getElementById('newActVi').value = '';
    document.getElementById('newActEn').value = '';
    
    renderSettingsActivityList();
}

function handleQuickAdd() {
    const actName = quickAddInput.value.trim();
    if (!actName) return;
    
    const newId = 'act_' + Date.now();
    const randomColors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#f43f5e', '#84cc16'];
    const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    const icons = ['fa-star', 'fa-bolt', 'fa-heart', 'fa-fire', 'fa-check', 'fa-droplet', 'fa-leaf'];
    const randomIcon = icons[Math.floor(Math.random() * icons.length)];
    
    activityConfig.push({
        id: newId,
        nameVi: actName,
        nameEn: actName,
        color: randomColor,
        icon: randomIcon
    });
    
    quickAddInput.value = '';
    saveConfigToCloud();
}

function saveConfigToCloud() {
    // Đẩy dữ liệu Config mới tinh lên Cloud
    database.ref('userConfig').set({ activities: activityConfig }).then(() => {
        // Cập nhật giao diện lập tức
        renderDynamicLayout();
        renderCalendar();
        updateDetailPanel(selectedDate);
        updateStats(document.querySelector('.tab-btn.active').dataset.range);
        
        // Hide Modal
        settingsModal.classList.remove('show');
    }).catch((error) => {
        alert("Lỗi kết nối lưu dữ liệu: " + error);
    });
}
