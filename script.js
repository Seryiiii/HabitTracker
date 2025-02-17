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

// Функция отображения расходов
function renderExpenses() {
    expensesListDiv.innerHTML = '';
    
    expenses.forEach(expense => {
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