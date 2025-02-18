// Функционал переключения темы
const themeToggle = document.getElementById('themeToggle');
const body = document.body;

// Загружаем сохранённую тему
const savedTheme = localStorage.getItem('theme');
if (savedTheme === 'dark') {
    body.classList.add('dark-theme');
    themeToggle.textContent = '☀️';
}

// Обработчик переключения темы
themeToggle.addEventListener('click', () => {
    body.classList.toggle('dark-theme');
    
    if (body.classList.contains('dark-theme')) {
        localStorage.setItem('theme', 'dark');
        themeToggle.textContent = '☀️';
    } else {
        localStorage.setItem('theme', 'light');
        themeToggle.textContent = '🌙';
    }
});

// Загрузка данных из localStorage
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let expenses = JSON.parse(localStorage.getItem('expenses')) || [];

// Проверка и сброс прогресса привычек
function resetHabitsProgress() {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== today) {
        habits = habits.map(habit => ({
            ...habit,
            progress: 0,
            date: today
        }));
        
        localStorage.setItem('habits', JSON.stringify(habits));
        localStorage.setItem('lastResetDate', today);
        
        // Обновляем отображение
        renderHabits();
    }
}

// Вызываем функцию при загрузке страницы
resetHabitsProgress();

// Проверяем каждую минуту, не наступил ли новый день
setInterval(resetHabitsProgress, 60000);

// Получение элементов форм
const habitForm = document.getElementById('habit-form');
const expenseForm = document.getElementById('expense-form');
const habitsListDiv = document.getElementById('habits-list');
const expensesListDiv = document.getElementById('expenses-list');

// Элементы модального окна
const modalOverlay = document.getElementById('confirmModal');
const modalMessage = document.getElementById('modalMessage');
const confirmButton = document.getElementById('confirmDelete');
const cancelButton = document.getElementById('cancelDelete');

// Переменные для хранения данных текущего удаления
let currentDeleteFunction = null;
let currentDeleteParams = null;

// Функции для работы с модальным окном
function showModal(message, deleteFunction, params) {
    modalMessage.textContent = message;
    currentDeleteFunction = deleteFunction;
    currentDeleteParams = params;
    modalOverlay.style.display = 'flex';
}

function hideModal() {
    modalOverlay.style.display = 'none';
    currentDeleteFunction = null;
    currentDeleteParams = null;
}

// Обработчики кнопок модального окна
confirmButton.addEventListener('click', () => {
    if (currentDeleteFunction) {
        currentDeleteFunction(...currentDeleteParams);
    }
    hideModal();
});

cancelButton.addEventListener('click', hideModal);

// Обработчик формы привычек
habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const habitName = document.getElementById('habit-name').value;
    const habitFrequency = parseInt(document.getElementById('habit-frequency').value);
    
    const habit = {
        id: Date.now(),
        name: habitName,
        frequency: habitFrequency,
        progress: 0,
        date: new Date().toISOString().split('T')[0]
    };
    
    habits.push(habit);
    saveHabits();
    renderHabits();
    habitForm.reset();
});

// Обработчик формы расходов
expenseForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const expense = {
        id: Date.now(),
        name: document.getElementById('expense-name').value,
        type: document.getElementById('expense-type').value,
        date: document.getElementById('expense-date').value,
        amount: parseFloat(document.getElementById('expense-amount').value)
    };
    
    expenses.push(expense);
    saveExpenses();
    renderExpenses();
    expenseForm.reset();
});

// Функция сохранения привычек
function saveHabits() {
    localStorage.setItem('habits', JSON.stringify(habits));
}

// Функция сохранения расходов
function saveExpenses() {
    localStorage.setItem('expenses', JSON.stringify(expenses));
}

// Функция форматирования даты
function formatDate(dateString) {
    const [year, month, day] = dateString.split('-');
    return `${day}.${month}.${year}`;
}

function updateProgressBar(progressElement, newWidth) {
    progressElement.classList.add('updating');
    progressElement.style.width = `${newWidth}%`;
    
    // Удаляем класс после завершения анимации
    setTimeout(() => {
        progressElement.classList.remove('updating');
    }, 1000);
}

