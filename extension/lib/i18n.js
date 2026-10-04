// Text in the user's browser language, from _locales/<lang>/messages.json (English is the fallback).
// Pages mark text with data-i18n attributes; scripts call t(key, subs).

export const t = (key, subs) => chrome.i18n.getMessage(key, subs) || key;

// Sets lang and text direction (Arabic and Hebrew read right to left), then fills marked elements:
//   data-i18n="key"                    → textContent
//   data-i18n-html="key"               → innerHTML (our own packaged strings; only <code> and <strong>, checked by a test)
//   data-i18n-placeholder="key"        → placeholder
//   data-i18n-aria-label="key"         → aria-label
//   data-i18n-alt="key"                → alt
export function localisePage(root = document) {
  document.documentElement.lang = chrome.i18n.getUILanguage();
  document.documentElement.dir = chrome.i18n.getMessage("@@bidi_dir") || "ltr";
  for (const el of root.querySelectorAll("[data-i18n]")) el.textContent = t(el.dataset.i18n);
  for (const el of root.querySelectorAll("[data-i18n-html]")) el.innerHTML = t(el.dataset.i18nHtml);
  for (const el of root.querySelectorAll("[data-i18n-placeholder]")) el.placeholder = t(el.dataset.i18nPlaceholder);
  for (const el of root.querySelectorAll("[data-i18n-aria-label]")) el.setAttribute("aria-label", t(el.dataset.i18nAriaLabel));
  for (const el of root.querySelectorAll("[data-i18n-alt]")) el.alt = t(el.dataset.i18nAlt);
}

// A message with one part in bold (a site or folder name, a button label), as DOM nodes.
// Word order differs between languages, so the bold part is placed wherever the translation puts it.
export function richText(key, strongText) {
  const marker = "";
  const [before, after = ""] = t(key, [marker]).split(marker);
  const strong = document.createElement("strong");
  strong.textContent = strongText;
  return [before, strong, after];
}
