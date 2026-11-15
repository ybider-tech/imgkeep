// The right store for this browser, or none on a phone. It reads the browser's name and kind of device in the
// page and sends or stores nothing.
//
// On a phone or tablet: no browser there can install Imgkeep, so its install links would lead to a dead end.
// Instead the header's Get Imgkeep goes, each set of install buttons becomes "Open the free converter" with a
// line saying Imgkeep is for computers, and on the converter (or palette) pages, a line that the tool above
// works right here. The download page's list stays, with that line above it. In the page's own language.
//
// In Firefox and Edge (on a computer): the pages are written for Chrome, so this points their install links to
// Firefox Add-ons or Edge Add-ons instead, in every language:
//   - a link to the Chrome Web Store goes to this browser's store, and "Chrome" in its text becomes
//     "Firefox" or "Edge" ("Add to Chrome — free" → "Add to Edge — free", "Get Imgkeep" just changes address);
//   - a link to this browser's store that names it ("Also for Firefox") becomes the Chrome one ("Also for Chrome").
// Left alone: links about a store itself (ratings, "Firefox Add-ons", "Microsoft Edge"), the download page's
// list of all three stores (.store), and the third browser's link. utm_campaign gets "-firefox" or "-edge",
// so the counts can tell these apart.
(() => {
  const ua = navigator.userAgent;
  const STORE = {
    Chrome: "https://chromewebstore.google.com/detail/fkclfgbmjaafglfifenonfcahfdmajbl",
    Firefox: "https://addons.mozilla.org/firefox/addon/imgkeep/",
    Edge: "https://microsoftedge.microsoft.com/addons/detail/kokbmagcbobpjclpidebikeklmpafhhd",
  };
  // The same test as count.js. iPads say "Macintosh" but have touch.
  const mobile = /iPad|Tablet|Mobi|iPhone|iPod|Android/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);

  // [Imgkeep is for computers…, the button, on a converter page]
  const SAY = {
    en: ["Imgkeep is an extension for computers. On your phone, the free online converter does the same, with nothing to install.", "Open the free converter", "On a phone? The tool above works right here, with nothing to install."],
    es: ["Imgkeep es una extensión para ordenadores. En el móvil, el conversor online gratuito hace lo mismo, sin instalar nada.", "Abrir el conversor gratuito", "¿Desde el móvil? La herramienta de arriba funciona aquí mismo, sin instalar nada."],
    "zh-Hans": ["Imgkeep 是电脑浏览器扩展。在手机上，免费的在线转换器也能做到，无需安装。", "打开免费转换器", "在用手机？上面的工具直接就能用，无需安装。"],
    "pt-BR": ["O Imgkeep é uma extensão para computador. No celular, o conversor online gratuito faz o mesmo, sem instalar nada.", "Abrir o conversor gratuito", "Está no celular? A ferramenta acima funciona aqui mesmo, sem instalar nada."],
    ja: ["Imgkeepはパソコン用の拡張機能です。スマートフォンでは、無料のオンライン変換ツールで同じことができます（インストール不要）。", "無料の変換ツールを開く", "スマートフォンからですか？上のツールならこのまま使えます。インストールは不要です。"],
    ar: ["Imgkeep إضافة لمتصفحات الكمبيوتر. على هاتفك، يقوم المحوّل المجاني عبر الإنترنت بالمهمة نفسها دون تثبيت أي شيء.", "افتح المحوّل المجاني", "تستخدم الهاتف؟ الأداة أعلاه تعمل هنا مباشرة دون تثبيت أي شيء."],
    fr: ["Imgkeep est une extension pour ordinateur. Sur votre téléphone, le convertisseur en ligne gratuit fait la même chose, sans rien installer.", "Ouvrir le convertisseur gratuit", "Sur téléphone ? L'outil ci-dessus fonctionne directement ici, sans rien installer."],
    de: ["Imgkeep ist eine Erweiterung für Computer. Auf dem Handy erledigt der kostenlose Online-Konverter dasselbe, ganz ohne Installation.", "Kostenlosen Konverter öffnen", "Am Handy? Das Tool oben funktioniert direkt hier, ohne Installation."],
    ru: ["Imgkeep — расширение для компьютера. На телефоне то же самое сделает бесплатный онлайн-конвертер, ничего устанавливать не нужно.", "Открыть бесплатный конвертер", "С телефона? Инструмент выше работает прямо здесь, ничего устанавливать не нужно."],
    uk: ["Imgkeep — розширення для комп'ютера. На телефоні те саме зробить безкоштовний онлайн-конвертер, нічого не потрібно встановлювати.", "Відкрити безкоштовний конвертер", "З телефона? Інструмент вище працює просто тут, нічого не потрібно встановлювати."],
    ko: ["Imgkeep은 컴퓨터용 확장 프로그램입니다. 휴대폰에서는 무료 온라인 변환기로 설치 없이 같은 작업을 할 수 있습니다.", "무료 변환기 열기", "휴대폰이신가요? 위의 도구는 설치 없이 여기서 바로 사용할 수 있습니다."],
    it: ["Imgkeep è un'estensione per computer. Sul telefono, il convertitore online gratuito fa la stessa cosa, senza installare nulla.", "Apri il convertitore gratuito", "Sei sul telefono? Lo strumento qui sopra funziona direttamente qui, senza installare nulla."],
    he: ["Imgkeep הוא תוסף למחשב. בטלפון, הממיר המקוון החינמי עושה את אותו הדבר, בלי להתקין כלום.", "פתיחת הממיר החינמי", "בטלפון? הכלי שלמעלה עובד כאן, בלי להתקין כלום."],
  };

  const onPhone = () => {
    const lang = document.documentElement.lang;
    const [forComputers, button, toolAbove] = SAY[lang] || SAY.en;
    const converter = SAY[lang] && lang !== "en" ? `/${lang === "zh-Hans" ? "zh" : lang.toLowerCase()}/convert/` : "/convert/";
    const note = (text, tag = "span") => Object.assign(document.createElement(tag), { className: "cta-note mobile-note", textContent: text });
    const buttonAndNote = () => {
      const a = Object.assign(document.createElement("a"), { className: "cta", href: converter, textContent: button });
      return [a, note(forComputers)];
    };
    document.querySelectorAll("header a.get").forEach((a) => a.remove());
    // Converter and palette pages: the tool is right above.
    document.querySelectorAll(".cv-ext-links").forEach((p) => p.replaceWith(note(toolAbove, "p")));
    // The home page's install buttons.
    document.querySelectorAll(".install").forEach((div) => div.replaceChildren(...buttonAndNote()));
    // Guide pages: the one button, and its "Works in Chrome…" note.
    for (const a of document.querySelectorAll("a.cta[href]")) {
      if (a.closest(".store, .install") || !a.href.startsWith(STORE.Chrome)) continue;
      const after = a.nextElementSibling;
      if (after?.classList.contains("cta-note")) after.remove();
      a.replaceWith(...buttonAndNote());
    }
    // The converter's "Get the free extension" line after a conversion (its script still shows it: keep it hidden).
    document.querySelectorAll(".cv-hook").forEach((p) => (p.style.display = "none"));
    // The download page: the stores stay listed, with the line above them.
    const list = document.querySelector(".store")?.parentElement;
    if (list) list.before(note(forComputers, "p"));
    // Any other store link (a name in a sentence) goes to the download page, which explains.
    for (const a of document.querySelectorAll("a[href]")) {
      if (a.closest(".store, .rating, .cv-hook")) continue;
      if ([STORE.Chrome, STORE.Firefox, STORE.Edge].some((s) => a.href.startsWith(s))) a.href = "/download/";
    }
  };

  const name = /\bFirefox\//.test(ua) ? "Firefox" : /\bEdg\//.test(ua) ? "Edge" : null;
  const ABOUT_A_STORE = /Web Store|Add-ons|Google Chrome|Microsoft Edge|Mozilla/;
  const swap = (a, from, to) => {
    const query = new URLSearchParams(a.search);
    if (query.has("utm_campaign")) query.set("utm_campaign", `${query.get("utm_campaign")}-${name.toLowerCase()}`);
    a.href = STORE[to] + (query.size ? `?${query}` : "");
    // Only the browser's name changes, in the link's own text (not its icons or other markup).
    const walker = document.createTreeWalker(a, NodeFilter.SHOW_TEXT);
    for (let t; (t = walker.nextNode()); ) t.nodeValue = t.nodeValue.replaceAll(from, to);
  };
  const otherBrowser = () => {
    for (const a of document.querySelectorAll("a[href]")) {
      if (a.closest(".store, .rating")) continue;
      const text = `${a.textContent} ${a.getAttribute("aria-label") || ""}`;
      if (ABOUT_A_STORE.test(text)) continue;
      if (a.href === STORE.Chrome || a.href.startsWith(`${STORE.Chrome}?`)) swap(a, "Chrome", name);
      else if (a.href.startsWith(STORE[name]) && text.includes(name)) swap(a, name, "Chrome");
    }
  };

  const run = mobile ? onPhone : name ? otherBrowser : null;
  if (!run) return;
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run);
  else run();
})();