// Функция отображения привычек
function renderHabits() {
    habitsListDiv.innerHTML = '';
    
    habits.forEach(habit => {
        const habitElement = document.createElement('div');
        habitElement.className = 'habit-item';
        habitElement.setAttribute('data-habit-id', habit.id);
        
        const progressPercentage = (habit.progress / habit.frequency) * 100;
        
        habitElement.innerHTML = `
            <div>
                <h3>${habit.name}</h3>
                <p>Цель: ${habit.progress}/${habit.frequency} раз в день</p>
                <div class="progress-bar">
                    <div class="progress" style="width: 0%"></div>
                </div>
            </div>
            <div class="habit-controls">
                <button onclick="incrementHabit(${habit.id})">+</button>
                <button onclick="decrementHabit(${habit.id})">-</button>
                <button onclick="confirmDeleteHabit(${habit.id}, '${habit.name}')">Удалить</button>
            </div>
        `;
        
        habitsListDiv.appendChild(habitElement);
        
        // Анимируем прогресс-бар после добавления в DOM
        const progressBar = habitElement.querySelector('.progress');
        requestAnimationFrame(() => {
            updateProgressBar(progressBar, progressPercentage);
        });
    });
}

// Получаем элементы фильтра и сортировки
const expenseFilter = document.getElementById('expense-filter');
const expenseSort = document.getElementById('expense-sort');

// Добавляем обработчики событий
expenseFilter.addEventListener('change', renderExpenses);
expenseSort.addEventListener('change', renderExpenses);

// Функция фильтрации расходов
function filterExpenses(expenses) {
    const filterValue = expenseFilter.value;
    if (filterValue === 'все') {
        return expenses;
    }
    return expenses.filter(expense => expense.type === filterValue);
}

// Функция сортировки расходов
function sortExpenses(expenses) {
    const sortValue = expenseSort.value;
    return [...expenses].sort((a, b) => {
        switch (sortValue) {
            case 'date-desc':
                return new Date(b.date) - new Date(a.date);
            case 'date-asc':
                return new Date(a.date) - new Date(b.date);
            case 'amount-desc':
                return b.amount - a.amount;
            case 'amount-asc':
                return a.amount - b.amount;
            default:
                return 0;
        }
    });
}

// Обновляем функцию отображения расходов
function renderExpenses() {
    expensesListDiv.innerHTML = '';
    
    let filteredExpenses = filterExpenses(expenses);
    let sortedExpenses = sortExpenses(filteredExpenses);
    
    sortedExpenses.forEach(expense => {
        const expenseElement = document.createElement('div');
        expenseElement.className = 'expense-item';
        
        expenseElement.innerHTML = `
            <div>
                <h3>${expense.name}</h3>
                <p>Категория: ${expense.type}</p>
                <p>Дата: ${formatDate(expense.date)}</p>
                <p>Сумма: ${expense.amount} ₽</p>
            </div>
            <button onclick="confirmDeleteExpense(${expense.id}, '${expense.name}')">Удалить</button>
        `;
        
        expensesListDiv.appendChild(expenseElement);
    });
}

// Функция увеличения прогресса привычки
function incrementHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit && habit.progress < habit.frequency) {
        habit.progress++;
        saveHabits();
        
        // Обновляем только конкретный прогресс-бар
        const habitElement = document.querySelector(`[data-habit-id="${id}"]`);
        if (habitElement) {
            const progressBar = habitElement.querySelector('.progress');
            const progressPercentage = (habit.progress / habit.frequency) * 100;
            updateProgressBar(progressBar, progressPercentage);
            
            // Обновляем текст прогресса
            const progressText = habitElement.querySelector('p');
            progressText.textContent = `Цель: ${habit.progress}/${habit.frequency} раз в день`;
        } else {
            renderHabits();
        }
    }
}

// Функция уменьшения прогресса привычки
function decrementHabit(id) {
    const habit = habits.find(h => h.id === id);
    if (habit && habit.progress > 0) {
        habit.progress--;
        saveHabits();
        
        // Обновляем только конкретный прогресс-бар
        const habitElement = document.querySelector(`[data-habit-id="${id}"]`);
        if (habitElement) {
            const progressBar = habitElement.querySelector('.progress');
            const progressPercentage = (habit.progress / habit.frequency) * 100;
            updateProgressBar(progressBar, progressPercentage);
            
            // Обновляем текст прогресса
            const progressText = habitElement.querySelector('p');
            progressText.textContent = `Цель: ${habit.progress}/${habit.frequency} раз в день`;
        } else {
            renderHabits();
        }
    }
}

// Функции подтверждения удаления
function confirmDeleteHabit(id, name) {
    showModal(`Вы уверены, что хотите удалить привычку "${name}"?`, deleteHabit, [id]);
}

function confirmDeleteExpense(id, name) {
    showModal(`Вы уверены, что хотите удалить расход "${name}"?`, deleteExpense, [id]);
}

// Функция удаления привычки
function deleteHabit(id) {
    habits = habits.filter(habit => habit.id !== id);
    saveHabits();
    renderHabits();
}

