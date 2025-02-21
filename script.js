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
let categories = JSON.parse(localStorage.getItem('categories')) || [
    { id: 1, name: 'Еда', emoji: '🍽️', value: 'еда', color: '#FF6384' },
    { id: 2, name: 'Транспорт', emoji: '🚌', value: 'транспорт', color: '#36A2EB' },
    { id: 3, name: 'Развлечения', emoji: '🎮', value: 'развлечения', color: '#FFCE56' },
    { id: 4, name: 'Школа', emoji: '📚', value: 'школа', color: '#4BC0C0' },
    { id: 5, name: 'Другое', emoji: '📦', value: 'другое', color: '#9966FF' }
];

// Проверка и сброс прогресса привычек
function resetHabitsProgress() {
    const today = new Date().toISOString().split('T')[0];
    const lastResetDate = localStorage.getItem('lastResetDate');
    
    if (lastResetDate !== today) {
        habits = habits.map(habit => {
            // Проверяем, был ли достигнут прогресс вчера
            const wasCompletedYesterday = habit.progress >= habit.frequency;
            
            // Обновляем серию
            if (wasCompletedYesterday) {
                habit.streak = (habit.streak || 0) + 1;
                habit.lastCompletedDate = lastResetDate;
            } else {
                habit.streak = 0;
            }
            
            return {
                ...habit,
                progress: 0,
                date: today
            };
        });
        
        localStorage.setItem('habits', JSON.stringify(habits));
        localStorage.setItem('lastResetDate', today);
        
        // Показываем уведомление
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = 'Прогресс привычек обнулён для нового дня';
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
        
        renderHabits();
    }
}

// Вызываем функцию при загрузке страницы
resetHabitsProgress();

// Проверяем каждые 5 минут вместо каждой минуты для оптимизации
setInterval(resetHabitsProgress, 300000);

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
        streak: 0,
        lastCompletedDate: null,
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
                <p>Серия: ${habit.streak || 0} дней подряд 🔥</p>
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
    // Учитываем часовой пояс, добавляя смещение
    const date = new Date(selectedDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const formattedDate = date.toISOString().split('T')[0];
    
    switch (updateDateTarget) {
        case 'analysis-start':
            analysisStartDate.value = formattedDate;
            analysisStartSelectedDate = new Date(selectedDate);
            break;
        case 'analysis-end':
            analysisEndDate.value = formattedDate;
            analysisEndSelectedDate = new Date(selectedDate);
            break;
        default:
            const dateInput = document.getElementById('expense-date');
            dateInput.value = formattedDate;
    }
    
    if (updateDateTarget.startsWith('analysis')) {
        updateAnalysis();
    }
}

// Элементы управления категориями
const categoriesModal = document.getElementById('categoriesModal');
const manageCategoriesBtn = document.getElementById('manageCategoriesBtn');
const closeCategoriesModal = document.getElementById('closeCategoriesModal');
const categoryForm = document.getElementById('category-form');
const categoriesList = document.getElementById('categories-list');
const categoryColor = document.getElementById('category-color');
const randomColorBtn = document.getElementById('random-color');
const categorySubmit = document.getElementById('category-submit');
const categoryActionText = document.getElementById('category-action-text');
const categoryCancel = document.getElementById('category-cancel');

// Переменная для хранения ID редактируемой категории
let editingCategoryId = null;

// Функция сохранения категорий
function saveCategories() {
    localStorage.setItem('categories', JSON.stringify(categories));
    updateCategorySelects();
}

// Функция обновления списков выбора категорий
function updateCategorySelects() {
    const selects = [
        document.getElementById('expense-type'),
        document.getElementById('expense-filter'),
        document.getElementById('analysis-category')
    ];

    selects.forEach(select => {
        const currentValue = select.value;
        select.innerHTML = '';
        
        // Добавляем опцию "Все категории" только для фильтра
        if (select.id === 'expense-filter') {
            select.innerHTML = '<option value="все">🔍 Все категории</option>';
        } else {
            select.innerHTML = '<option value="">Выберите категорию</option>';
        }

        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category.value;
            option.textContent = `${category.emoji} ${category.name}`;
            select.appendChild(option);
        });

        // Восстанавливаем выбранное значение
        if (categories.some(cat => cat.value === currentValue)) {
            select.value = currentValue;
        }
    });
    
    updateChart();
}

