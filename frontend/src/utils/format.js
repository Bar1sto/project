// Универсальный форматтер цены: принимает число ИЛИ строку
// Возвращает разряды с обычными пробелами: 9 999 999
export function formatPrice(value) {
  if (value == null || value === "") return "-";

  // Приводим к числу: выкидываем любые пробелы, заменяем запятую на точку
  const num = typeof value === "number"
    ? value
    : Number(String(value).replace(/\s/g, "").replace(",", "."));

  if (Number.isNaN(num)) {
    // ну ок, вернём что дали (строка из бэка уже с пробелами)
    return String(value);
  }

  // Если нужны копейки — раскоменти: toFixed(2) вместо округления
  const int = Math.round(num).toString();

  // Вставляем пробелы между тысячами
  return int.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}