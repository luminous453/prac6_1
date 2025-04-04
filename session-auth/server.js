const express = require('express');
const session = require('express-session');
const path = require('path');
const app = express();
// Мидлвары
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
// Конфигурация сессии
app.use(session({
    secret: 'your_secret_key_here',
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // Для разработки на localhost
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000 // 24 часа
    }
}));
// Маршруты
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    // Простая проверка (в реальном приложении - проверка в БД)
    if (username === 'admin' && password === '12345') {
        req.session.user = { username };
        return res.json({ success: true });
    }
    res.status(401).json({ success: false });
});
app.get('/check-auth', (req, res) => {
    if (req.session.user) {
        return res.json({ authenticated: true, user: req.session.user });
    }
    res.json({ authenticated: false });
});
app.post('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).send('Ошибка выхода');
        }
        res.clearCookie('connect.sid');
        res.json({ success: true });
    });
});
app.listen(3000, () => {
    console.log('Сервер запущен на http://localhost:3000');
    console.log('Для теста используйте:');
    console.log('Логин: admin');
    console.log('Пароль: 12345');
});
app.use(session({
    secret: 'complex_key_here', // Должен быть длинным и сложным
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: false, // true только для HTTPS
        httpOnly: true,
        sameSite: 'lax'
    }
}));