// Функция генерации случайного цвета
function getRandomColor() {
    const letters = '0123456789ABCDEF';
    let color = '#';
    for (let i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

// Обработчик для кнопки случайного цвета
randomColorBtn.addEventListener('click', () => {
    categoryColor.value = getRandomColor();
});

// Функция отображения категорий
function renderCategories() {
    categoriesList.innerHTML = '';
    
    categories.forEach(category => {
        const categoryElement = document.createElement('div');
        categoryElement.className = 'category-item';
        if (editingCategoryId === category.id) {
            categoryElement.classList.add('editing');
        }
        
        categoryElement.innerHTML = `
            <div class="category-info">
                <span class="color-indicator" style="background-color: ${category.color}"></span>
                <span class="category-emoji">${category.emoji}</span>
                <span>${category.name}</span>
            </div>
            <div class="buttons">
                <button class="edit-btn" onclick="startEditCategory(${category.id})">
                    <span class="icon">✏️</span>
                </button>
                <button class="delete-btn" onclick="confirmDeleteCategory(${category.id}, '${category.name}')">
                    <span class="icon">🗑️</span>
                </button>
            </div>
        `;
        
        categoriesList.appendChild(categoryElement);
    });
}

// Функция начала редактирования категории
function startEditCategory(id) {
    const category = categories.find(cat => cat.id === id);
    if (!category) return;
    
    editingCategoryId = id;
    document.getElementById('category-name').value = category.name;
    document.getElementById('category-emoji').value = category.emoji;
    document.getElementById('category-color').value = category.color;
    categoryActionText.textContent = 'Сохранить изменения';
    categoryCancel.style.display = 'flex';
    renderCategories();
}

// Функция отмены редактирования
function cancelEdit() {
    editingCategoryId = null;
    categoryForm.reset();
    categoryActionText.textContent = 'Добавить категорию';
    categoryCancel.style.display = 'none';
    renderCategories();
}

// Обновляем обработчик формы добавления/редактирования категории
categoryForm.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const name = document.getElementById('category-name').value;
    const emoji = document.getElementById('category-emoji').value;
    const color = document.getElementById('category-color').value;
    const value = name.toLowerCase();
    
    if (editingCategoryId) {
        // Режим редактирования
        const categoryIndex = categories.findIndex(cat => cat.id === editingCategoryId);
        if (categoryIndex === -1) return;
        
        // Проверяем, не занято ли новое имя другой категорией
        if (categories.some(cat => cat.value === value && cat.id !== editingCategoryId)) {
            showModal('Категория с таким названием уже существует.');
            return;
        }
        
        // Проверяем, используется ли категория
        const oldValue = categories[categoryIndex].value;
        const isUsed = expenses.some(expense => expense.type === oldValue);
        
        // Обновляем категорию
        categories[categoryIndex] = {
            ...categories[categoryIndex],
            name,
            emoji,
            color,
            value
        };
        
        // Если категория используется, обновляем все расходы с этой категорией
        if (isUsed) {
            expenses = expenses.map(expense => {
                if (expense.type === oldValue) {
                    return { ...expense, type: value };
                }
                return expense;
            });
            localStorage.setItem('expenses', JSON.stringify(expenses));
        }
        
        cancelEdit();
    } else {
        // Режим добавления
        if (categories.some(cat => cat.value === value)) {
            showModal('Категория с таким названием уже существует.');
            return;
        }
        
        const category = {
            id: Date.now(),
            name,
            emoji,
            color,
            value
        };
        
        categories.push(category);
    }
    
    saveCategories();
    renderCategories();
    categoryForm.reset();
    categoryColor.value = getRandomColor();
    
    // Показываем уведомление
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.style.backgroundColor = 'var(--success-color)';
    notification.textContent = editingCategoryId ? 'Категория обновлена' : 'Категория добавлена';
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
});

// Добавляем обработчик для кнопки отмены
categoryCancel.addEventListener('click', cancelEdit);

