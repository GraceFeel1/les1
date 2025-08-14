const API = 'http://localhost:3000';
let page = 1;
const limit = 6;
let products = []; // будет накапливать товары с пагинацией
let searchTerm = '';

// Загрузка товаров (с пагинацией)
async function fetchProducts() {
  const res = await fetch(`${API}/products?_page=${page}&_limit=${limit}`);
  const data = await res.json();
  products = products.concat(data);
  renderProducts();
  // Скрыть кнопку, если больше нечего грузить
  if (data.length < limit) {
    document.getElementById('load-more').style.display = 'none';
  }
}

// Отрисовка карточек
function renderProducts() {
  const list = document.getElementById('productList');
  list.innerHTML = '';
  const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm));

  filtered.forEach(p => {
    const li = document.createElement('li');
    li.className = 'product-card';
    li.innerHTML = `
      <img src="${p.image}" alt="${p.name}" />
      <h3>${p.name}</h3>
      <p class="price">${p.price.toLocaleString('uk-UA')}₴</p>
      <button class="select-btn" data-id="${p.id}">Выбрать</button>
    `;
    list.appendChild(li);
  });

  // навесим обработчики добавления в корзину
  document.querySelectorAll('.select-btn').forEach(btn => {
    btn.addEventListener('click', () => addToCart(btn.dataset.id));
  });
}

// Показать ещё
document.getElementById('load-more').addEventListener('click', () => {
  page++;
  fetchProducts();
});

// Поиск
document.getElementById('search').addEventListener('input', (e) => {
  searchTerm = e.target.value.toLowerCase();
  renderProducts(); // не скрывает товары, просто фильтрует текущие
});

// Работа с модалкой регистрации/логина
function showRegister() {
  document.getElementById('modal-title').innerText = 'Регистрация';
  document.getElementById('email').style.display = '';
  document.getElementById('phone').style.display = '';
  document.getElementById('submit-btn').onclick = registerUser;
  document.getElementById('modal-form').classList.remove('hidden');
}

function showLogin() {
  document.getElementById('modal-title').innerText = 'Логин';
  document.getElementById('email').style.display = 'none';
  document.getElementById('phone').style.display = 'none';
  document.getElementById('submit-btn').onclick = loginUser;
  document.getElementById('modal-form').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('modal-form').classList.add('hidden');
}

async function registerUser() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const email = document.getElementById('email').value.trim();
  const phone = document.getElementById('phone').value.trim();

  if (!username || !password || !email || !phone) {
    alert('Заполните все поля!');
    return;
  }

  const check = await fetch(`${API}/users?username=${encodeURIComponent(username)}`);
  const users = await check.json();
  if (users.length > 0) {
    alert('Пользователь уже существует!');
    return;
  }

  const res = await fetch(`${API}/users`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, email, phone })
  });
  if (res.ok) {
    alert('Регистрация успешна!');
    showLogin();
  } else {
    alert('Ошибка регистрации');
  }
}

async function loginUser() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();

  const res = await fetch(`${API}/users?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`);
  const data = await res.json();

  if (Array.isArray(data) && data.length > 0) {
    localStorage.setItem('user', JSON.stringify(data[0]));
    alert(`Добро пожаловать, ${username}!`);
    closeModal();
    applyUserSession();
  } else {
    alert('Неверные данные!');
  }
}

function applyUserSession() {
  const user = JSON.parse(localStorage.getItem('user'));
  const authButtons = document.getElementById('auth-buttons');
  if (user) {
    authButtons.innerHTML = `<p>👋 Привет, ${user.username}! <button onclick="logout()">Выход</button></p>`;
  }
}

function logout() {
  localStorage.removeItem('user');
  document.getElementById('auth-buttons').innerHTML = `
    <button onclick="showRegister()">Регистрация</button>
    <button onclick="showLogin()">Логин</button>
  `;
}

// Корзина
function addToCart(productId) {
  const cart = JSON.parse(localStorage.getItem('cart')) || [];
  // Найти товар в загруженном списке
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;
  const idx = cart.findIndex(i => String(i.id) == String(productId));
  if (idx > -1) {
    cart[idx].quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  localStorage.setItem('cart', JSON.stringify(cart));
  // Визуальное подтверждение
  alert('Товар добавлен в корзину');
}

// При загрузке
function checkLogin() {
  const user = localStorage.getItem('user');
  if (user) applyUserSession();
}

checkLogin();
fetchProducts();
