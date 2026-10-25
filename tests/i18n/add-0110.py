#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""0.11.0 messages: Get colour palette, the menu renamed to just "Imgkeep", and the store summary.
Adds or updates these keys in every locale (English first), keeping the English key order."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOC = os.path.join(ROOT, "extension", "_locales")
LANGS = ["en", "he", "es", "pt_BR", "de", "fr", "ja", "hi", "ar"]

def ph(**kw):
    return {k: {"content": f"${i + 1}", "example": v} for i, (k, v) in enumerate(kw.items())}

# key: (description, placeholders, after_key, [en, he, es, pt_BR, de, fr, ja, hi, ar])
M = {
 "extDescription": ("Store summary. Max 132 characters.", None, None, [
  "Right-click to save any image as PNG, JPG, WebP, GIF or PDF, or get its colour palette. On your device. No personal data.",
  "לחיצה ימנית לשמירת כל תמונה כ-PNG, JPG, WebP, GIF או PDF, או לקבלת פלטת הצבעים שלה. במחשב שלך. בלי מידע אישי.",
  "Clic derecho: guarda cualquier imagen como PNG, JPG, WebP, GIF o PDF, o saca su paleta. En tu equipo. Sin datos personales.",
  "Botão direito: salve qualquer imagem como PNG, JPG, WebP, GIF ou PDF, ou pegue a paleta de cores. No seu PC. Sem dados pessoais.",
  "Rechtsklick: jedes Bild als PNG, JPG, WebP, GIF oder PDF speichern oder seine Farbpalette holen. Lokal. Keine persönlichen Daten.",
  "Clic droit : enregistrez toute image en PNG, JPG, WebP, GIF ou PDF, ou prenez sa palette. En local. Aucune donnée personnelle.",
  "右クリックで画像をPNG・JPG・WebP・GIF・PDFとして保存、またはカラーパレットを取得。処理はパソコン上で。個人データの収集なし。",
  "राइट-क्लिक करके किसी भी इमेज को PNG, JPG, WebP, GIF या PDF में सेव करें या उसका कलर पैलेट पाएं। आपके डिवाइस पर। कोई निजी डेटा नहीं।",
  "انقر بالزر الأيمن لحفظ أي صورة بصيغة PNG أو JPG أو WebP أو GIF أو PDF، أو أخذ لوحة ألوانها. على جهازك. بلا بيانات شخصية."]),
 "menuParent": ("Right-click menu entry on images. Since 0.11.0 just the name: it holds saving, copying and the colour palette.", None, None, ["Imgkeep"] * 9),
 "menuPalette": ("Right-click menu item: shows the image's main colours. Also the palette window's button in More options.", None, "menuCopyPng", [
  "Get colour palette", "קבלת פלטת צבעים", "Obtener paleta de colores", "Obter paleta de cores", "Farbpalette holen", "Obtenir la palette de couleurs", "カラーパレットを取得", "कलर पैलेट पाएं", "الحصول على لوحة الألوان"]),
 "paletteTitle": ("Palette window title and heading", None, None, [
  "Colour palette", "פלטת צבעים", "Paleta de colores", "Paleta de cores", "Farbpalette", "Palette de couleurs", "カラーパレット", "कलर पैलेट", "لوحة الألوان"]),
 "paletteLoading": ("While the colours are worked out", None, "paletteTitle", [
  "Finding the colours…", "מחפש את הצבעים…", "Buscando los colores…", "Procurando as cores…", "Farben werden gesucht…", "Recherche des couleurs…", "色を探しています…", "रंग खोजे जा रहे हैं…", "جارٍ البحث عن الألوان…"]),
 "paletteCount": ("Label of the 5 / 8 / 12 switch: how many colours to show", None, "paletteLoading", [
  "Colours", "צבעים", "Colores", "Cores", "Farben", "Couleurs", "色の数", "रंग", "الألوان"]),
 "paletteSwatches": ("Screen-reader label of the list of colours", None, "paletteCount", [
  "The image's main colours, largest first", "הצבעים העיקריים בתמונה, מהגדול לקטן", "Los colores principales de la imagen, de mayor a menor", "As cores principais da imagem, da maior para a menor", "Die Hauptfarben des Bildes, größte zuerst", "Les couleurs principales de l'image, de la plus présente à la moins présente", "画像の主な色（多い順）", "इमेज के मुख्य रंग, सबसे ज़्यादा वाले पहले", "الألوان الرئيسية في الصورة، الأكثر أولًا"]),
 "paletteCopyOne": ("Tooltip and label of one colour. $VALUE$ is e.g. #C8A27A, $SHARE$ e.g. 32%", ph(value="#C8A27A", share="32%"), "paletteSwatches", [
  "Copy $VALUE$ ($SHARE$ of the image)", "העתקת $VALUE$ ($SHARE$ מהתמונה)", "Copiar $VALUE$ ($SHARE$ de la imagen)", "Copiar $VALUE$ ($SHARE$ da imagem)", "$VALUE$ kopieren ($SHARE$ des Bildes)", "Copier $VALUE$ ($SHARE$ de l'image)", "$VALUE$ をコピー（画像の $SHARE$）", "$VALUE$ कॉपी करें (इमेज का $SHARE$)", "نسخ $VALUE$ ($SHARE$ من الصورة)"]),
 "paletteCopied": ("Status after copying one colour", ph(value="#C8A27A"), "paletteCopyOne", [
  "Copied $VALUE$", "הועתק: $VALUE$", "Copiado: $VALUE$", "Copiado: $VALUE$", "Kopiert: $VALUE$", "Copié : $VALUE$", "コピーしました：$VALUE$", "कॉपी किया गया: $VALUE$", "تم النسخ: $VALUE$"]),
 "paletteCopyAll": ("Label before the buttons that copy every colour as code", None, "paletteCopied", [
  "Copy all as", "העתקת הכול כ־", "Copiar todo como", "Copiar tudo como", "Alle kopieren als", "Tout copier en", "まとめてコピー", "सब कॉपी करें इस रूप में", "نسخ الكل بصيغة"]),
 "paletteCodeCss": ("Button: CSS custom properties (--color-1 …)", None, "paletteCopyAll", [
  "CSS variables", "משתני CSS", "Variables CSS", "Variáveis CSS", "CSS-Variablen", "Variables CSS", "CSS変数", "CSS वेरिएबल", "متغيرات CSS"]),
 "paletteCodeTailwind": ("Button: a Tailwind colors snippet. Product name, keep it.", None, "paletteCodeCss", ["Tailwind"] * 9),
 "paletteCodeJson": ("Button: a JSON array", None, "paletteCodeTailwind", ["JSON"] * 9),
 "paletteCodeList": ("Button: one colour per line", None, "paletteCodeJson", [
  "List", "רשימה", "Lista", "Lista", "Liste", "Liste", "リスト", "सूची", "قائمة"]),
 "paletteCopiedAll": ("Status after copying all colours. $KIND$ is the button's name (CSS variables, Tailwind…)", ph(kind="CSS variables"), "paletteCodeList", [
  "Copied all colours as $KIND$", "כל הצבעים הועתקו: $KIND$", "Todos los colores copiados como $KIND$", "Todas as cores copiadas como $KIND$", "Alle Farben als $KIND$ kopiert", "Toutes les couleurs copiées en $KIND$", "すべての色を $KIND$ としてコピーしました", "सभी रंग $KIND$ के रूप में कॉपी किए गए", "نُسخت كل الألوان بصيغة $KIND$"]),
 "paletteSaveAs": ("Label before the buttons that save the palette as a file", None, "paletteCopiedAll", [
  "Save as", "שמירה כ־", "Guardar como", "Salvar como", "Speichern als", "Enregistrer en", "ファイルに保存", "इस रूप में सेव करें", "حفظ بصيغة"]),
 "paletteSavePng": ("Button: a PNG image with one block per colour and its HEX value", None, "paletteSaveAs", [
  "PNG swatches", "דוגמיות PNG", "Muestras PNG", "Amostras PNG", "PNG-Farbfelder", "Nuancier PNG", "PNGスウォッチ", "PNG स्वैच", "عينات PNG"]),
 "paletteSaveGpl": ("Button: a .gpl palette file (GIMP, Inkscape, Krita)", None, "paletteSavePng", [
  "GIMP palette", "פלטת GIMP", "Paleta de GIMP", "Paleta do GIMP", "GIMP-Palette", "Palette GIMP", "GIMPパレット", "GIMP पैलेट", "لوحة GIMP"]),
 "paletteSaveAse": ("Button: an .ase swatch file (Illustrator, Photoshop, InDesign)", None, "paletteSaveGpl", [
  "Adobe swatches", "דוגמיות Adobe", "Muestras de Adobe", "Amostras da Adobe", "Adobe-Farbfelder", "Nuancier Adobe", "Adobeスウォッチ", "Adobe स्वैच", "عينات Adobe"]),
 "paletteSavedFallback": ("Status: the chosen folder couldn't be used, so the small palette file went to Downloads", ph(path="photo-palette.gpl"), "paletteSaveAse", [
  "Your folder wasn't available, so it went to Downloads: $PATH$", "התיקייה שלך לא הייתה זמינה, אז הקובץ נשמר בהורדות: $PATH$", "Tu carpeta no estaba disponible, así que se guardó en Descargas: $PATH$", "Sua pasta não estava disponível, então foi para Downloads: $PATH$", "Dein Ordner war nicht verfügbar, daher ging die Datei in Downloads: $PATH$", "Votre dossier n'était pas disponible, le fichier est donc allé dans Téléchargements : $PATH$", "指定のフォルダが使えなかったため、ダウンロードに保存しました：$PATH$", "आपका फ़ोल्डर उपलब्ध नहीं था, इसलिए फ़ाइल डाउनलोड में गई: $PATH$", "لم يكن مجلدك متاحًا، لذا حُفظ الملف في التنزيلات: $PATH$"]),
 "paletteEmpty": ("The image has no visible pixels", None, "paletteSavedFallback", [
  "This image is fully transparent, so it has no colours to take.", "התמונה שקופה לגמרי, אז אין בה צבעים.", "Esta imagen es totalmente transparente, así que no tiene colores.", "Esta imagem é totalmente transparente, então não tem cores.", "Dieses Bild ist vollständig transparent und hat daher keine Farben.", "Cette image est entièrement transparente, elle n'a donc pas de couleurs.", "この画像は完全に透明なので、色がありません。", "यह इमेज पूरी तरह पारदर्शी है, इसलिए इसमें कोई रंग नहीं है।", "هذه الصورة شفافة بالكامل، لذا لا ألوان فيها."]),
 "paletteCopyFailed": ("The clipboard refused the text (usually the window lost focus)", None, "paletteEmpty", [
  "Couldn't copy. Click inside this window, then try again.", "ההעתקה נכשלה. לחצו בתוך החלון ונסו שוב.", "No se pudo copiar. Haz clic dentro de esta ventana y vuelve a intentarlo.", "Não foi possível copiar. Clique dentro desta janela e tente de novo.", "Kopieren hat nicht geklappt. Klick in dieses Fenster und versuch es noch einmal.", "Impossible de copier. Cliquez dans cette fenêtre, puis réessayez.", "コピーできませんでした。このウィンドウ内をクリックしてから、もう一度お試しください。", "कॉपी नहीं हो सका। इस विंडो के अंदर क्लिक करें, फिर दोबारा कोशिश करें।", "تعذّر النسخ. انقر داخل هذه النافذة ثم حاول مجددًا."]),
 "paletteNote": ("Small print at the bottom of the palette window", None, "paletteCopyFailed", [
  "Worked out on your computer. The image and its colours never leave it.", "הצבעים מחושבים במחשב שלך. התמונה והצבעים שלה לא יוצאים ממנו.", "Se calcula en tu equipo. La imagen y sus colores nunca salen de él.", "Calculado no seu computador. A imagem e as cores dela nunca saem dele.", "Wird auf deinem Computer berechnet. Das Bild und seine Farben verlassen ihn nie.", "Calculé sur votre ordinateur. L'image et ses couleurs ne le quittent jamais.", "色はパソコン上で計算されます。画像もその色も外に送られることはありません。", "आपके कंप्यूटर पर निकाला जाता है। इमेज और उसके रंग कभी बाहर नहीं जाते।", "تُحسب على جهازك. الصورة وألوانها لا تغادره أبدًا."]),
}

def path(lang):
    return os.path.join(LOC, lang, "messages.json")

en = json.load(open(path("en"), encoding="utf-8"))
order = list(en)
for key, (desc, phs, after, texts) in M.items():
    if key in en:
        en[key]["message"] = texts[0]
        en[key]["description"] = desc
        continue
    en[key] = {"message": texts[0], "description": desc}
    if phs:
        en[key]["placeholders"] = phs
    if after and after in order:
        order.insert(order.index(after) + 1, key)
    else:
        order.append(key)
en = {k: en[k] for k in order}
for i, lang in enumerate(LANGS):
    data = en if lang == "en" else json.load(open(path(lang), encoding="utf-8"))
    for key, (_, _, _, texts) in M.items():
        entry = data.get(key, {})
        entry["message"] = texts[i]
        if "placeholders" in en[key]:
            entry["placeholders"] = en[key]["placeholders"]
        data[key] = entry
    data = {k: data[k] for k in order if k in data}
    with open(path(lang), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(lang, len(data), len(data["extDescription"]["message"]))