// Функция подтверждения удаления категории
function confirmDeleteCategory(id, name) {
    // Проверяем, используется ли категория
    const categoryValue = categories.find(cat => cat.id === id)?.value;
    const isUsed = expenses.some(expense => expense.type === categoryValue);
    
    if (isUsed) {
        showModal(`Категория "${name}" не может быть удалена, так как она используется в расходах.`);
        return;
    }
    
    showModal(`Вы уверены, что хотите удалить категорию "${name}"?`, deleteCategory, [id]);
}

// Функция удаления категории
function deleteCategory(id) {
    categories = categories.filter(category => category.id !== id);
    saveCategories();
    renderCategories();
}

// Обработчики событий для модального окна категорий
manageCategoriesBtn.addEventListener('click', () => {
    categoriesModal.style.display = 'flex';
    renderCategories();
});

closeCategoriesModal.addEventListener('click', () => {
    categoriesModal.style.display = 'none';
});

categoriesModal.addEventListener('click', (e) => {
    if (e.target === categoriesModal) {
        categoriesModal.style.display = 'none';
    }
});

// Элементы анализа расходов
const analysisCategory = document.getElementById('analysis-category');
const analysisPeriod = document.getElementById('analysis-period');
const analysisStartDate = document.getElementById('analysis-start-date');
const analysisEndDate = document.getElementById('analysis-end-date');
const analysisSearch = document.getElementById('analysis-search');
const totalAmountElement = document.getElementById('total-amount');
const categoriesAmountsElement = document.getElementById('categories-amounts');
const dateRangeContainer = document.querySelector('.date-range');

// Переменные для календаря анализа
let analysisStartSelectedDate = new Date();
let analysisEndSelectedDate = new Date();

// Открыть календарь при клике на поля даты анализа
analysisStartDate.addEventListener('click', (e) => {
    e.preventDefault();
    selectedDate = analysisStartSelectedDate;
    currentDate = new Date(selectedDate);
    updateDateTarget = 'analysis-start';
    calendarOverlay.style.display = 'flex';
    renderCalendar();
});

analysisEndDate.addEventListener('click', (e) => {
    e.preventDefault();
    selectedDate = analysisEndSelectedDate;
    currentDate = new Date(selectedDate);
    updateDateTarget = 'analysis-end';
    calendarOverlay.style.display = 'flex';
    renderCalendar();
});

// Обновляем функцию updateDateInput для поддержки разных полей даты
let updateDateTarget = 'expense';

function updateDateInput() {
    // Учитываем часовой пояс, добавляя смещение
    const date = new Date(selectedDate);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    const formattedDate = date.toISOString().split('T')[0];
    
    switch (updateDateTarget) {
        case 'analysis-start':
            analysisStartDate.value = formattedDate;
            analysisStartSelectedDate = new Date(selectedDate);
            break;
        case 'analysis-end':
            analysisEndDate.value = formattedDate;
            analysisEndSelectedDate = new Date(selectedDate);
            break;
        default:
            const dateInput = document.getElementById('expense-date');
            dateInput.value = formattedDate;
    }
    
    if (updateDateTarget.startsWith('analysis')) {
        updateAnalysis();
    }
}

// Обновляем обработчик клика на expense-date
document.getElementById('expense-date').addEventListener('click', (e) => {
    e.preventDefault();
    updateDateTarget = 'expense';
    calendarOverlay.style.display = 'flex';
    renderCalendar();
});

// Функция форматирования суммы
function formatAmount(amount) {
    return new Intl.NumberFormat('ru-RU', {
        style: 'currency',
        currency: 'RUB',
        minimumFractionDigits: 2
    }).format(amount);
}

// Обновление списка категорий в анализе
function updateAnalysisCategories() {
    analysisCategory.innerHTML = '<option value="все">🔍 Все категории</option>';
    categories.forEach(category => {
        const option = document.createElement('option');
        option.value = category.value;
        option.textContent = `${category.emoji} ${category.name}`;
        analysisCategory.appendChild(option);
    });
}

