// Monthly reading. Tries a live horoscope feed (cached for the month),
// and always has a tasteful, on-brand fallback that rotates by month +
// sign — so it's never blank and never the same two months running.

const TONE = [
  "This month favors bold, considered moves — the kind made in good light.",
  "Slow down enough to notice the details; they're where the magic is hiding.",
  "An opening you've been waiting on finally clears. Step through it.",
  "Tend to what you've built. Quiet maintenance becomes momentum.",
  "Say yes to the invitation that scares you a little — it's the good one.",
  "Clarity arrives once you stop forcing it. Let the picture develop.",
  "Generosity returns to you threefold this month. Give first.",
  "A creative risk pays off. Trust your composition.",
  "Rest is productive now. Protect the hours that restore you.",
  "Someone is watching your work more closely than you think. Keep going.",
  "Edit ruthlessly — in your calendar as much as your craft.",
  "The season rewards patience and a steady hand. You have both.",
];

const SIGN_FLAVOR = {
  Aries: "Your fire is an asset when aimed.",
  Taurus: "Comfort and ambition can share a table.",
  Gemini: "Two ideas want to become one — let them.",
  Cancer: "Home is your power source this month.",
  Leo: "The spotlight finds you; wear it well.",
  Virgo: "Precision is your love language — use it kindly.",
  Libra: "Balance tips in your favor when you choose.",
  Scorpio: "Depth over speed wins every time now.",
  Sagittarius: "A horizon is calling. Plan the trip.",
  Capricorn: "The summit is closer than the climb suggests.",
  Aquarius: "Your strange idea is the right one.",
  Pisces: "Intuition is data. Listen to it.",
};

export function curatedReading(signName, date = new Date()) {
  const monthIdx = date.getFullYear() * 12 + date.getMonth();
  const base = TONE[monthIdx % TONE.length];
  const flavor = signName && SIGN_FLAVOR[signName] ? ` ${SIGN_FLAVOR[signName]}` : "";
  return `${base}${flavor}`;
}

const SIGN_SLUG = {
  Aries: "aries", Taurus: "taurus", Gemini: "gemini", Cancer: "cancer",
  Leo: "leo", Virgo: "virgo", Libra: "libra", Scorpio: "scorpio",
  Sagittarius: "sagittarius", Capricorn: "capricorn", Aquarius: "aquarius", Pisces: "pisces",
};

// Returns { text, sign, month, source }. Never throws.
export async function getMonthlyReading(signName) {
  const month = new Date().toLocaleString("en-US", { month: "long", year: "numeric" });
  if (signName && SIGN_SLUG[signName]) {
    try {
      const res = await fetch(
        `https://horoscope-app-api.vercel.app/api/v1/get-horoscope/monthly?sign=${SIGN_SLUG[signName]}`,
        { next: { revalidate: 60 * 60 * 24 } }
      );
      if (res.ok) {
        const json = await res.json();
        const text = json?.data?.horoscope_data;
        if (text && text.length > 20) return { text, sign: signName, month, source: "live" };
      }
    } catch {
      /* fall through to curated */
    }
  }
  return { text: curatedReading(signName), sign: signName, month, source: "curated" };
}
