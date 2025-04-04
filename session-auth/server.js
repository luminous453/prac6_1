const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');

// ПОмооогииииитееее
const app = express();
const cacheDir = path.join(__dirname, 'cache');

// Создаем папку для кэша, если её нет
if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir);
}

// Мидлвары
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(cookieParser());

// Конфигурация сессии
app.use(session({
    secret: 'complex_secret_key_123!@#',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false,
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));

// "База данных" пользователей (в реальном приложении - подключение к БД)
const users = {};

// Функция для кэширования данных в файлы
function getCachedData(key, ttlSeconds = 30) {
    const cacheFile = path.join(cacheDir, `${key}.json`);

    // Если файл существует и не устарел
    if (fs.existsSync(cacheFile)) {
        const stats = fs.statSync(cacheFile);
        const now = new Date().getTime();
        const fileAge = (now - stats.mtimeMs) / 1000;

        if (fileAge < ttlSeconds) {
            const cachedData = fs.readFileSync(cacheFile, 'utf-8');
            return JSON.parse(cachedData);
        }
    }

    // Генерируем новые данные
    const newData = {
        items: ['1', '2', '3'],
        timestamp: Date.now(),
        source: 'Файловый кэш'
    };

    // Сохраняем в файл
    fs.writeFileSync(cacheFile, JSON.stringify(newData));

    // Удаляем файл после истечения TTL
    setTimeout(() => {
        if (fs.existsSync(cacheFile)) {
            fs.unlinkSync(cacheFile);
        }
    }, ttlSeconds * 1000);

    return newData;
}

// ---------------------- Обработчики путей ----------------------

app.post('/register', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Логин и пароль обязательны' });
    }

    if (users[username]) {
        return res.status(400).json({ success: false, message: 'Пользователь уже существует' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        users[username] = { username, password: hashedPassword };
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Ошибка регистрации' });
    }
});

app.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Логин и пароль обязательны' });
    }

    const user = users[username];
    if (!user) {
        return res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    }

    try {
        const match = await bcrypt.compare(password, user.password);
        if (match) {
            req.session.user = { username };
            return res.json({ success: true });
        }
        res.status(401).json({ success: false, message: 'Неверные учетные данные' });
    } catch (err) {
        res.status(500).json({ success: false, message: 'Ошибка входа' });
    }
});

app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        return res.json({
            authenticated: true,
            user: req.session.user,
            theme: req.session.theme || 'light',
        });
    }
    res.json({ authenticated: false });
});

app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Ошибка выхода' });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});

app.get('/profile', (req, res) => {
    if (!req.session.user) {
        return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, 'public', 'profile.html'));
});

app.get('/data', (req, res) => {
    const data = getCachedData('api_data');
    res.json(data);
});

app.post('/theme', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false });
    }

    const { theme } = req.body;
    req.session.theme = theme;
    res.json({ success: true });
});

// Запускаем сервер
app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
});