// Функция удаления расхода
function deleteExpense(id) {
    expenses = expenses.filter(expense => expense.id !== id);
    saveExpenses();
    renderExpenses();
}

// Инициализация отображения
renderHabits();
renderExpenses();

// Календарь
const calendarOverlay = document.getElementById('calendarOverlay');
const calendarDays = document.getElementById('calendarDays');
const currentMonthElement = document.getElementById('currentMonth');
const currentYearElement = document.getElementById('currentYear');
const prevMonthBtn = document.getElementById('prevMonth');
const nextMonthBtn = document.getElementById('nextMonth');
const todayBtn = document.getElementById('todayBtn');
const clearBtn = document.getElementById('clearBtn');

const months = [
    'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
    'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
];

let currentDate = new Date();
let selectedDate = new Date();

// Открыть календарь при клике на поле даты
document.getElementById('expense-date').addEventListener('click', (e) => {
    e.preventDefault();
    calendarOverlay.style.display = 'flex';
    renderCalendar();
});

// Закрыть календарь при клике вне его
calendarOverlay.addEventListener('click', (e) => {
    if (e.target === calendarOverlay) {
        calendarOverlay.style.display = 'none';
    }
});

// Обработчики навигации
prevMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() + 1);
    renderCalendar();
});

nextMonthBtn.addEventListener('click', () => {
    currentDate.setMonth(currentDate.getMonth() - 1);
    renderCalendar();
});

todayBtn.addEventListener('click', () => {
    currentDate = new Date();
    selectedDate = new Date();
    renderCalendar();
    updateDateInput();
});

// Обработчик для кнопки Очистить
clearBtn.addEventListener('click', () => {
    const dateInput = document.getElementById('expense-date');
    dateInput.value = '';
    calendarOverlay.style.display = 'none';
});

// Добавляем обработчик прокрутки колесиком
calendarOverlay.addEventListener('wheel', (e) => {
    e.preventDefault();
    const direction = e.deltaY > 0 ? 1 : -1;
    
    const calendarContent = document.querySelector('.calendar-grid');
    calendarContent.style.transform = `translateY(${direction * 20}px)`;
    calendarContent.style.opacity = '0';
    
    setTimeout(() => {
        currentDate.setMonth(currentDate.getMonth() + direction);
        renderCalendar();
        
        // Сбрасываем трансформацию в противоположном направлении и возвращаем прозрачность
        calendarContent.style.transform = `translateY(${-direction * 20}px)`;
        calendarContent.style.opacity = '1';
        
        // Плавно возвращаем в исходное положение
        requestAnimationFrame(() => {
            calendarContent.style.transform = 'translateY(0)';
        });
    }, 200);
});

function renderCalendar() {
    const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
    
    // Обновляем заголовок с анимацией
    const monthYear = document.querySelector('.month-year');
    monthYear.style.transform = 'translateY(-10px)';
    monthYear.style.opacity = '0';
    
    setTimeout(() => {
        currentMonthElement.textContent = months[currentDate.getMonth()];
        currentYearElement.textContent = currentDate.getFullYear();
        
        monthYear.style.transform = 'translateY(0)';
        monthYear.style.opacity = '1';
    }, 100);

    // Остальной код renderCalendar остается без изменений
    calendarDays.innerHTML = '';
    
    let firstDayIndex = firstDay.getDay() || 7;
    firstDayIndex--;
    
    const prevLastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);
    for (let i = firstDayIndex - 1; i >= 0; i--) {
        const dayElement = createDayElement(prevLastDay.getDate() - i, 'other-month');
        calendarDays.appendChild(dayElement);
    }
    
    for (let day = 1; day <= lastDay.getDate(); day++) {
        const isToday = isCurrentDay(day);
        const dayElement = createDayElement(day, isToday ? 'today' : '');
        calendarDays.appendChild(dayElement);
    }
    
    const remainingDays = 42 - calendarDays.children.length;
    for (let day = 1; day <= remainingDays; day++) {
        const dayElement = createDayElement(day, 'other-month');
        calendarDays.appendChild(dayElement);
    }
}

function createDayElement(day, className = '') {
    const dayElement = document.createElement('div');
    dayElement.className = `day ${className}`;
    dayElement.textContent = day;
    
    dayElement.addEventListener('click', () => {
        if (!dayElement.classList.contains('other-month')) {
            selectedDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
            updateDateInput();
            calendarOverlay.style.display = 'none';
        }
    });
    
    return dayElement;
}

function isCurrentDay(day) {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
}

function updateDateInput() {
    const dateInput = document.getElementById('expense-date');
    const formattedDate = selectedDate.toISOString().split('T')[0];
    dateInput.value = formattedDate;
} 