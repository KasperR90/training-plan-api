function getMonday(dateString) {
  const d = new Date(dateString);
  const day = d.getDay(); // 0 = zondag, 1 = maandag
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  return new Date(d.setDate(diff));
}

module.exports = { getMonday };
