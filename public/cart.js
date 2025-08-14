// Те же утилиты
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}
function getCartKey() {
  const u = getCurrentUser();
  return u ? `cart_${u.username}` : 'cart_guest';
}
function getCart() { return JSON.parse(localStorage.getItem(getCartKey())) || []; }
function setCart(cart) { localStorage.setItem(getCartKey(), JSON.stringify(cart)); }

function applyUserSession() {
  const ab = document.getElementById('auth-buttons');
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
  localStorage.removeItem('user');
  applyUserSession();
  alert('Вы вышли из аккаунта.');
}

// Рендер корзины
function renderCart() {
  const list = document.getElementById('cartList');
  const notice = document.getElementById('cartNotice');
  const totalEl = document.getElementById('total');
  const user = getCurrentUser();

  if (!user) {
    notice.style.display = 'block';
    notice.textContent = 'Чтобы оформлять покупки, войдите в аккаунт.';
  } else {
    notice.style.display = 'none';
  }

  const cart = getCart();
  list.innerHTML = '';
  let total = 0;

  cart.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.innerHTML = `
      <img src="${item.image || ''}" alt="${item.name || ''}"/>
      <div>
        <h4>${item.name || ''}</h4>
        <div class="price">${item.price || 0} грн</div>
      </div>
      <div class="item-actions">
        <div class="qty">
          <button class="btn" data-act="dec" data-idx="${idx}">-</button>
          <span>${item.quantity || 1}</span>
          <button class="btn" data-act="inc" data-idx="${idx}">+</button>
        </div>
        <button class="btn remove" data-act="del" data-idx="${idx}">Удалить</button>
      </div>
    `;
    list.appendChild(li);
    total += (item.price || 0) * (item.quantity || 1);
  });

  totalEl.textContent = `Итого: ${total} грн`;
}

function handleCartClick(e) {
  const btn = e.target.closest('button[data-act]');
  if (!btn) return;
  const act = btn.getAttribute('data-act');
  const idx = Number(btn.getAttribute('data-idx'));
  const cart = getCart();
  if (!(idx in cart)) return;

  if (act === 'inc') cart[idx].quantity += 1;
  if (act === 'dec') cart[idx].quantity = Math.max(1, cart[idx].quantity - 1);
  if (act === 'del') cart.splice(idx, 1);
  setCart(cart);
  renderCart();
}

// Оплата
function openPaymentModal() {
  document.getElementById('payment-modal').classList.add('active');
}
function closePaymentModal() {
  document.getElementById('payment-modal').classList.remove('active');
}
function processPayment() {
  alert('Оплата прошла успешно (демо).');
  setCart([]); // очистить корзину
  closePaymentModal();
  renderCart();
}

document.addEventListener('DOMContentLoaded', () => {
  applyUserSession();
  document.getElementById('cartList').addEventListener('click', handleCartClick);
  document.getElementById('checkout-btn').addEventListener('click', () => {
    if (!getCurrentUser()) {
      alert('Войдите в аккаунт, чтобы оформить покупку.');
      window.location.href = 'login.html';
      return;
    }
    const cart = getCart();
    if (!cart.length) { alert('Корзина пуста'); return; }
    openPaymentModal();
  });
  renderCart();
});
