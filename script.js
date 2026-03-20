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
        dayNames: ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'],
        dayNamesFull: ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'],
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
        dayNames: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        dayNamesFull: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
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

// Note Listener with Debounce and Auto-Translation
    let noteTimeout;
    const dailyNote = document.getElementById('dailyNote');
    dailyNote.addEventListener('input', (e) => {
        clearTimeout(noteTimeout);
        const dateStr = formatDate(selectedDate);
        if (!habitData[dateStr]) {
            habitData[dateStr] = { note_vi: '', note_en: '' };
        }
        
        // Save to current active language slot immediately
        const text = e.target.value;
        if (currentLang === 'vi') {
            habitData[dateStr].note_vi = text;
        } else {
            habitData[dateStr].note_en = text;
        }

        // Wait 1.5 seconds after they stop typing before auto-translating to the OTHER language
        noteTimeout = setTimeout(async () => {
            if (text.trim() === '') {
                habitData[dateStr].note_vi = '';
                habitData[dateStr].note_en = '';
            } else {
                try {
                    const sourceLang = currentLang;
                    const targetLang = currentLang === 'vi' ? 'en' : 'vi';
                    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${targetLang}&dt=t&q=${encodeURI(text)}`;
                    
                    const res = await fetch(url);
                    const data = await res.json();
                    let translatedText = '';
                    
                    if (data && data[0]) {
                        data[0].forEach(item => {
                            if (item[0]) translatedText += item[0];
                        });
                    }

                    if (targetLang === 'vi') {
                        habitData[dateStr].note_vi = translatedText;
                    } else {
                        habitData[dateStr].note_en = translatedText;
                    }
                } catch (err) {
                    console.error("Translation error:", err);
                    // Fallback to putting the same text if translation fails
                    if (currentLang === 'vi') habitData[dateStr].note_en = text;
                    else habitData[dateStr].note_vi = text;
                }
            }

            // Clean up empty days
            if (checkIfEmptyData(habitData[dateStr])) {
                delete habitData[dateStr]; 
            }
            database.ref('habitTrackerData').set(habitData);
        }, 1500); 
    });
    
// Tab Listeners
    const tabBtns = document.querySelectorAll('.tab-btn');
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
        if ((key === 'note_vi' || key === 'note_en') && dayData[key] && dayData[key].trim() !== '') isEmpty = false;
        if (key !== 'note_vi' && key !== 'note_en' && dayData[key] === true) isEmpty = false;
    }
    return isEmpty;
}

function switchLanguage(lang) {
    if (lang === currentLang) return;
    currentLang = lang;
    
    // Update local storage
    localStorage.setItem('prefLang', lang);
    
    // Update UI Elements
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (i18n[lang][key]) {
            if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
                el.placeholder = i18n[lang][key];
            } else {
                el.textContent = i18n[lang][key];
            }
        }
    });

    // Update Flag Icon
    if (lang === 'vi') {
        flagIcon.src = 'https://flagcdn.com/w40/vn.png';
        flagIcon.alt = 'VN';
    } else {
        flagIcon.src = 'https://flagcdn.com/w40/us.png';
        flagIcon.alt = 'EN';
    }
    
    // Update note content specifically on language switch
    const dateStr = formatDate(selectedDate);
    const dayData = habitData[dateStr] || {};
    const dailyNote = document.getElementById('dailyNote');
    
    if (lang === 'vi') {
        dailyNote.value = dayData.note_vi || dayData.note || ''; 
    } else {
        dailyNote.value = dayData.note_en || dayData.note || '';
    }
    
    // Update dependent components
    renderCalendar();
    updateDetailPanel(selectedDate);
    renderSettingsActivityList();
    const activeTab = document.querySelector('.tab-btn.active');
    if(activeTab) updateStats(activeTab.dataset.range);
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
    // Remove ONLY day cells
    const existingDays = calendarGrid.querySelectorAll('.day-cell');
    existingDays.forEach(cell => cell.remove());
    
    const notesArea = document.getElementById('calendarNotesArea');
    
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
    
    let firstDay = new Date(year, month, 1).getDay();
    firstDay = firstDay === 0 ? 6 : firstDay - 1; // start on Monday
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Empty cells for the start of the month
    for (let i = 0; i < firstDay; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('day-cell', 'empty');
        if (notesArea) calendarGrid.insertBefore(emptyCell, notesArea);
        else calendarGrid.appendChild(emptyCell);
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
                // Support multiple icon classes appropriately
                const iconClasses = act.icon.split(' ');
                if (iconClasses.length > 1) {
                    icon.classList.add(...iconClasses);
                } else {
                    icon.classList.add('fa-solid', act.icon);
                }
                icon.style.color = act.color;
                
                iconContainer.appendChild(icon);
                iconsDiv.appendChild(iconContainer);
            }
        });
        
        // Note Indicator
        const hasNote = dayData.note_vi?.trim() || dayData.note_en?.trim() || dayData.note?.trim();
        if (hasNote) {
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
        
        if (notesArea) calendarGrid.insertBefore(cell, notesArea);
        else calendarGrid.appendChild(cell);
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
    let dayIndex = date.getDay();
    dayIndex = dayIndex === 0 ? 6 : dayIndex - 1; // Map Sun=0 to 6, Mon=1 to 0, etc.
    
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
    
    // Display note based on current language
    if (currentLang === 'vi') {
        dailyNote.value = dayData.note_vi || dayData.note || ''; 
    } else {
        dailyNote.value = dayData.note_en || dayData.note || '';
    }
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

function getSmartActivityConfig(inputStr, lang) {
    const text = inputStr.trim();
    const textLower = text.toLowerCase();
    
    // Always start by assuming the user's input is valid for both languages
    let nameVi = text;
    let nameEn = text; 
    let icon = 'fa-star';
    
    // Mapping dictionary for intelligent ICON and exact translation assignment
    const dict = [
        { keys: ['chạy', 'run', 'jog'], vi: 'Chạy bộ', en: 'Running', icon: 'fa-person-running' },
        { keys: ['bơi', 'swim'], vi: 'Bơi', en: 'Swimming', icon: 'fa-person-swimming' },
        { keys: ['đọc', 'sách', 'read', 'book'], vi: 'Đọc sách', en: 'Reading', icon: 'fa-book' },
        { keys: ['thiền', 'meditat'], vi: 'Thiền', en: 'Meditation', icon: 'fa-om' },
        { keys: ['yoga'], vi: 'Yoga', en: 'Yoga', icon: 'fa-person-praying' },
        { keys: ['tạ', 'gym', 'thể hình', 'đẩy', 'lift', 'weight'], vi: 'Tập Gym', en: 'Gym', icon: 'fa-dumbbell' },
        { keys: ['đạp xe', 'xe đạp', 'bike', 'cycl'], vi: 'Đạp xe', en: 'Cycling', icon: 'fa-person-biking' },
        { keys: ['nước', 'uống', 'water', 'drink'], vi: 'Uống nước', en: 'Drink Water', icon: 'fa-glass-water' },
        { keys: ['ngủ', 'đi ngủ', 'giấc', 'sleep', 'bed'], vi: 'Ngủ đủ giấc', en: 'Sleep', icon: 'fa-bed' },
        { keys: ['học', 'bài', 'study', 'learn'], vi: 'Học tập', en: 'Study', icon: 'fa-graduation-cap' },
        { keys: ['code', 'lập trình', 'program'], vi: 'Lập trình', en: 'Coding', icon: 'fa-code' },
        { keys: ['cầu lông', 'badminton'], vi: 'Cầu lông', en: 'Badminton', icon: 'fa-table-tennis-paddle-ball' },
        { keys: ['bóng đá', 'đá banh', 'soccer', 'football'], vi: 'Bóng đá', en: 'Football', icon: 'fa-futbol' },
        { keys: ['đi bộ', 'walk'], vi: 'Đi bộ', en: 'Walking', icon: 'fa-person-walking' },
        { keys: ['nhảy', 'dance', 'khiêu vũ'], vi: 'Nhảy múa', en: 'Dancing', icon: 'fa-music' },
        { keys: ['thuốc', 'pill', 'medic'], vi: 'Uống thuốc', en: 'Medication', icon: 'fa-pills' },
        { keys: ['ăn', 'eat', 'meal', 'bữa'], vi: 'Ăn uống', en: 'Eat Meal', icon: 'fa-utensils' }
    ];

    let foundExactMatch = false;

    // Check if the user's input exactly or almost exactly matches one of our dictionary keywords
    for (let item of dict) {
        // Find if any key matches exact (allow for minor typing diff like 'chạy bộ' vs 'chạy')
        const isMatch = item.keys.some(k => textLower === k || textLower === item.vi.toLowerCase() || textLower === item.en.toLowerCase());
        
        if (isMatch) {
            // If it's a known exact activity, we apply the translation properly
            if (lang === 'vi') {
                nameVi = text; // Keep exact user casing for their primary language
                nameEn = item.en; // Translate the other
            } else {
                nameEn = text; // Keep exact user casing for their primary language
                nameVi = item.vi; // Translate the other
            }
            icon = item.icon;
            foundExactMatch = true;
            break;
        }
    }
    
    // If not an EXACT match, just search for keywords to grant the Icon, but don't assume we know how to translate complex sentences
    if (!foundExactMatch) {
        for (let item of dict) {
            if (item.keys.some(k => textLower.includes(k))) {
                icon = item.icon; // Just grant the icon
                break;
            }
        }
    }

    return { nameVi, nameEn, icon };
}

function handleQuickAdd() {
    const actNameInput = quickAddInput.value.trim();
    if (!actNameInput) return;
    
    const newId = 'act_' + Date.now();
    const randomColors = ['#10b981', '#8b5cf6', '#f59e0b', '#ef4444', '#3b82f6', '#14b8a6', '#f43f5e', '#84cc16', '#ec4899', '#06b6d4'];
    const randomColor = randomColors[Math.floor(Math.random() * randomColors.length)];
    
    // Smart resolve names & icon by passing the CURRENT APP LANGUAGE
    const smartData = getSmartActivityConfig(actNameInput, currentLang);
    
    activityConfig.push({
        id: newId,
        nameVi: smartData.nameVi,
        nameEn: smartData.nameEn,
        color: randomColor,
        icon: smartData.icon
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
