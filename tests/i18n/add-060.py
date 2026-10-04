#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""0.6.0 messages: Copy as PNG, More options, maximum width, retry/open, Pro text. Adds or updates
these keys in every locale (English first), keeping the English key order."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOC = os.path.join(ROOT, "extension", "_locales")
LANGS = ["en", "he", "es", "pt_BR", "de", "fr", "ja", "hi", "ar"]

# key: (description, after_key, [en, he, es, pt_BR, de, fr, ja, hi, ar])
M = {
 "menuCopyPng": ("Right-click menu item: copies the image to the clipboard as PNG. Also the Copy window's title and button.", "menuOriginal",
  ["Copy as PNG", "העתקה כ-PNG", "Copiar como PNG", "Copiar como PNG", "Als PNG kopieren", "Copier en PNG", "PNGとしてコピー", "PNG के रूप में कॉपी करें", "نسخ بصيغة PNG"]),
 "menuMoreOptions": ("Right-click menu item: opens the More options window", "menuCopyPng",
  ["More options…", "אפשרויות נוספות…", "Más opciones…", "Mais opções…", "Weitere Optionen…", "Plus d'options…", "その他のオプション…", "और विकल्प…", "مزيد من الخيارات…"]),
 "askRetry": ("Button: try the same save or copy again", "askClose",
  ["Try again", "לנסות שוב", "Reintentar", "Tentar de novo", "Erneut versuchen", "Réessayer", "もう一度試す", "फिर से कोशिश करें", "إعادة المحاولة"]),
 "askOpenImage": ("Button: opens the image's web address in a new tab", "askRetry",
  ["Open image", "פתיחת התמונה", "Abrir imagen", "Abrir imagem", "Bild öffnen", "Ouvrir l'image", "画像を開く", "इमेज खोलें", "فتح الصورة"]),
 "copyWorking": ("Status while converting and copying", None,
  ["Copying the image…", "מעתיק את התמונה…", "Copiando la imagen…", "Copiando a imagem…", "Bild wird kopiert…", "Copie de l'image…", "画像をコピーしています…", "इमेज कॉपी हो रही है…", "جارٍ نسخ الصورة…"]),
 "copyDone": ("Status after a successful copy", None,
  ["Copied as PNG. Paste it anywhere.", "הועתק כ-PNG. אפשר להדביק בכל מקום.", "Copiada como PNG. Pégala donde quieras.", "Copiada como PNG. Cole onde quiser.", "Als PNG kopiert. Füge es überall ein.", "Copiée en PNG. Collez-la où vous voulez.", "PNGとしてコピーしました。どこにでも貼り付けられます。", "PNG के रूप में कॉपी हो गई। इसे कहीं भी पेस्ट करें।", "تم النسخ بصيغة PNG. الصقها في أي مكان."]),
 "copyFailed": ("Title when copying failed", None,
  ["Couldn't copy the image", "לא ניתן היה להעתיק את התמונה", "No se pudo copiar la imagen", "Não foi possível copiar a imagem", "Bild konnte nicht kopiert werden", "Impossible de copier l'image", "画像をコピーできませんでした", "इमेज कॉपी नहीं हो सकी", "تعذّر نسخ الصورة"]),
 "copyFailedNote": ("Text when the clipboard refused the image", None,
  ["Your clipboard wasn't changed. Try again, or save the image as a PNG file instead.", "הלוח לא השתנה. אפשר לנסות שוב, או לשמור את התמונה כקובץ PNG במקום.", "Tu portapapeles no ha cambiado. Inténtalo de nuevo o guarda la imagen como archivo PNG.", "Sua área de transferência não foi alterada. Tente de novo ou salve a imagem como arquivo PNG.", "Deine Zwischenablage wurde nicht verändert. Versuche es erneut oder speichere das Bild stattdessen als PNG-Datei.", "Votre presse-papiers n'a pas été modifié. Réessayez, ou enregistrez plutôt l'image en fichier PNG.", "クリップボードは変更されていません。もう一度試すか、代わりにPNGファイルとして保存してください。", "आपका क्लिपबोर्ड नहीं बदला। फिर से कोशिश करें, या इसके बजाय इमेज को PNG फ़ाइल के रूप में सेव करें।", "لم تتغير الحافظة. أعد المحاولة، أو احفظ الصورة كملف PNG بدلًا من ذلك."]),
 "copySavePng": ("Button: save the image as a PNG file instead of copying", None,
  ["Save as PNG instead", "לשמור כ-PNG במקום", "Guardar como PNG", "Salvar como PNG", "Stattdessen als PNG speichern", "Enregistrer en PNG à la place", "代わりにPNGで保存", "इसके बजाय PNG में सेव करें", "الحفظ بصيغة PNG بدلًا من ذلك"]),
 "copyAllowAndCopy": ("Button: allow access to the site, then copy", None,
  ["Allow and copy", "לאפשר ולהעתיק", "Permitir y copiar", "Permitir e copiar", "Erlauben und kopieren", "Autoriser et copier", "許可してコピー", "अनुमति दें और कॉपी करें", "السماح والنسخ"]),
 "editTitle": ("More options window title", None,
  ["More options", "אפשרויות נוספות", "Más opciones", "Mais opções", "Weitere Optionen", "Plus d'options", "その他のオプション", "और विकल्प", "مزيد من الخيارات"]),
 "editLoading": ("Shown while the image loads", None,
  ["Loading the image…", "טוען את התמונה…", "Cargando la imagen…", "Carregando a imagem…", "Bild wird geladen…", "Chargement de l'image…", "画像を読み込んでいます…", "इमेज लोड हो रही है…", "جارٍ تحميل الصورة…"]),
 "editUpdating": ("Shown while the preview is redone after a change", None,
  ["Updating preview…", "מעדכן את התצוגה המקדימה…", "Actualizando la vista previa…", "Atualizando a prévia…", "Vorschau wird aktualisiert…", "Mise à jour de l'aperçu…", "プレビューを更新しています…", "प्रीव्यू अपडेट हो रहा है…", "جارٍ تحديث المعاينة…"]),
 "editPreviewAlt": ("Alt text of the preview image", None,
  ["Preview of the result", "תצוגה מקדימה של התוצאה", "Vista previa del resultado", "Prévia do resultado", "Vorschau des Ergebnisses", "Aperçu du résultat", "仕上がりのプレビュー", "नतीजे का प्रीव्यू", "معاينة النتيجة"]),
 "editOriginal": ("Label before the original image's size", None,
  ["Original", "מקור", "Original", "Original", "Original", "Original", "元の画像", "मूल", "الأصل"]),
 "editResult": ("Label before the result's size, format and file size", None,
  ["Result", "תוצאה", "Resultado", "Resultado", "Ergebnis", "Résultat", "仕上がり", "नतीजा", "النتيجة"]),
 "editFormat": ("Label of the format choice", None,
  ["Format", "פורמט", "Formato", "Formato", "Format", "Format", "形式", "फ़ॉर्मैट", "الصيغة"]),
 "editPngHint": ("Hint under the format choice when PNG is chosen", None,
  ["PNG keeps every pixel. For a smaller file, lower the maximum width or choose JPG or WebP.", "PNG שומר על כל פיקסל. לקובץ קטן יותר, אפשר להקטין את הרוחב המרבי או לבחור JPG או WebP.", "PNG conserva cada píxel. Para un archivo más pequeño, baja el ancho máximo o elige JPG o WebP.", "PNG mantém cada pixel. Para um arquivo menor, reduza a largura máxima ou escolha JPG ou WebP.", "PNG behält jedes Pixel. Für eine kleinere Datei verringere die maximale Breite oder wähle JPG oder WebP.", "Le PNG conserve chaque pixel. Pour un fichier plus léger, réduisez la largeur maximale ou choisissez JPG ou WebP.", "PNGはすべてのピクセルを保持します。ファイルを小さくするには、最大幅を下げるか、JPGかWebPを選んでください。", "PNG हर पिक्सेल रखता है। छोटी फ़ाइल के लिए अधिकतम चौड़ाई कम करें या JPG या WebP चुनें।", "تحتفظ PNG بكل بكسل. للحصول على ملف أصغر، قلّل العرض الأقصى أو اختر JPG أو WebP."]),
 "editMaxWidthHint": ("Hint under the maximum width field", None,
  ["In pixels. Keeps the shape, never enlarges.", "בפיקסלים. שומר על הפרופורציות, אף פעם לא מגדיל.", "En píxeles. Mantiene la proporción y nunca amplía.", "Em pixels. Mantém a proporção e nunca amplia.", "In Pixeln. Behält die Form, vergrößert nie.", "En pixels. Garde les proportions, n'agrandit jamais.", "ピクセル単位。縦横比を保ち、拡大はしません。", "पिक्सेल में। आकार का अनुपात बना रहता है, कभी बड़ा नहीं करता।", "بالبكسل. يحافظ على النسب ولا يكبّر الصورة أبدًا."]),
 "editBackground": ("Label of the JPG background colour", None,
  ["Background", "רקע", "Fondo", "Fundo", "Hintergrund", "Arrière-plan", "背景", "बैकग्राउंड", "الخلفية"]),
 "editQuality": ("Label of the quality slider", None,
  ["Quality", "איכות", "Calidad", "Qualidade", "Qualität", "Qualité", "画質", "क्वालिटी", "الجودة"]),
 "editFileName": ("Label of the file name field", None,
  ["File name", "שם הקובץ", "Nombre del archivo", "Nome do arquivo", "Dateiname", "Nom du fichier", "ファイル名", "फ़ाइल का नाम", "اسم الملف"]),
 "editSave": ("Button: save with these options", None,
  ["Save", "שמירה", "Guardar", "Salvar", "Speichern", "Enregistrer", "保存", "सेव करें", "حفظ"]),
 "editAllow": ("Button: allow access to the site the image comes from", None,
  ["Allow this site", "לאפשר את האתר הזה", "Permitir este sitio", "Permitir este site", "Diese Website erlauben", "Autoriser ce site", "このサイトを許可", "इस साइट को अनुमति दें", "السماح لهذا الموقع"]),
 "editNeedsOk": ("Status when the save opened the small ask window", None,
  ["This save needs your OK: see the Imgkeep window that just opened.", "השמירה הזו צריכה את האישור שלך: כדאי לבדוק את חלון Imgkeep שנפתח עכשיו.", "Este guardado necesita tu aprobación: mira la ventana de Imgkeep que se acaba de abrir.", "Este salvamento precisa da sua confirmação: veja a janela do Imgkeep que acabou de abrir.", "Dieser Speichervorgang braucht deine Zustimmung: Sieh dir das Imgkeep-Fenster an, das sich gerade geöffnet hat.", "Cet enregistrement a besoin de votre accord : voyez la fenêtre Imgkeep qui vient de s'ouvrir.", "この保存には確認が必要です。開いたImgkeepのウィンドウをご覧ください。", "इस सेव के लिए आपकी मंज़ूरी चाहिए: अभी खुली Imgkeep विंडो देखें।", "يحتاج هذا الحفظ إلى موافقتك: راجع نافذة Imgkeep التي فُتحت للتو."]),
 "optMaxWidth": ("Label of the maximum width setting (Options and More options)", "optJpgBackgroundHint",
  ["Maximum width", "רוחב מרבי", "Ancho máximo", "Largura máxima", "Maximale Breite", "Largeur maximale", "最大幅", "अधिकतम चौड़ाई", "العرض الأقصى"]),
 "optMaxWidthPlaceholder": ("Placeholder of the empty maximum width field", "optMaxWidth",
  ["Original size", "גודל מקורי", "Tamaño original", "Tamanho original", "Originalgröße", "Taille d'origine", "元のサイズ", "मूल साइज़", "الحجم الأصلي"]),
 "optMaxWidthHint": ("Hint under the maximum width setting", "optMaxWidthPlaceholder",
  ["Optional, in pixels. Wider images are scaled down to fit, keeping their shape; smaller ones are never enlarged. Original format is always saved as it is.", "לא חובה, בפיקסלים. תמונות רחבות יותר מוקטנות כדי להתאים, עם אותן פרופורציות; תמונות קטנות יותר אף פעם לא מוגדלות. הפורמט המקורי תמיד נשמר כמו שהוא.", "Opcional, en píxeles. Las imágenes más anchas se reducen para caber, manteniendo su proporción; las más pequeñas nunca se amplían. El formato original siempre se guarda tal cual.", "Opcional, em pixels. Imagens mais largas são reduzidas para caber, mantendo a proporção; as menores nunca são ampliadas. O formato original é sempre salvo como está.", "Optional, in Pixeln. Breitere Bilder werden passend verkleinert und behalten ihre Form; kleinere werden nie vergrößert. Das Originalformat wird immer unverändert gespeichert.", "Facultatif, en pixels. Les images plus larges sont réduites pour tenir, en gardant leurs proportions ; les plus petites ne sont jamais agrandies. Le format d'origine est toujours enregistré tel quel.", "任意、ピクセル単位。これより幅の広い画像は縦横比を保って縮小され、小さい画像は拡大されません。元の形式はそのまま保存されます。", "वैकल्पिक, पिक्सेल में। ज़्यादा चौड़ी इमेज आकार का अनुपात बनाए रखते हुए छोटी की जाती हैं; छोटी इमेज कभी बड़ी नहीं की जातीं। मूल फ़ॉर्मैट हमेशा जैसा है वैसा सेव होता है।", "اختياري، بالبكسل. تُصغَّر الصور الأعرض لتناسبه مع الحفاظ على نسبها، ولا تُكبَّر الصور الأصغر أبدًا. تُحفظ الصيغة الأصلية دائمًا كما هي."]),
 "optQualityTitle": ("Section heading", None,
  ["Quality and size", "איכות וגודל", "Calidad y tamaño", "Qualidade e tamanho", "Qualität und Größe", "Qualité et taille", "画質とサイズ", "क्वालिटी और साइज़", "الجودة والحجم"]),
 "optProBody": ("Text: what the coming paid plan will add", None,
  ["Presets for the sizes and formats you use most, file-size targets like \"under 200 KB\", rules that send each site's images to the right folder, and a log of where every image came from.",
   "הגדרות קבועות לגדלים ולפורמטים הנפוצים אצלך, יעדי גודל קובץ כמו „עד 200 KB”, כללים ששולחים את התמונות מכל אתר לתיקייה הנכונה, ויומן של המקור של כל תמונה.",
   "Ajustes guardados para los tamaños y formatos que más usas, límites de tamaño de archivo como «menos de 200 KB», reglas que envían las imágenes de cada sitio a la carpeta correcta y un registro del origen de cada imagen.",
   "Predefinições para os tamanhos e formatos que você mais usa, limites de tamanho de arquivo como \"até 200 KB\", regras que mandam as imagens de cada site para a pasta certa e um registro da origem de cada imagem.",
   "Voreinstellungen für deine häufigsten Größen und Formate, Dateigrößen-Ziele wie „unter 200 KB“, Regeln, die die Bilder jeder Website in den richtigen Ordner legen, und ein Protokoll, woher jedes Bild stammt.",
   "Des préréglages pour les tailles et formats que vous utilisez le plus, des tailles de fichier cibles comme « moins de 200 Ko », des règles qui rangent les images de chaque site dans le bon dossier, et un journal de la provenance de chaque image.",
   "よく使うサイズと形式のプリセット、「200 KB以下」のようなファイルサイズの目標、サイトごとに画像を正しいフォルダへ送るルール、そしてすべての画像の取得元の記録。",
   "आपके सबसे ज़्यादा इस्तेमाल होने वाले साइज़ और फ़ॉर्मैट के प्रीसेट, \"200 KB से कम\" जैसे फ़ाइल साइज़ लक्ष्य, हर साइट की इमेज को सही फ़ोल्डर में भेजने वाले नियम, और हर इमेज कहाँ से आई इसका लॉग।",
   "إعدادات جاهزة للأحجام والصيغ التي تستخدمها أكثر، وأهداف لحجم الملف مثل \"أقل من 200 KB\"، وقواعد ترسل صور كل موقع إلى المجلد الصحيح، وسجل بمصدر كل صورة."]),
}

def path(lang):
    return os.path.join(LOC, lang, "messages.json")

en = json.load(open(path("en"), encoding="utf-8"))
# English: insert new keys after their anchor (or at the end), keep existing descriptions/placeholders.
order = list(en)
for key, (desc, after, texts) in M.items():
    if key in en:
        en[key]["message"] = texts[0]
        continue
    en[key] = {"message": texts[0], "description": desc}
    if after and after in order:
        order.insert(order.index(after) + 1, key)
    else:
        order.append(key)
en = {k: en[k] for k in order}
for i, lang in enumerate(LANGS):
    data = en if lang == "en" else json.load(open(path(lang), encoding="utf-8"))
    for key, (_, _, texts) in M.items():
        entry = data.get(key, {})
        entry["message"] = texts[i]
        if "placeholders" in en[key]:
            entry["placeholders"] = en[key]["placeholders"]
        data[key] = entry
    data = {k: data[k] for k in order if k in data}
    with open(path(lang), "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(lang, len(data))
