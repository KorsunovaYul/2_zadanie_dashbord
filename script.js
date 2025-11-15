class SmartDashboard {
    constructor() {
        this.widgets = new Map();
        this.nextWidgetId = 1;
        this.apiKeys = {
            openWeather: '516579591c1c44d19f5ef9e5f0d14502'
        };

        this.init();
    }

    init() {
        this.loadFromStorage();
        this.setupEventListeners();
        this.render();
    }

    setupEventListeners() {
        // Modal controls
        document.getElementById('add-widget-btn').addEventListener('click', () => this.showWidgetsModal());
        document.getElementById('add-first-widget').addEventListener('click', () => this.showWidgetsModal());
        document.querySelector('.close-modal').addEventListener('click', () => this.hideWidgetsModal());

        // Export/Import
        document.getElementById('export-btn').addEventListener('click', () => this.exportConfig());
        document.getElementById('import-btn').addEventListener('click', () => this.triggerImport());
        document.getElementById('import-file').addEventListener('change', (e) => this.importConfig(e));

        // Available widgets
        document.querySelectorAll('.available-widget').forEach(widget => {
            widget.addEventListener('click', (e) => {
                const type = e.currentTarget.dataset.type;
                this.addWidget(type);
                this.hideWidgetsModal();
            });
        });

        // Close modal on backdrop click
        document.getElementById('widgets-modal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) {
                this.hideWidgetsModal();
            }
        });
    }

    showWidgetsModal() {
        document.getElementById('widgets-modal').classList.add('show');
    }

    hideWidgetsModal() {
        document.getElementById('widgets-modal').classList.remove('show');
    }

    addWidget(type, config = {}) {
        const widgetId = `widget-${this.nextWidgetId++}`;
        const widget = {
            id: widgetId,
            type: type,
            config: config,
            data: null
        };

        this.widgets.set(widgetId, widget);
        this.render();
        this.saveToStorage();
        this.loadWidgetData(widgetId);

        this.showNotification('Виджет добавлен');
    }

    removeWidget(widgetId) {
        this.widgets.delete(widgetId);
        this.render();
        this.saveToStorage();
        this.showNotification('Виджет удален');
    }

    updateWidgetConfig(widgetId, newConfig) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            widget.config = { ...widget.config, ...newConfig };
            this.saveToStorage();
            this.loadWidgetData(widgetId);
        }
    }

    render() {
        const grid = document.getElementById('widgets-grid');
        const emptyState = document.getElementById('empty-state');

        if (this.widgets.size === 0) {
            grid.innerHTML = '';
            emptyState.style.display = 'block';
            return;
        }

        emptyState.style.display = 'none';
        grid.innerHTML = '';

        this.widgets.forEach((widget) => {
            const widgetElement = this.createWidgetElement(widget);
            grid.appendChild(widgetElement);
        });

        this.setupDragAndDrop();
    }

    createWidgetElement(widget) {
        const div = document.createElement('div');
        div.className = 'widget';
        div.id = widget.id;
        div.draggable = true;

        const widgetContent = this.getWidgetContent(widget);
        div.innerHTML = `
            <div class="widget-header">
                <div class="widget-title">
                    <i class="${this.getWidgetIcon(widget.type)}"></i>
                    ${this.getWidgetTitle(widget.type)}
                </div>
                <div class="widget-controls">
                    <button class="widget-btn settings-btn" title="Настройки">
                        <i class="fas fa-cog"></i>
                    </button>
                    <button class="widget-btn refresh-btn" title="Обновить">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                    <button class="widget-btn remove-btn" title="Удалить">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
            <div class="widget-content">
                ${widgetContent}
            </div>
        `;

        // Add event listeners
        div.querySelector('.remove-btn').addEventListener('click', () => this.removeWidget(widget.id));
        div.querySelector('.refresh-btn').addEventListener('click', () => this.loadWidgetData(widget.id));
        div.querySelector('.settings-btn').addEventListener('click', () => this.showSettingsModal(widget));

        return div;
    }

    getWidgetContent(widget) {
        if (widget.data === null) {
            return `
                <div class="loading">
                    <div class="spinner"></div>
                    <span>Загрузка...</span>
                </div>
            `;
        }

        if (widget.data.error) {
            return `
                <div class="error-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <p>Ошибка загрузки</p>
                    <button class="btn btn-secondary" onclick="dashboard.loadWidgetData('${widget.id}')">
                        Повторить
                    </button>
                </div>
            `;
        }

        switch (widget.type) {
            case 'weather':
                return this.renderWeatherWidget(widget);
            case 'currency':
                return this.renderCurrencyWidget(widget);
            case 'quote':
                return this.renderQuoteWidget(widget);
            case 'timer':
                return this.renderTimerWidget(widget);
            case 'notes':
                return this.renderNotesWidget(widget);
            case 'fish_tank':
                return this.renderFishTankWidget(widget);
            case 'fish_game':
                return this.renderFishGameWidget(widget);
            case 'treasure_dive':
                return this.renderTreasureDiveWidget(widget);
            default:
                return '<p>Неизвестный тип виджета</p>';
        }
    }

    renderWeatherWidget(widget) {
        const { data } = widget;
        const city = widget.config.city || 'Москва';

        return `
            <div class="weather-content">
                <div class="weather-main">
                    <div class="weather-temp">${Math.round(data.temp)}°</div>
                    <div class="weather-icon">
                        <i class="fas fa-${this.getWeatherIcon(data.condition)}"></i>
                    </div>
                </div>
                <div style="margin-bottom: 1rem;">
                    <strong>${city}</strong>
                    <div style="color: var(--text-secondary); font-size: 0.875rem;">${data.description}</div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <span>Влажность</span>
                        <div class="value">${data.humidity}%</div>
                    </div>
                    <div class="weather-detail">
                        <span>Ветер</span>
                        <div class="value">${data.windSpeed} м/с</div>
                    </div>
                    <div class="weather-detail">
                        <span>Давление</span>
                        <div class="value">${data.pressure} hPa</div>
                    </div>
                    <div class="weather-detail">
                        <span>Ощущается</span>
                        <div class="value">${Math.round(data.feelsLike)}°</div>
                    </div>
                </div>
            </div>
        `;
    }

    renderCurrencyWidget(widget) {
        const { data } = widget;
        const currencies = widget.config.currencies || ['USD', 'EUR'];

        return `
            <div class="currency-list">
                ${currencies.map(currency => {
            const currencyData = data[currency];
            if (!currencyData) return '';

            return `
                        <div class="currency-item">
                            <div class="currency-info">
                                <div class="currency-flag" style="background: #${this.getCurrencyColor(currency)}"></div>
                                <div class="currency-name">${currency}/RUB</div>
                            </div>
                            <div style="text-align: right;">
                                <div class="currency-rate">${currencyData.rate.toFixed(2)}</div>
                                <div class="currency-change ${currencyData.change >= 0 ? 'positive' : 'negative'}">
                                    ${currencyData.change >= 0 ? '+' : ''}${currencyData.change.toFixed(2)}%
                                </div>
                            </div>
                        </div>
                    `;
        }).join('')}
            </div>
        `;
    }

    renderQuoteWidget(widget) {
        const { data } = widget;

        return `
        <div class="quote-content">
            <div class="quote-text">"${data.quote}"</div>
            <div class="quote-author">— ${data.author}</div>
            <div class="quote-controls">
                <button class="btn btn-primary" onclick="dashboard.loadWidgetData('${widget.id}')">
                    <i class="fas fa-redo"></i> Следующая цитата
                </button>
            </div>
        </div>
    `;
    }

    renderTimerWidget(widget) {
        const { data } = widget;
        const isRunning = data.isRunning;
        const mode = data.mode;
        const timeLeft = this.formatTime(data.timeLeft);

        return `
            <div class="timer-content">
                <div class="timer-mode">${mode === 'work' ? 'Работа' : 'Перерыв'}</div>
                <div class="timer-display">${timeLeft}</div>
                <div class="timer-controls">
                    <button class="btn ${isRunning ? 'btn-secondary' : 'btn-primary'}" 
                            onclick="dashboard.toggleTimer('${widget.id}')">
                        <i class="fas fa-${isRunning ? 'pause' : 'play'}"></i>
                        ${isRunning ? 'Пауза' : 'Старт'}
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.resetTimer('${widget.id}')">
                        <i class="fas fa-redo"></i> Сброс
                    </button>
                    <button class="btn btn-secondary" onclick="dashboard.switchTimerMode('${widget.id}')">
                        <i class="fas fa-exchange-alt"></i> Режим
                    </button>
                </div>
            </div>
        `;
    }

    renderNotesWidget(widget) {
        const { data } = widget;

        return `
            <div class="notes-content">
                <div class="note-input">
                    <input type="text" placeholder="Введите заметку..." 
                           onkeypress="if(event.key === 'Enter') dashboard.addNote('${widget.id}', this)">
                    <button class="btn btn-primary" onclick="dashboard.addNote('${widget.id}', this.previousElementSibling)">
                        <i class="fas fa-plus"></i>
                    </button>
                </div>
                <div class="notes-list">
                    ${data.notes.map((note, index) => `
                        <div class="note-item">
                            <div class="note-text">${note}</div>
                            <button class="note-delete" onclick="dashboard.removeNote('${widget.id}', ${index})">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    async loadWidgetData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        // Show loading state
        widget.data = null;
        this.renderWidget(widgetId);

        try {
            let data;
            switch (widget.type) {
                case 'weather':
                    data = await this.fetchWeatherData(widget.config.city);
                    break;
                case 'currency':
                    data = await this.fetchCurrencyData(widget.config.currencies);
                    break;
                case 'quote':
                    data = await this.fetchQuoteData();
                    break;
                case 'timer':
                    data = this.getTimerData(widgetId);
                    break;
                case 'notes':
                    data = this.getNotesData(widgetId);
                    break;
            }

            widget.data = data;
        } catch (error) {
            console.error(`Error loading widget ${widgetId}:`, error);
            widget.data = { error: true, message: error.message };
        }

        this.renderWidget(widgetId);
    }

    async fetchWeatherData(city = 'Moscow') {
        // Using OpenWeatherMap API
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${this.apiKeys.openWeather}&units=metric&lang=ru`
        );

        if (!response.ok) {
            throw new Error('Failed to fetch weather data');
        }

        const data = await response.json();

        return {
            temp: data.main.temp,
            feelsLike: data.main.feels_like,
            humidity: data.main.humidity,
            pressure: data.main.pressure,
            windSpeed: data.wind.speed,
            condition: data.weather[0].main.toLowerCase(),
            description: data.weather[0].description
        };
    }

    async fetchCurrencyData(currencies = ['USD', 'EUR']) {
        try {
            // API Центробанка России - точно работает
            const response = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
            const data = await response.json();

            const result = {};
            currencies.forEach(currency => {
                const currencyData = data.Valute[currency];
                if (currencyData) {
                    result[currency] = {
                        rate: parseFloat(currencyData.Value.toFixed(2)),
                        change: parseFloat((currencyData.Value - currencyData.Previous).toFixed(2))
                    };
                }
            });

            return result;
        } catch (error) {
            console.log('CBR API failed, using mock data');
            return this.getMockCurrencyData(currencies);
        }
    }

    async fetchQuoteData() {
        return new Promise((resolve) => {
            // Создаем callback функцию
            const callbackName = 'jsonp_callback_' + Date.now();
            window[callbackName] = function (data) {
                delete window[callbackName];
                document.body.removeChild(script);

                resolve({
                    quote: data.quoteText,
                    author: data.quoteAuthor || "Неизвестный автор"
                });
            };

            // Создаем script тег для JSONP
            const script = document.createElement('script');
            script.src = `https://api.forismatic.com/api/1.0/?method=getQuote&format=jsonp&lang=ru&jsonp=${callbackName}`;
            document.body.appendChild(script);

            // Таймаут на случай ошибки
            setTimeout(() => {
                if (window[callbackName]) {
                    delete window[callbackName];
                    document.body.removeChild(script);
                    resolve({
                        quote: "ОШИБКА",
                        author: "Таймаут загрузки"
                    });
                }
            }, 5000);
        });
    }

    getTimerData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget.config.timerData) {
            widget.config.timerData = {
                mode: 'work',
                isRunning: false,
                timeLeft: 25 * 60, // 25 minutes in seconds
                workDuration: 25 * 60,
                breakDuration: 5 * 60,
                interval: null
            };
        }
        return widget.config.timerData;
    }

    getNotesData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget.config.notes) {
            widget.config.notes = [];
        }
        return { notes: widget.config.notes };
    }

    // Timer methods
    toggleTimer(widgetId) {
        const data = this.getTimerData(widgetId);

        if (data.isRunning) {
            this.pauseTimer(widgetId);
        } else {
            this.startTimer(widgetId);
        }

        this.renderWidget(widgetId);
    }

    startTimer(widgetId) {
        const data = this.getTimerData(widgetId);
        data.isRunning = true;

        data.interval = setInterval(() => {
            data.timeLeft--;

            if (data.timeLeft <= 0) {
                this.timerComplete(widgetId);
            }

            this.renderWidget(widgetId);
        }, 1000);
    }

    pauseTimer(widgetId) {
        const data = this.getTimerData(widgetId);
        data.isRunning = false;

        if (data.interval) {
            clearInterval(data.interval);
            data.interval = null;
        }
    }

    resetTimer(widgetId) {
        this.pauseTimer(widgetId);
        const data = this.getTimerData(widgetId);
        data.timeLeft = data.mode === 'work' ? data.workDuration : data.breakDuration;
        this.renderWidget(widgetId);
    }

    switchTimerMode(widgetId) {
        const data = this.getTimerData(widgetId);
        this.pauseTimer(widgetId);

        data.mode = data.mode === 'work' ? 'break' : 'work';
        data.timeLeft = data.mode === 'work' ? data.workDuration : data.breakDuration;

        this.renderWidget(widgetId);
    }

    timerComplete(widgetId) {
        this.pauseTimer(widgetId);

        // Show browser notification
        if ('Notification' in window && Notification.permission === 'granted') {
            const data = this.getTimerData(widgetId);
            new Notification(`Таймер завершен!`, {
                body: `Время ${data.mode === 'work' ? 'работы' : 'перерыва'} истекло.`,
                icon: '/favicon.ico'
            });
        }

        // Automatically switch mode
        this.switchTimerMode(widgetId);
        this.startTimer(widgetId);
    }

    // Notes methods
    addNote(widgetId, inputElement) {
        const text = inputElement.value.trim();
        if (!text) return;

        const widget = this.widgets.get(widgetId);
        if (!widget.config.notes) {
            widget.config.notes = [];
        }

        widget.config.notes.unshift(text);
        inputElement.value = '';

        this.saveToStorage();
        this.renderWidget(widgetId);
    }

    // 1. Игра "Ударь рыбку" (Whack-a-Mole стиль)
    renderWhackAFishWidget(widget) {
        const { data } = widget;

        if (data.gameOver) {
            return `
            <div class="whack-game-widget">
                <div class="whack-game">
                    <div class="game-over">
                        <h3>Время вышло!</h3>
                        <p>Поймано рыбок: ${data.score}</p>
                        <button class="btn btn-primary" onclick="dashboard.restartWhackGame('${widget.id}')">
                            <i class="fas fa-redo"></i> Играть снова
                        </button>
                    </div>
                </div>
            </div>
        `;
        }

        return `
        <div class="whack-game-widget">
            <div class="whack-game">
                <div class="whack-score">Счет: ${data.score}</div>
                <div class="whack-timer">Время: ${data.timeLeft}с</div>
                <div class="whack-holes">
                    ${Array.from({ length: 6 }, (_, index) => `
                        <div class="whack-hole" onclick="dashboard.whackFish('${widget.id}', ${index})">
                            <div class="whack-fish fish-type-${data.holes[index]?.type || 0} 
                                 ${data.holes[index]?.visible ? 'up' : ''}
                                 ${data.holes[index]?.caught ? 'caught' : ''}">
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="game-controls">
                <div class="fish-tank-stat">Цель: успей ударить рыбку!</div>
            </div>
        </div>
    `;
    }

    // 2. Игра "Морская память" (Memory Match)
    renderMemoryMatchWidget(widget) {
        const { data } = widget;

        if (data.gameWon) {
            return `
            <div class="memory-widget">
                <div class="memory-game">
                    <div class="game-won">
                        <h3>Поздравляем! 🎉</h3>
                        <p>Ходов: ${data.moves}</p>
                        <p>Время: ${Math.floor((Date.now() - data.startTime) / 1000)}с</p>
                        <button class="btn btn-primary" onclick="dashboard.restartMemoryGame('${widget.id}')">
                            <i class="fas fa-redo"></i> Новая игра
                        </button>
                    </div>
                </div>
            </div>
        `;
        }

        return `
        <div class="memory-widget">
            <div class="memory-stats">
                <span>Ходы: ${data.moves}</span>
                <span>Пар: ${data.matchedPairs}/6</span>
            </div>
            <div class="memory-game">
                ${data.cards.map((card, index) => `
                    <div class="memory-card ${card.flipped ? 'flipped' : ''} ${card.matched ? 'matched' : ''}" 
                         onclick="dashboard.flipMemoryCard('${widget.id}', ${index})">
                        <div class="card-front">🌊</div>
                        <div class="card-back">${card.value}</div>
                    </div>
                `).join('')}
            </div>
            <div class="game-controls">
                <button class="btn btn-secondary" onclick="dashboard.restartMemoryGame('${widget.id}')">
                    <i class="fas fa-redo"></i> Новая игра
                </button>
            </div>
        </div>
    `;
    }

    // 3. Игра "Охотник за сокровищами" (Minesweeper стиль)
    renderTreasureHuntWidget(widget) {
        const { data } = widget;

        if (data.gameOver) {
            return `
            <div class="treasure-hunt-widget">
                <div class="treasure-hunt-stats">
                    <span>Сокровища: ${data.foundTreasures}/${data.totalTreasures}</span>
                </div>
                <div class="treasure-hunt-game">
                    <div class="game-over">
                        <h3>${data.gameWon ? 'Победа! 🏆' : 'Бомба! 💥'}</h3>
                        <p>Найдено: ${data.foundTreasures} из ${data.totalTreasures}</p>
                        <button class="btn btn-primary" onclick="dashboard.restartTreasureHunt('${widget.id}')">
                            <i class="fas fa-redo"></i> Новая игра
                        </button>
                    </div>
                </div>
            </div>
        `;
        }

        return `
        <div class="treasure-hunt-widget">
            <div class="treasure-hunt-stats">
                <span>Сокровища: ${data.foundTreasures}/${data.totalTreasures}</span>
                <span>Осталось ходов: ${data.attemptsLeft}</span>
            </div>
            <div class="treasure-hunt-game">
                <div class="treasure-grid">
                    ${data.grid.map((cell, index) => `
                        <div class="treasure-cell ${cell.dug ? 'dug' : ''} ${cell.dug && cell.hasTreasure ? 'treasure' : ''} ${cell.dug && cell.hasBomb ? 'bomb' : ''}" 
                             onclick="dashboard.digTreasure('${widget.id}', ${index})">
                            ${cell.dug ? (cell.hasTreasure ? '💎' : cell.hasBomb ? '💣' : '🕳️') : '🌊'}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="game-controls">
                <div class="fish-tank-stat">Найди все сокровища, избегая бомб!</div>
            </div>
        </div>
    `;
    }

    // МЕТОДЫ ДЛЯ "УДАРЬ РЫБКУ"
    getWhackAFishData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget.config.whackData) {
            widget.config.whackData = {
                score: 0,
                timeLeft: 30,
                gameOver: false,
                holes: Array(6).fill().map(() => ({
                    visible: false,
                    type: Math.floor(Math.random() * 3) + 1,
                    caught: false
                })),
                lastUpdate: Date.now(),
                gameInterval: null
            };

            this.startWhackGame(widgetId);
        }
        return widget.config.whackData;
    }

    startWhackGame(widgetId) {
        const data = this.getWhackAFishData(widgetId);

        // Таймер игры
        data.gameInterval = setInterval(() => {
            data.timeLeft--;

            if (data.timeLeft <= 0) {
                data.gameOver = true;
                clearInterval(data.gameInterval);
                this.showNotification(`Игра окончена! Счет: ${data.score}`, 'error');
            }

            // Показываем случайную рыбку
            const randomHole = Math.floor(Math.random() * 6);
            data.holes[randomHole].visible = true;
            data.holes[randomHole].caught = false;

            // Скрываем рыбку через 1.5 секунды
            setTimeout(() => {
                if (data.holes[randomHole].visible && !data.holes[randomHole].caught) {
                    data.holes[randomHole].visible = false;
                    this.saveToStorage();
                    this.renderWidget(widgetId);
                }
            }, 1500);

            this.saveToStorage();
            this.renderWidget(widgetId);
        }, 1000);
    }

    whackFish(widgetId, holeIndex) {
        const data = this.getWhackAFishData(widgetId);
        if (data.gameOver) return;

        const hole = data.holes[holeIndex];
        if (hole.visible && !hole.caught) {
            hole.caught = true;
            data.score += 10;
            this.showNotification('+10 очков! 🐠');

            setTimeout(() => {
                hole.visible = false;
                hole.caught = false;
                this.saveToStorage();
                this.renderWidget(widgetId);
            }, 500);

            this.saveToStorage();
            this.renderWidget(widgetId);
        }
    }

    restartWhackGame(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget.config.whackData?.gameInterval) {
            clearInterval(widget.config.whackData.gameInterval);
        }
        widget.config.whackData = null;
        this.loadWidgetData(widgetId);
    }

    // МЕТОДЫ ДЛЯ "МОРСКАЯ ПАМЯТЬ"
    getMemoryMatchData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget.config.memoryData) {
            const symbols = ['🐠', '🐟', '🐡', '🦈', '🐙', '🦀', '🐠', '🐟', '🐡', '🦈', '🐙', '🦀'];
            const shuffled = [...symbols].sort(() => Math.random() - 0.5);

            widget.config.memoryData = {
                cards: shuffled.map(value => ({ value, flipped: false, matched: false })),
                flippedCards: [],
                moves: 0,
                matchedPairs: 0,
                gameWon: false,
                startTime: Date.now()
            };
        }
        return widget.config.memoryData;
    }

    flipMemoryCard(widgetId, cardIndex) {
        const data = this.getMemoryMatchData(widgetId);
        if (data.gameWon) return;

        const card = data.cards[cardIndex];

        // Нельзя переворачивать уже открытые или совпавшие карты
        if (card.flipped || card.matched || data.flippedCards.length >= 2) {
            return;
        }

        // Переворачиваем карту
        card.flipped = true;
        data.flippedCards.push(cardIndex);

        // Если перевернуты две карты
        if (data.flippedCards.length === 2) {
            data.moves++;

            const [firstIndex, secondIndex] = data.flippedCards;
            const firstCard = data.cards[firstIndex];
            const secondCard = data.cards[secondIndex];

            if (firstCard.value === secondCard.value) {
                // Совпадение!
                firstCard.matched = true;
                secondCard.matched = true;
                data.matchedPairs++;
                data.flippedCards = [];

                this.showNotification('Найдена пара! 🎉');

                // Проверяем победу
                if (data.matchedPairs === 6) {
                    data.gameWon = true;
                    this.showNotification('Поздравляем! Вы нашли все пары! 🏆');
                }
            } else {
                // Не совпали - переворачиваем обратно
                setTimeout(() => {
                    firstCard.flipped = false;
                    secondCard.flipped = false;
                    data.flippedCards = [];
                    this.saveToStorage();
                    this.renderWidget(widgetId);
                }, 1000);
            }
        }

        this.saveToStorage();
        this.renderWidget(widgetId);
    }

    restartMemoryGame(widgetId) {
        const widget = this.widgets.get(widgetId);
        widget.config.memoryData = null;
        this.loadWidgetData(widgetId);
    }

    // 2. Полностью переделываем "Охотник за сокровищами" в стиль сапёра
    getTreasureHuntData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget.config.treasureHuntData) {
            const gridSize = 25; // 5x5 сетка
            const treasures = 5;
            const bombs = 5;

            // Создаем пустую сетку 5x5
            const grid = Array(gridSize).fill().map(() => ({
                dug: false,
                hasTreasure: false,
                hasBomb: false,
                adjacentBombs: 0,
                flagged: false
            }));

            // Размещаем сокровища
            for (let i = 0; i < treasures; i++) {
                let position;
                do {
                    position = Math.floor(Math.random() * gridSize);
                } while (grid[position].hasTreasure || grid[position].hasBomb);
                grid[position].hasTreasure = true;
            }

            // Размещаем бомбы
            for (let i = 0; i < bombs; i++) {
                let position;
                do {
                    position = Math.floor(Math.random() * gridSize);
                } while (grid[position].hasTreasure || grid[position].hasBomb);
                grid[position].hasBomb = true;
            }

            // Вычисляем количество бомб вокруг каждой клетки
            for (let i = 0; i < gridSize; i++) {
                if (!grid[i].hasBomb) {
                    grid[i].adjacentBombs = this.countAdjacentBombs(grid, i, 5);
                }
            }

            widget.config.treasureHuntData = {
                grid,
                foundTreasures: 0,
                totalTreasures: treasures,
                totalBombs: bombs,
                gameOver: false,
                gameWon: false,
                firstMove: true
            };
        }
        return widget.config.treasureHuntData;
    }

    // Метод для подсчета бомб вокруг клетки
    countAdjacentBombs(grid, index, gridWidth) {
        let count = 0;
        const row = Math.floor(index / gridWidth);
        const col = index % gridWidth;

        // Проверяем все 8 соседних клеток
        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                if (r === 0 && c === 0) continue;

                const newRow = row + r;
                const newCol = col + c;

                if (newRow >= 0 && newRow < gridWidth && newCol >= 0 && newCol < gridWidth) {
                    const neighborIndex = newRow * gridWidth + newCol;
                    if (grid[neighborIndex].hasBomb) {
                        count++;
                    }
                }
            }
        }

        return count;
    }

    digTreasure(widgetId, cellIndex) {
        const data = this.getTreasureHuntData(widgetId);
        if (data.gameOver) return;

        const cell = data.grid[cellIndex];

        // Нельзя копать уже раскопанную или помеченную ячейку
        if (cell.dug || cell.flagged) return;

        // Первый ход не должен быть бомбой
        if (data.firstMove && cell.hasBomb) {
            // Перемещаем бомбу в другое место
            this.moveBomb(data.grid, cellIndex);
            data.firstMove = false;
        } else {
            data.firstMove = false;
        }

        cell.dug = true;

        if (cell.hasTreasure) {
            data.foundTreasures++;
            this.showNotification('Найдено сокровище! 💎');

            if (data.foundTreasures === data.totalTreasures) {
                data.gameOver = true;
                data.gameWon = true;
                this.showNotification('Победа! Все сокровища найдены! 🏆');
            }
        } else if (cell.hasBomb) {
            data.gameOver = true;
            this.showNotification('Бомба! Игра окончена 💥', 'error');
            // Показываем все бомбы
            data.grid.forEach(cell => {
                if (cell.hasBomb) cell.dug = true;
            });
        } else if (cell.adjacentBombs === 0) {
            // Автоматически открываем соседние пустые клетки
            this.revealEmptyCells(data.grid, cellIndex, 5);
        }

        this.saveToStorage();
        this.renderWidget(widgetId);
    }

    // Метод для перемещения бомбы при первом ходе
    moveBomb(grid, bombIndex) {
        grid[bombIndex].hasBomb = false;

        // Ищем свободную клетку для бомбы
        let newPosition;
        do {
            newPosition = Math.floor(Math.random() * grid.length);
        } while (grid[newPosition].hasBomb || grid[newPosition].hasTreasure || newPosition === bombIndex);

        grid[newPosition].hasBomb = true;

        // Пересчитываем количество бомб вокруг всех клеток
        for (let i = 0; i < grid.length; i++) {
            if (!grid[i].hasBomb) {
                grid[i].adjacentBombs = this.countAdjacentBombs(grid, i, 5);
            }
        }
    }

    // Метод для открытия соседних пустых клеток
    revealEmptyCells(grid, index, gridWidth) {
        const row = Math.floor(index / gridWidth);
        const col = index % gridWidth;

        for (let r = -1; r <= 1; r++) {
            for (let c = -1; c <= 1; c++) {
                const newRow = row + r;
                const newCol = col + c;

                if (newRow >= 0 && newRow < gridWidth && newCol >= 0 && newCol < gridWidth) {
                    const neighborIndex = newRow * gridWidth + newCol;
                    const neighbor = grid[neighborIndex];

                    if (!neighbor.dug && !neighbor.hasBomb && !neighbor.flagged) {
                        neighbor.dug = true;

                        if (neighbor.adjacentBombs === 0) {
                            this.revealEmptyCells(grid, neighborIndex, gridWidth);
                        }
                    }
                }
            }
        }
    }

    // Метод для установки/снятия флажка (правый клик)
    flagCell(widgetId, cellIndex, event) {
        event.preventDefault(); // Предотвращаем контекстное меню
        const data = this.getTreasureHuntData(widgetId);
        if (data.gameOver) return;

        const cell = data.grid[cellIndex];
        if (!cell.dug) {
            cell.flagged = !cell.flagged;
            this.saveToStorage();
            this.renderWidget(widgetId);
        }
    }

    // 3. Обновляем рендеринг "Охотника за сокровищами"
    renderTreasureHuntWidget(widget) {
        const { data } = widget;

        if (data.gameOver) {
            return `
            <div class="treasure-hunt-widget">
                <div class="treasure-hunt-stats">
                    <span>Сокровища: ${data.foundTreasures}/${data.totalTreasures}</span>
                    <span>Бомбы: ${data.totalBombs}</span>
                </div>
                <div class="treasure-hunt-game">
                    <div class="game-over">
                        <h3>${data.gameWon ? 'Победа! 🏆' : 'Бомба! 💥'}</h3>
                        <p>Найдено: ${data.foundTreasures} из ${data.totalTreasures}</p>
                        <button class="btn btn-primary" onclick="dashboard.restartTreasureHunt('${widget.id}')">
                            <i class="fas fa-redo"></i> Новая игра
                        </button>
                    </div>
                </div>
            </div>
        `;
        }

        return `
        <div class="treasure-hunt-widget">
            <div class="treasure-hunt-stats">
                <span>Сокровища: ${data.foundTreasures}/${data.totalTreasures}</span>
                <span>Бомбы: ${data.totalBombs}</span>
                <span>Флажки: ${data.grid.filter(cell => cell.flagged).length}</span>
            </div>
            <div class="treasure-hunt-game">
                <div class="treasure-grid">
                    ${data.grid.map((cell, index) => `
                        <div class="treasure-cell 
                            ${cell.dug ? 'dug' : ''} 
                            ${cell.dug && cell.hasTreasure ? 'treasure' : ''} 
                            ${cell.dug && cell.hasBomb ? 'bomb' : ''}
                            ${cell.dug && cell.adjacentBombs > 0 ? `number-${cell.adjacentBombs}` : ''}
                            ${cell.flagged ? 'flagged' : ''}"
                             onclick="dashboard.digTreasure('${widget.id}', ${index})"
                             oncontextmenu="dashboard.flagCell('${widget.id}', ${index}, event)">
                            ${cell.flagged ? '🚩' :
                cell.dug ? (
                    cell.hasTreasure ? '💎' :
                        cell.hasBomb ? '💣' :
                            cell.adjacentBombs > 0 ? cell.adjacentBombs : ' '
                ) : '🌊'}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="game-controls">
                <button class="btn btn-secondary" onclick="dashboard.restartTreasureHunt('${widget.id}')">
                    <i class="fas fa-redo"></i> Новая игра
                </button>
            </div>
            <div class="game-instruction">
                ЛКМ - копать, ПКМ - поставить флажок 🚩
            </div>
        </div>
    `;
    }

    digTreasure(widgetId, cellIndex) {
        const data = this.getTreasureHuntData(widgetId);
        if (data.gameOver) return;

        const cell = data.grid[cellIndex];

        // Нельзя копать уже раскопанную ячейку
        if (cell.dug) return;

        cell.dug = true;
        data.attemptsLeft--;

        if (cell.hasTreasure) {
            data.foundTreasures++;
            this.showNotification('Найдено сокровище! 💎');

            if (data.foundTreasures === data.totalTreasures) {
                data.gameOver = true;
                data.gameWon = true;
                this.showNotification('Победа! Все сокровища найдены! 🏆');
            }
        } else if (cell.hasBomb) {
            data.gameOver = true;
            this.showNotification('Бомба! Игра окончена 💥', 'error');
        } else if (data.attemptsLeft <= 0) {
            data.gameOver = true;
            this.showNotification('Ходы закончились!', 'error');
        }

        this.saveToStorage();
        this.renderWidget(widgetId);
    }

    restartTreasureHunt(widgetId) {
        const widget = this.widgets.get(widgetId);
        widget.config.treasureHuntData = null;
        this.loadWidgetData(widgetId);
    }

    // ОБНОВЛЯЕМ ОСНОВНЫЕ МЕТОДЫ
    getWidgetContent(widget) {
        if (widget.data === null) {
            return `
            <div class="loading">
                <div class="spinner"></div>
                <span>Загрузка...</span>
            </div>
        `;
        }

        if (widget.data.error) {
            return `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <p>Ошибка загрузки</p>
                <button class="btn btn-secondary" onclick="dashboard.loadWidgetData('${widget.id}')">
                    Повторить
                </button>
            </div>
        `;
        }

        switch (widget.type) {
            case 'weather':
                return this.renderWeatherWidget(widget);
            case 'currency':
                return this.renderCurrencyWidget(widget);
            case 'quote':
                return this.renderQuoteWidget(widget);
            case 'timer':
                return this.renderTimerWidget(widget);
            case 'notes':
                return this.renderNotesWidget(widget);
            case 'whack_a_fish':
                return this.renderWhackAFishWidget(widget);
            case 'memory_match':
                return this.renderMemoryMatchWidget(widget);
            case 'treasure_hunt':
                return this.renderTreasureHuntWidget(widget);
            default:
                return '<p>Неизвестный тип виджета</p>';
        }
    }

    async loadWidgetData(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        // Show loading state
        widget.data = null;
        this.renderWidget(widgetId);

        try {
            let data;
            switch (widget.type) {
                case 'weather':
                    data = await this.fetchWeatherData(widget.config.city);
                    break;
                case 'currency':
                    data = await this.fetchCurrencyData(widget.config.currencies);
                    break;
                case 'quote':
                    data = await this.fetchQuoteData();
                    break;
                case 'timer':
                    data = this.getTimerData(widgetId);
                    break;
                case 'notes':
                    data = this.getNotesData(widgetId);
                    break;
                case 'whack_a_fish':
                    data = this.getWhackAFishData(widgetId);
                    break;
                case 'memory_match':
                    data = this.getMemoryMatchData(widgetId);
                    break;
                case 'treasure_hunt':
                    data = this.getTreasureHuntData(widgetId);
                    break;
            }

            widget.data = data;
        } catch (error) {
            console.error(`Error loading widget ${widgetId}:`, error);
            widget.data = { error: true, message: error.message };
        }

        this.renderWidget(widgetId);
    }

    // ОБНОВЛЕННЫЕ ГЕНЕРАТОРЫ
    generateBubbles(count) {
        const bubbles = [];
        for (let i = 0; i < count; i++) {
            bubbles.push({
                x: Math.random() * 280,
                y: Math.random() * 100,
                delay: Math.random() * 3
            });
        }
        return bubbles;
    }

    generateTreasures(count) {
        const treasures = [];
        const types = ['coin', 'gem', 'pearl'];
        for (let i = 0; i < count; i++) {
            treasures.push({
                x: 20 + Math.random() * 260,
                type: types[Math.floor(Math.random() * types.length)],
                delay: Math.random() * 5
            });
        }
        return treasures;
    }

    removeNote(widgetId, index) {
        const widget = this.widgets.get(widgetId);
        if (widget.config.notes) {
            widget.config.notes.splice(index, 1);
            this.saveToStorage();
            this.renderWidget(widgetId);
        }
    }

    // Settings modal
    showSettingsModal(widget) {
        const modal = document.createElement('div');
        modal.className = 'modal show';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Настройки виджета</h2>
                    <button class="close-modal">&times;</button>
                </div>
                <div class="settings-content">
                    ${this.getSettingsForm(widget)}
                </div>
            </div>
        `;

        modal.querySelector('.close-modal').addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        // Handle form submission
        const form = modal.querySelector('form');
        if (form) {
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleSettingsSubmit(widget.id, new FormData(form));
                modal.remove();
            });
        }

        document.body.appendChild(modal);
    }

    getSettingsForm(widget) {
        switch (widget.type) {
            case 'weather':
                return `
                    <form>
                        <div class="setting-group">
                            <label for="city">Город:</label>
                            <input type="text" id="city" name="city" value="${widget.config.city || 'Moscow'}" required>
                        </div>
                        <div class="setting-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                        </div>
                    </form>
                `;
            case 'currency':
                const currencies = ['USD', 'EUR', 'GBP', 'CNY'];
                return `
                    <form>
                        <div class="setting-group">
                            <label>Валюты:</label>
                            ${currencies.map(currency => `
                                <label style="display: flex; align-items: center; gap: 0.5rem; margin: 0.25rem 0;">
                                    <input type="checkbox" name="currencies" value="${currency}" 
                                           ${(widget.config.currencies || ['USD', 'EUR']).includes(currency) ? 'checked' : ''}>
                                    ${currency}
                                </label>
                            `).join('')}
                        </div>
                        <div class="setting-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                        </div>
                    </form>
                `;
            case 'timer':
                return `
                    <form>
                        <div class="setting-group">
                            <label for="workDuration">Время работы (минуты):</label>
                            <input type="number" id="workDuration" name="workDuration" 
                                   value="${(widget.config.timerData?.workDuration || 1500) / 60}" min="1" max="60" required>
                        </div>
                        <div class="setting-group">
                            <label for="breakDuration">Время перерыва (минуты):</label>
                            <input type="number" id="breakDuration" name="breakDuration" 
                                   value="${(widget.config.timerData?.breakDuration || 300) / 60}" min="1" max="30" required>
                        </div>
                        <div class="setting-actions">
                            <button type="button" class="btn btn-secondary" onclick="this.closest('.modal').remove()">Отмена</button>
                            <button type="submit" class="btn btn-primary">Сохранить</button>
                        </div>
                    </form>
                `;
            default:
                return '<p>Настройки для этого виджета недоступны</p>';
        }
    }

    handleSettingsSubmit(widgetId, formData) {
        const widget = this.widgets.get(widgetId);
        if (!widget) return;

        const newConfig = { ...widget.config };

        switch (widget.type) {
            case 'weather':
                newConfig.city = formData.get('city');
                break;
            case 'currency':
                newConfig.currencies = formData.getAll('currencies');
                break;
            case 'timer':
                if (!newConfig.timerData) {
                    newConfig.timerData = this.getTimerData(widgetId);
                }
                newConfig.timerData.workDuration = parseInt(formData.get('workDuration')) * 60;
                newConfig.timerData.breakDuration = parseInt(formData.get('breakDuration')) * 60;
                break;
        }

        this.updateWidgetConfig(widgetId, newConfig);
        this.showNotification('Настройки сохранены');
    }

    // Drag and Drop
    setupDragAndDrop() {
        const grid = document.getElementById('widgets-grid');
        const widgets = grid.querySelectorAll('.widget');

        widgets.forEach(widget => {
            widget.addEventListener('dragstart', (e) => {
                e.dataTransfer.setData('text/plain', widget.id);
                setTimeout(() => widget.classList.add('dragging'), 0);
            });

            widget.addEventListener('dragend', () => {
                widget.classList.remove('dragging');
                grid.classList.remove('drag-over');
            });
        });

        grid.addEventListener('dragover', (e) => {
            e.preventDefault();
            grid.classList.add('drag-over');
        });

        grid.addEventListener('dragleave', () => {
            grid.classList.remove('drag-over');
        });

        grid.addEventListener('drop', (e) => {
            e.preventDefault();
            grid.classList.remove('drag-over');

            const widgetId = e.dataTransfer.getData('text/plain');
            const draggedWidget = document.getElementById(widgetId);
            const afterElement = this.getDragAfterElement(grid, e.clientY);

            if (afterElement) {
                grid.insertBefore(draggedWidget, afterElement);
            } else {
                grid.appendChild(draggedWidget);
            }

            this.saveLayout();
        });
    }

    getDragAfterElement(container, y) {
        const draggableElements = [...container.querySelectorAll('.widget:not(.dragging)')];

        return draggableElements.reduce((closest, child) => {
            const box = child.getBoundingClientRect();
            const offset = y - box.top - box.height / 2;

            if (offset < 0 && offset > closest.offset) {
                return { offset: offset, element: child };
            } else {
                return closest;
            }
        }, { offset: Number.NEGATIVE_INFINITY }).element;
    }

    saveLayout() {
        const grid = document.getElementById('widgets-grid');
        const widgetIds = [...grid.children].map(child => child.id);

        // Reorder widgets map according to DOM order
        const orderedWidgets = new Map();
        widgetIds.forEach(id => {
            if (this.widgets.has(id)) {
                orderedWidgets.set(id, this.widgets.get(id));
            }
        });

        this.widgets = orderedWidgets;
        this.saveToStorage();
    }

    // Export/Import
    exportConfig() {
        const config = {
            widgets: Array.from(this.widgets.values()),
            nextWidgetId: this.nextWidgetId,
            exportDate: new Date().toISOString()
        };

        const dataStr = JSON.stringify(config, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `dashboard-config-${new Date().toISOString().split('T')[0]}.json`;
        link.click();

        this.showNotification('Конфигурация экспортирована');
    }

    triggerImport() {
        document.getElementById('import-file').click();
    }

    importConfig(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const config = JSON.parse(e.target.result);
                this.applyImportedConfig(config);
                this.showNotification('Конфигурация импортирована');
            } catch (error) {
                this.showNotification('Ошибка импорта конфигурации', 'error');
                console.error('Import error:', error);
            }
        };
        reader.readAsText(file);

        // Reset file input
        event.target.value = '';
    }

    applyImportedConfig(config) {
        this.widgets.clear();
        this.nextWidgetId = config.nextWidgetId || 1;

        config.widgets.forEach(widgetData => {
            this.widgets.set(widgetData.id, widgetData);
        });

        this.render();
        this.saveToStorage();

        // Reload data for all widgets
        this.widgets.forEach((widget, id) => {
            this.loadWidgetData(id);
        });
    }

    // Storage
    saveToStorage() {
        const config = {
            widgets: Array.from(this.widgets.values()),
            nextWidgetId: this.nextWidgetId
        };
        localStorage.setItem('smartDashboard', JSON.stringify(config));
    }

    loadFromStorage() {
        const saved = localStorage.getItem('smartDashboard');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.nextWidgetId = config.nextWidgetId || 1;

                config.widgets.forEach(widgetData => {
                    this.widgets.set(widgetData.id, widgetData);
                });
            } catch (error) {
                console.error('Error loading from storage:', error);
            }
        }
    }

    // Utility methods
    getWidgetIcon(type) {
        const icons = {
            weather: 'fas fa-cloud-sun',
            currency: 'fas fa-dollar-sign',
            quote: 'fas fa-quote-left',
            timer: 'fas fa-clock',
            notes: 'fas fa-sticky-note',
            whack_a_fish: 'fas fa-hammer',
            memory_match: 'fas fa-brain',
            treasure_hunt: 'fas fa-treasure-chest'
        };
        return icons[type] || 'fas fa-cube';
    }

    getWidgetTitle(type) {
        const titles = {
            weather: 'Погода',
            currency: 'Курсы валют',
            quote: 'Случайная цитата',
            timer: 'Таймер Pomodoro',
            notes: 'Заметки',
            whack_a_fish: 'Ударь рыбку',
        memory_match: 'Морская память',
        treasure_hunt: 'Охотник за сокровищами'
        };
        return titles[type] || 'Виджет';
    }

    getWeatherIcon(condition) {
        const icons = {
            clear: 'sun',
            clouds: 'cloud',
            rain: 'cloud-rain',
            drizzle: 'cloud-rain',
            thunderstorm: 'bolt',
            snow: 'snowflake',
            mist: 'smog'
        };
        return icons[condition] || 'sun';
    }

    getCurrencyColor(currency) {
        const colors = {
            USD: '4CAF50',
            EUR: '2196F3',
            GBP: 'FF9800',
            CNY: 'F44336'
        };
        return colors[currency] || '9E9E9E';
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    renderWidget(widgetId) {
        const widgetElement = document.getElementById(widgetId);
        if (widgetElement) {
            const widget = this.widgets.get(widgetId);
            const contentElement = widgetElement.querySelector('.widget-content');
            if (contentElement) {
                contentElement.innerHTML = this.getWidgetContent(widget);

                // Re-attach event listeners for dynamic content
                if (widget.type === 'notes') {
                    const input = contentElement.querySelector('input');
                    const button = contentElement.querySelector('.btn');
                    if (input && button) {
                        input.onkeypress = (e) => {
                            if (e.key === 'Enter') this.addNote(widgetId, input);
                        };
                        button.onclick = () => this.addNote(widgetId, input);
                    }
                }
            }
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => notification.classList.add('show'), 100);
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Request notification permission on load
if ('Notification' in window) {
    Notification.requestPermission();
}

// Initialize dashboard when DOM is loaded
let dashboard;
document.addEventListener('DOMContentLoaded', () => {
    dashboard = new SmartDashboard();
});