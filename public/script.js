/*************************************************
 * НАСТРОЙКИ JSON-SERVER
 *************************************************/
const BASE_URL = "http://localhost:3000";
// ВАЖНО: поменяй, если в db.json коллекция называется иначе
// Примеры: "products", "items", "goods"
const PRODUCTS_ENDPOINT = "products";

/*************************************************
 * УТИЛИТЫ СЕССИИ/КОРЗИНЫ (корзина на аккаунт)
 *************************************************/
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem("user")); } catch { return null; }
}
function setCurrentUser(u) {
  if (!u) localStorage.removeItem("user");
  else localStorage.setItem("user", JSON.stringify(u));
}
function getCartKey() {
  const u = getCurrentUser();
  return u ? `cart_${u.username}` : "cart_guest";
}
function getCart() {
  return JSON.parse(localStorage.getItem(getCartKey())) || [];
}
function setCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}
// Слияние гостевой корзины при входе (если ты вызовешь это после логина)
function mergeGuestCartIntoUser() {
  const u = getCurrentUser(); if (!u) return;
  const guest = JSON.parse(localStorage.getItem("cart_guest") || "[]");
  if (!guest.length) return;
  const userKey = getCartKey();
  const userCart = JSON.parse(localStorage.getItem(userKey) || "[]");
  guest.forEach(g => {
    const idx = userCart.findIndex(i => String(i.id) === String(g.id));
    if (idx > -1) userCart[idx].quantity += g.quantity;
    else userCart.push(g);
  });
  localStorage.setItem(userKey, JSON.stringify(userCart));
  localStorage.removeItem("cart_guest");
}

/*************************************************
 * НАВБАР: состояние входа
 *************************************************/
function applyUserSession() {
  const ab = document.getElementById("auth-buttons");
  const u = getCurrentUser();
  if (!ab) return;
  if (u) {
    ab.innerHTML = `<span class="hello">Привет, ${u.username}</span>
      <button class="btn" onclick="logout()">Выйти</button>`;
  } else {
    ab.innerHTML = `<a class="btn" href="login.html">Войти</a>
      <a class="btn" href="register.html">Регистрация</a>`;
  }
}
function logout() {
  setCurrentUser(null);
  applyUserSession();
  alert("Вы вышли из аккаунта.");
}

/*************************************************
 * ТАЙМЕР рядом с поиском
 *************************************************/
function updateClock() {
  const el = document.getElementById("clock");
  if (!el) return;
  const now = new Date();
  const time = now.toLocaleTimeString("uk-UA", { hour12: false });
  const date = now.toLocaleDateString("uk-UA");
  el.textContent = `${time} ${date}`;
}
setInterval(updateClock, 1000); updateClock();

/*************************************************
 * ЗАГРУЗКА ТОВАРОВ ИЗ json-server
 *************************************************/
// Хранилище загруженных товаров
let products = [];

/**
 * Нормализация полей товара под {id, name, price, image}
 * чтобы не зависеть от разных схем в db.json
 */
function normalizeProduct(raw) {
  const id = raw.id ?? raw._id ?? raw.productId ?? raw.sku ?? String(Math.random());
  const name = raw.name ?? raw.title ?? raw.productName ?? "Без названия";
  const price = Number(raw.price ?? raw.cost ?? raw.amount ?? 0);
  const image = raw.image ?? raw.img ?? raw.thumbnail ?? raw.photo ?? "";
  return { id, name, price, image };
}

async function fetchProducts() {
  try {
    const res = await fetch(`${BASE_URL}/${PRODUCTS_ENDPOINT}`);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    // data должен быть массивом объектов из db.json
    products = Array.isArray(data) ? data.map(normalizeProduct) : [];
  } catch (e) {
    console.error("Ошибка загрузки товаров:", e);
    products = []; // чтобы код ниже не падал
    alert("Не удалось загрузить товары. Проверь json-server и PRODUCTS_ENDPOINT.");
  }
}

/*************************************************
 * ПОИСК + ПАГИНАЦИЯ (по загруженному массиву)
 *************************************************/
const PAGE_SIZE = 12;
let currentPage = 1;
let currentQuery = "";

function getFilteredProducts() {
  const q = currentQuery.trim().toLowerCase();
  if (!q) return products;
  return products.filter(p =>
    String(p.name || "").toLowerCase().includes(q) ||
    String(p.price ?? "").toString().includes(q)
  );
}

function renderProductsPage(reset = false) {
  const listEl = document.getElementById("productList");
  const loadMoreBtn = document.getElementById("load-more");
  if (!listEl) return;

  const filtered = getFilteredProducts();
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

  if (reset) { currentPage = 1; listEl.innerHTML = ""; }
  const start = (currentPage - 1) * PAGE_SIZE;
  const slice = filtered.slice(start, start + PAGE_SIZE);

  slice.forEach(p => {
    const li = document.createElement("li");
    li.innerHTML = `
      <img src="${p.image || ""}" alt="${p.name || ""}">
      <h3>${p.name || ""}</h3>
      <p>${p.price != null ? p.price : ""} грн</p>
      <button class="btn" data-id="${p.id}">Выбрать</button>
    `;
    listEl.appendChild(li);
  });

  if (loadMoreBtn) {
    loadMoreBtn.style.display = (currentPage >= totalPages || filtered.length === 0) ? "none" : "block";
  }
}

function onSearchInput(e) {
  currentQuery = e.target.value || "";
  renderProductsPage(true);
}
function onLoadMore() {
  currentPage += 1;
  renderProductsPage(false);
}

/*************************************************
 * ДОБАВЛЕНИЕ В КОРЗИНУ (товары видны всем, но добавлять могут только залогиненные)
 *************************************************/
function handleAddToCartClick(e) {
  const btn = e.target.closest("button[data-id]");
  if (!btn) return;

  // блокируем гостей
  const user = getCurrentUser();
  if (!user) {
    alert("Чтобы добавлять товары в корзину, войдите в аккаунт.");
    window.location.href = "login.html";
    return;
  }

  const id = btn.getAttribute("data-id");
  const product = products.find(p => String(p.id) === String(id));
  if (!product) return;

  const cart = getCart();
  const idx = cart.findIndex(i => String(i.id) === String(id));
  if (idx > -1) {
    cart[idx].quantity += 1;
  } else {
    cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  }
  setCart(cart);
  alert("Товар добавлен в корзину");
}

/*************************************************
 * ИНИЦИАЛИЗАЦИЯ
 *************************************************/
document.addEventListener("DOMContentLoaded", async () => {
  applyUserSession();
  updateClock();

  // Обработчики поиска/пагинации/кнопок
  const search = document.getElementById("search");
  if (search) search.addEventListener("input", onSearchInput);
  const loadMoreBtn = document.getElementById("load-more");
  if (loadMoreBtn) loadMoreBtn.addEventListener("click", onLoadMore);
  const listEl = document.getElementById("productList");
  if (listEl) listEl.addEventListener("click", handleAddToCartClick);

  // 1) грузим товары из db.json (json-server)
  await fetchProducts();
  // 2) показываем их всем (без авторизации)
  renderProductsPage(true);

  // Если ты вызываешь mergeGuestCartIntoUser() после логина — оставь:
  // mergeGuestCartIntoUser();
});
