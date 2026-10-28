// Offers this page in the visitor's own language, when imgkeep.app has it: one line at the top, never a
// redirect. It only reads the page's <link rel="alternate" hreflang> list and the browser's languages, and
// stores nothing (so a closed hint can show again on the next page).
(() => {
  const SAY = {
    en: ["This page is also in English.", "Close"],
    es: ["Esta página también está en español.", "Cerrar"],
    "zh-Hans": ["此页面也有简体中文版。", "关闭"],
    "pt-BR": ["Esta página também está em português.", "Fechar"],
    ja: ["このページは日本語でもご覧いただけます。", "閉じる"],
    ar: ["هذه الصفحة متوفرة أيضًا بالعربية.", "إغلاق"],
    fr: ["Cette page existe aussi en français.", "Fermer"],
    de: ["Diese Seite gibt es auch auf Deutsch.", "Schließen"],
    ru: ["Эта страница есть и на русском.", "Закрыть"],
    uk: ["Ця сторінка є й українською.", "Закрити"],
    ko: ["이 페이지는 한국어로도 볼 수 있습니다.", "닫기"],
    it: ["Questa pagina è disponibile anche in italiano.", "Chiudi"],
    he: ["הדף הזה זמין גם בעברית.", "סגירה"],
  };
  const here = document.documentElement.lang;
  const versions = [...document.querySelectorAll('link[rel="alternate"][hreflang]')].filter((l) => l.hreflang !== "x-default");
  if (versions.length < 2) return;
  const base = (code) => code.toLowerCase().split("-")[0];
  // Chinese: only Simplified Chinese readers get the zh-Hans page (not zh-TW or zh-HK).
  const fits = (want, have) =>
    want.toLowerCase() === have.toLowerCase() ||
    (base(want) === base(have) && (base(want) !== "zh" || /^zh(-(cn|sg|hans.*))?$/i.test(want)));
  for (const want of navigator.languages || [navigator.language]) {
    const v = versions.find((l) => fits(want, l.hreflang));
    if (!v) continue;
    if (v.hreflang === here || !SAY[v.hreflang]) return;
    const [text, close] = SAY[v.hreflang];
    const bar = document.createElement("div");
    bar.className = "lang-hint";
    bar.lang = v.hreflang;
    bar.dir = v.hreflang === "ar" || v.hreflang === "he" ? "rtl" : "ltr";
    const a = Object.assign(document.createElement("a"), { href: v.href, textContent: text, hreflang: v.hreflang });
    const x = Object.assign(document.createElement("button"), { type: "button", textContent: "×" });
    x.setAttribute("aria-label", close);
    x.addEventListener("click", () => bar.remove());
    bar.append(a, x);
    document.body.prepend(bar);
    return;
  }
})();
