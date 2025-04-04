document.addEventListener('DOMContentLoaded', async () => {
    const errorMessage = document.getElementById('error-message');


    await checkAuth();
    loadTheme();
    function showError(message) {
        if (errorMessage) {
            errorMessage.textContent = message;
            errorMessage.classList.remove('hidden');
            setTimeout(() => {
                errorMessage.classList.add('hidden');
            }, 3000);
        } else {
            alert(message);
        }
    }


    async function checkAuth() {
        try {
            const response = await fetch('/check-auth', {
                credentials: 'include'
            });
            const data = await response.json();

            if (data.authenticated) {

                if (document.getElementById('username-display')) {
                    document.getElementById('username-display').textContent = data.user.username;
                    loadTheme();
                } else {

                    window.location.href = '/profile';
                }
            } else if (window.location.pathname === '/profile') {

                window.location.href = '/';
            }
        } catch (err) {
            console.error('Ошибка проверки авторизации:', err);
        }
    }

    // Загрузка темы и сохранение
    function loadTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            document.documentElement.setAttribute('data-theme', savedTheme);
        }
    }


    if (document.getElementById('login-btn')) {

        document.getElementById('show-register').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('login-form').classList.add('hidden');
            document.getElementById('register-form').classList.remove('hidden');
        });
        document.getElementById('show-login').addEventListener('click', (e) => {
            e.preventDefault();
            document.getElementById('register-form').classList.add('hidden');
            document.getElementById('login-form').classList.remove('hidden');
        });


        document.getElementById('login-btn').addEventListener('click', async () => {
            const username = document.getElementById('login-username').value;
            const password = document.getElementById('login-password').value;

            try {
                const response = await fetch('/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    await checkAuth();
                } else {
                    showError(data.message || 'Неверные учетные данные');
                }
            } catch (err) {
                showError('Ошибка соединения');
            }
        });


        document.getElementById('register-btn').addEventListener('click', async () => {
            const username = document.getElementById('register-username').value;
            const password = document.getElementById('register-password').value;

            try {
                const response = await fetch('/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    showError('Регистрация успешна. Теперь вы можете войти.');
                    document.getElementById('register-form').classList.add('hidden');
                    document.getElementById('login-form').classList.remove('hidden');
                } else {
                    showError(data.message || 'Ошибка регистрации');
                }
            } catch (err) {
                showError('Ошибка соединения');
            }
        });
    }


    if (document.getElementById('logout-btn')) {
        // Смена темы
        document.getElementById('toggle-theme').addEventListener('click', async () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'light' ? 'dark' : 'light';

            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);


            await fetch('/theme', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ theme: newTheme }),
                credentials: 'include'
            });
        });


        async function updateData() {
            try {
                const response = await fetch('/data', {
                    credentials: 'include'
                });
                const data = await response.json();

                document.getElementById('data-container').innerHTML = `
                    <h3>Данные</h3>
                    <p><strong>Время генерации:</strong> ${new Date(data.timestamp).toLocaleTimeString()}</p>
                    <pre>${JSON.stringify(data.items, null, 2)}</pre>
                `;
            } catch (err) {
                showError('Ошибка загрузки данных');
            }
        }


        document.getElementById('refresh-data').addEventListener('click', updateData);


        document.getElementById('logout-btn').addEventListener('click', async () => {
            try {
                const response = await fetch('/logout', {
                    method: 'POST',
                    credentials: 'include'
                });

                const data = await response.json();

                if (data.success) {
                    window.location.href = '/';
                }
            } catch (err) {
                showError('Ошибка при выходе');
            }
        });


        await updateData();
    }
});