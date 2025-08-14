// ---- СЕССИЯ ПОЛЬЗОВАТЕЛЯ ----
function getCurrentUser() {
  try { return JSON.parse(localStorage.getItem('user')); } catch { return null; }
}
function getCartKey() {
  const u = getCurrentUser();
  return u ? `cart_${u.username}` : 'cart_guest';
}
function getCart() {
  return JSON.parse(localStorage.getItem(getCartKey())) || [];
}
function setCart(cart) {
  localStorage.setItem(getCartKey(), JSON.stringify(cart));
}
function mergeGuestCartIntoUser() {
  const u = getCurrentUser();
  if (!u) return;
  const userKey = getCartKey();
  const guestKey = 'cart_guest';
  const guest = JSON.parse(localStorage.getItem(guestKey) || '[]');
  if (!guest.length) return;
  const userCart = JSON.parse(localStorage.getItem(userKey) || '[]');
  guest.forEach(g => {
    const idx = userCart.findIndex(i => String(i.id) === String(g.id));
    if (idx > -1) userCart[idx].quantity += g.quantity;
    else userCart.push(g);
  });
  localStorage.setItem(userKey, JSON.stringify(userCart));
  localStorage.removeItem(guestKey);
}
// ---- ТАЙМЕР ----
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  const now = new Date();
  const time = now.toLocaleTimeString('uk-UA', { hour12: false });
  const date = now.toLocaleDateString('uk-UA');
  el.textContent = `${time} ${date}`;
}
setInterval(updateClock, 1000);
updateClock();
// ---- МОДАЛКА ТРЕБУЕТСЯ ВХОД ----
function showAuthRequired() {
  document.getElementById('auth-required').classList.remove('hidden');
}
function closeAuthRequired() {
  document.getElementById('auth-required').classList.add('hidden');
}
function addToCart(productId) {
  const user = getCurrentUser();
  if (!user) {
    showAuthRequired();
    return;
  }
  const cart = getCart();
  const product = products.find(p => String(p.id) === String(productId));
  if (!product) return;
  const idx = cart.findIndex(i => String(i.id) === String(productId));
  if (idx > -1) cart[idx].quantity += 1;
  else cart.push({ id: product.id, name: product.name, price: product.price, image: product.image, quantity: 1 });
  setCart(cart);
  alert('Товар добавлен в вашу корзину');
}
mergeGuestCartIntoUser();
