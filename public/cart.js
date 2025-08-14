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
document.getElementById('checkout-btn').addEventListener('click', () => {
  if (!getCurrentUser()) {
    alert('Чтобы оформить покупку, войдите в аккаунт или зарегистрируйтесь.');
    return;
  }
  const total = calcTotal();
  if (total <= 0) {
    alert('Выберите хотя бы один товар.');
    return;
  }
  openPaymentModal();
});
