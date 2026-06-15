// Western sun sign from month + day; Chinese sign from (optional) year.
// Client-safe: pure functions.

const WESTERN = [
  { sign: "Capricorn", glyph: "♑", from: [12, 22], to: [1, 19] },
  { sign: "Aquarius", glyph: "♒", from: [1, 20], to: [2, 18] },
  { sign: "Pisces", glyph: "♓", from: [2, 19], to: [3, 20] },
  { sign: "Aries", glyph: "♈", from: [3, 21], to: [4, 19] },
  { sign: "Taurus", glyph: "♉", from: [4, 20], to: [5, 20] },
  { sign: "Gemini", glyph: "♊", from: [5, 21], to: [6, 20] },
  { sign: "Cancer", glyph: "♋", from: [6, 21], to: [7, 22] },
  { sign: "Leo", glyph: "♌", from: [7, 23], to: [8, 22] },
  { sign: "Virgo", glyph: "♍", from: [8, 23], to: [9, 22] },
  { sign: "Libra", glyph: "♎", from: [9, 23], to: [10, 22] },
  { sign: "Scorpio", glyph: "♏", from: [10, 23], to: [11, 21] },
  { sign: "Sagittarius", glyph: "♐", from: [11, 22], to: [12, 21] },
];

export function westernSign(month, day) {
  const m = Number(month), d = Number(day);
  if (!m || !d) return null;
  for (const w of WESTERN) {
    const [fm, fd] = w.from;
    const [tm, td] = w.to;
    if (fm <= tm) {
      if ((m === fm && d >= fd) || (m === tm && d <= td) || (m > fm && m < tm)) return w;
    } else {
      // wraps the year-end (Capricorn)
      if ((m === fm && d >= fd) || (m === tm && d <= td) || m > fm || m < tm) return w;
    }
  }
  return null;
}

const CHINESE = [
  { sign: "Rat", glyph: "🐀" },
  { sign: "Ox", glyph: "🐂" },
  { sign: "Tiger", glyph: "🐅" },
  { sign: "Rabbit", glyph: "🐇" },
  { sign: "Dragon", glyph: "🐉" },
  { sign: "Snake", glyph: "🐍" },
  { sign: "Horse", glyph: "🐎" },
  { sign: "Goat", glyph: "🐐" },
  { sign: "Monkey", glyph: "🐒" },
  { sign: "Rooster", glyph: "🐓" },
  { sign: "Dog", glyph: "🐕" },
  { sign: "Pig", glyph: "🐖" },
];

export function chineseSign(year) {
  const y = Number(year);
  if (!y || y < 1900) return null;
  // Approximate (ignores the lunar-new-year boundary in Jan/Feb).
  return CHINESE[((y - 4) % 12 + 12) % 12];
}

export function zodiacFor({ birthMonth, birthDay, birthYear } = {}) {
  return {
    western: westernSign(birthMonth, birthDay),
    chinese: chineseSign(birthYear),
  };
}

const MONTHS = ["", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function birthdayLabel({ birthMonth, birthDay } = {}) {
  if (!birthMonth || !birthDay) return "";
  return `${MONTHS[Number(birthMonth)]} ${Number(birthDay)}`;
}

// Days until the next occurrence of this birthday (for upcoming lists).
export function daysUntilBirthday({ birthMonth, birthDay } = {}, from = new Date()) {
  const m = Number(birthMonth), d = Number(birthDay);
  if (!m || !d) return null;
  const today = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  let next = new Date(from.getFullYear(), m - 1, d);
  if (next < today) next = new Date(from.getFullYear() + 1, m - 1, d);
  return Math.round((next - today) / 86400000);
}
