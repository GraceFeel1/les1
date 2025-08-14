function getCart() {
  return JSON.parse(localStorage.getItem('cart')) || [];
}

function setCart(cart) {
  localStorage.setItem('cart', JSON.stringify(cart));
}

function renderCart() {
  const cartList = document.getElementById('cartList');
  const cart = getCart();
  cartList.innerHTML = '';

  if (cart.length === 0) {
    cartList.innerHTML = '<li class="empty">Корзина пуста</li>';
    updateTotal();
    return;
  }

  cart.forEach((item, index) => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    const subtotal = item.price * item.quantity;
    li.innerHTML = `
      <label class="select-wrap">
        <input type="checkbox" class="select-item" data-index="${index}" checked />
      </label>
      <img src="${item.image}" alt="${item.name}" />
      <div class="info">
        <h4>${item.name}</h4>
        <div class="meta">
          <span class="price">${item.price.toLocaleString('uk-UA')}₴</span>
          <span class="mul">×</span>
          <input type="number" min="1" value="${item.quantity}" data-index="${index}" class="qty-input" />
          <span class="subtotal">= ${(subtotal).toLocaleString('uk-UA')}₴</span>
        </div>
      </div>
      <button class="remove-btn" data-index="${index}">Удалить</button>
    `;
    cartList.appendChild(li);
  });

  // Remove handlers
  document.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const cart = getCart();
      cart.splice(parseInt(btn.dataset.index, 10), 1);
      setCart(cart);
      renderCart();
    });
  });

  // Quantity change
  document.querySelectorAll('.qty-input').forEach(input => {
    input.addEventListener('change', (e) => {
      const cart = getCart();
      const index = parseInt(e.target.dataset.index, 10);
      const value = Math.max(1, parseInt(e.target.value || '1', 10));
      cart[index].quantity = value;
      setCart(cart);
      renderCart();
    });
  });

  // Select change
  document.querySelectorAll('.select-item').forEach(chk => {
    chk.addEventListener('change', () => updateTotal());
  });

  // Select all
  const selectAll = document.getElementById('select-all');
  if (selectAll) {
    selectAll.checked = true;
    selectAll.onchange = () => {
      document.querySelectorAll('.select-item').forEach(chk => (chk.checked = selectAll.checked));
      updateTotal();
    };
  }

  updateTotal();
}

function getSelectedIndices() {
  return Array.from(document.querySelectorAll('.select-item'))
    .map((el, idx) => (el.checked ? parseInt(el.dataset.index, 10) : null))
    .filter(v => v !== null);
}

function calcTotal() {
  const cart = getCart();
  const selected = getSelectedIndices();
  let total = 0;
  selected.forEach(i => {
    const item = cart[i];
    if (item) total += item.price * item.quantity;
  });
  return total;
}

function updateTotal() {
  const totalEl = document.getElementById('total');
  totalEl.textContent = `${calcTotal().toLocaleString('uk-UA')}₴`;
}

// Modal helpers
function openPaymentModal() {
  document.getElementById('payment-modal').classList.remove('hidden');
}

function closePaymentModal() {
  document.getElementById('payment-modal').classList.add('hidden');
}

// Validate and simulate payment
function payNow() {
  const num = document.getElementById('card-number').value.replace(/\s+/g, '');
  const name = document.getElementById('card-name').value.trim();
  const exp = document.getElementById('card-expiry').value.trim();
  const cvv = document.getElementById('card-cvv').value.trim();

  if (!/^\d{16}$/.test(num)) return alert('Введите корректный номер карты (16 цифр)');
  if (!/^[a-zA-Z ]{2,}$/.test(name)) return alert('Введите имя латиницей');
  if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(exp)) return alert('Введите срок в формате MM/YY');
  if (!/^\d{3,4}$/.test(cvv)) return alert('Введите корректный CVV');

  // Удаляем только выбранные товары
  const selected = getSelectedIndices();
  const cart = getCart().filter((_, idx) => !selected.includes(idx));
  setCart(cart);
  alert('Оплата прошла успешно! Спасибо за покупку.');
  closePaymentModal();
  renderCart();
}

document.getElementById('checkout-btn').addEventListener('click', () => {
  const total = calcTotal();
  if (total <= 0) {
    alert('Выберите хотя бы один товар.');
    return;
  }
  openPaymentModal();
});

document.getElementById('pay-now').addEventListener('click', payNow);
document.getElementById('cancel-pay').addEventListener('click', closePaymentModal);

// init
renderCart();