// Получение дат для периода
function getDateRange(period) {
    const today = new Date();
    const start = new Date();
    
    switch (period) {
        case 'day':
            start.setHours(0, 0, 0, 0);
            return { start, end: today };
        case 'week':
            start.setDate(today.getDate() - 7);
            return { start, end: today };
        case 'month':
            start.setMonth(today.getMonth() - 1);
            return { start, end: today };
        case 'year':
            start.setFullYear(today.getFullYear() - 1);
            return { start, end: today };
        case 'custom':
            return {
                start: analysisStartDate.value ? new Date(analysisStartDate.value) : null,
                end: analysisEndDate.value ? new Date(analysisEndDate.value) : null
            };
        default:
            return { start: null, end: null };
    }
}

// Фильтрация расходов
function filterExpensesForAnalysis() {
    let filteredExpenses = [...expenses];
    const searchTerm = analysisSearch.value.toLowerCase();
    const selectedCategory = analysisCategory.value;
    const { start, end } = getDateRange(analysisPeriod.value);
    
    // Фильтр по категории
    if (selectedCategory !== 'все') {
        filteredExpenses = filteredExpenses.filter(expense => expense.type === selectedCategory);
    }
    
    // Фильтр по названию
    if (searchTerm) {
        filteredExpenses = filteredExpenses.filter(expense => 
            expense.name.toLowerCase().includes(searchTerm)
        );
    }
    
    // Фильтр по датам
    if (start && end) {
        filteredExpenses = filteredExpenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate >= start && expenseDate <= end;
        });
    }
    
    return filteredExpenses;
}

// Обновление результатов анализа
function updateAnalysis() {
    const filteredExpenses = filterExpensesForAnalysis();
    const totalAmount = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Обновляем общую сумму
    totalAmountElement.textContent = formatAmount(totalAmount);
    
    // Группируем расходы по категориям
    const categoryAmounts = {};
    filteredExpenses.forEach(expense => {
        if (!categoryAmounts[expense.type]) {
            categoryAmounts[expense.type] = 0;
        }
        categoryAmounts[expense.type] += expense.amount;
    });
    
    // Отображаем суммы по категориям
    categoriesAmountsElement.innerHTML = '';
    Object.entries(categoryAmounts).forEach(([type, amount]) => {
        const category = categories.find(cat => cat.value === type);
        if (category) {
            const percentage = ((amount / totalAmount) * 100).toFixed(1);
            const categoryElement = document.createElement('div');
            categoryElement.className = 'category-amount';
            categoryElement.innerHTML = `
                <div class="category-info">
                    <span class="category-emoji">${category.emoji}</span>
                    <span>${category.name}</span>
                </div>
                <div>
                    <span class="amount">${formatAmount(amount)}</span>
                    <span class="percentage">${percentage}%</span>
                </div>
            `;
            categoriesAmountsElement.appendChild(categoryElement);
        }
    });
}

// Обработчики событий для анализа
analysisPeriod.addEventListener('change', () => {
    dateRangeContainer.style.display = 
        analysisPeriod.value === 'custom' ? 'block' : 'none';
    updateAnalysis();
});

[analysisCategory, analysisSearch, analysisStartDate, analysisEndDate].forEach(
    element => element.addEventListener('change', updateAnalysis)
);

analysisSearch.addEventListener('input', updateAnalysis);

// Инициализация анализа
updateAnalysisCategories();
updateAnalysis();

// График расходов
const chartPeriodSelect = document.getElementById('chart-period');
const chartTypeSelect = document.getElementById('chart-type');
const chartLegend = document.getElementById('chart-legend');
const ctx = document.getElementById('expenses-chart').getContext('2d');

// Создаем график
let expensesChart = null;

// Функция получения данных для графика
function getChartData(period, chartType) {
    const today = new Date();
    let startDate = new Date();
    
    switch (period) {
        case 'week':
            startDate.setDate(today.getDate() - 7);
            break;
        case 'month':
            startDate.setMonth(today.getMonth() - 1);
            break;
        case 'year':
            startDate.setFullYear(today.getFullYear() - 1);
            break;
    }
    
    // Фильтруем расходы по периоду
    const filteredExpenses = expenses.filter(expense => {
        const expenseDate = new Date(expense.date);
        return expenseDate >= startDate && expenseDate <= today;
    });

    if (chartType === 'pie') {
        // Для круговой диаграммы группируем данные по категориям
        const categoryTotals = {};
        categories.forEach(category => {
            categoryTotals[category.value] = 0;
        });

        filteredExpenses.forEach(expense => {
            categoryTotals[expense.type] += expense.amount;
        });

        return {
            labels: categories.map(category => `${category.emoji} ${category.name}`),
            datasets: [{
                data: categories.map(category => categoryTotals[category.value]),
                backgroundColor: categories.map(category => category.color),
                borderColor: categories.map(category => category.color),
                borderWidth: 1
            }]
        };
    } else {
        // Для линейного графика и гистограммы группируем по датам и категориям
        const dateExpenses = {};
        const categoryVisibility = {};
        
        categories.forEach(category => {
            categoryVisibility[category.value] = true;
        });
        
        filteredExpenses.forEach(expense => {
            const date = expense.date;
            if (!dateExpenses[date]) {
                dateExpenses[date] = {};
                categories.forEach(category => {
                    dateExpenses[date][category.value] = 0;
                });
            }
            dateExpenses[date][expense.type] += expense.amount;
        });
        
        const sortedDates = Object.keys(dateExpenses).sort();
        
        return {
            labels: sortedDates,
            datasets: categories.map(category => ({
                label: `${category.emoji} ${category.name}`,
                data: sortedDates.map(date => dateExpenses[date][category.value]),
                borderColor: category.color,
                backgroundColor: chartType === 'bar' ? category.color : category.color + '80',
                tension: 0.4,
                hidden: !categoryVisibility[category.value]
            }))
        };
    }
}

// Функция обновления легенды
function updateChartLegend() {
    chartLegend.innerHTML = '';
    
    if (chartTypeSelect.value === 'pie') {
        // Для круговой диаграммы легенда не кликабельная
        categories.forEach((category, index) => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            
            legendItem.innerHTML = `
                <span class="legend-color" style="background: ${category.color}"></span>
                <span>${category.emoji} ${category.name}</span>
            `;
            
            chartLegend.appendChild(legendItem);
        });
    } else {
        // Для других типов графиков - кликабельная легенда
        categories.forEach(category => {
            const legendItem = document.createElement('div');
            legendItem.className = 'legend-item';
            if (!expensesChart.isDatasetVisible(categories.indexOf(category))) {
                legendItem.classList.add('disabled');
            }
            
            legendItem.innerHTML = `
                <span class="legend-color" style="background: ${category.color}"></span>
                <span>${category.emoji} ${category.name}</span>
            `;
            
            legendItem.addEventListener('click', () => {
                const index = categories.indexOf(category);
                const isVisible = expensesChart.isDatasetVisible(index);
                
                expensesChart.setDatasetVisibility(index, !isVisible);
                legendItem.classList.toggle('disabled');
                expensesChart.update();
            });
            
            chartLegend.appendChild(legendItem);
        });
    }
}

// Функция создания/обновления графика
function updateChart() {
    const chartType = chartTypeSelect.value;
    const data = getChartData(chartPeriodSelect.value, chartType);
    
    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: false
            }
        }
    };

    if (chartType !== 'pie') {
        options.interaction = {
            intersect: false,
            mode: 'index'
        };
        options.scales = {
            x: {
                type: 'time',
                time: {
                    unit: chartPeriodSelect.value === 'year' ? 'month' : 'day',
                    displayFormats: {
                        day: 'dd.MM',
                        month: 'MM.yyyy'
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            },
            y: {
                beginAtZero: true,
                ticks: {
                    callback: function(value) {
                        return value.toLocaleString('ru-RU') + ' ₽';
                    }
                },
                grid: {
                    color: 'rgba(0, 0, 0, 0.1)'
                }
            }
        };
    }
    
    if (expensesChart) {
        expensesChart.destroy();
    }

    expensesChart = new Chart(ctx, {
        type: chartType,
        data: data,
        options: options
    });

    updateChartLegend();
}

// Добавляем обработчик изменения типа графика
chartTypeSelect.addEventListener('change', updateChart);

// Обновляем обработчик изменения периода
chartPeriodSelect.addEventListener('change', updateChart);

// Инициализация графика
updateChart();

// Инициализация цвета при загрузке страницы
categoryColor.value = getRandomColor(); 