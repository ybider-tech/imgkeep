#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""0.7.0 messages: the anonymous daily summary (Options) and the store summary without "No tracking".
Adds or updates these keys in every locale (English first), keeping the English key order."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOC = os.path.join(ROOT, "extension", "_locales")
LANGS = ["en", "he", "es", "pt_BR", "de", "fr", "ja", "hi", "ar"]

# key: (description, placeholders, after_key, [en, he, es, pt_BR, de, fr, ja, hi, ar])
M = {
 "extDescription": ("Store summary, at most 132 characters", None, None, [
  "Right-click to save any image as PNG, JPG, WebP, GIF or PDF. Converts WebP and AVIF on your device. No personal data.",
  "לחיצה ימנית לשמירת כל תמונה כ-PNG, JPG, WebP, GIF או PDF. ממיר WebP ו-AVIF במחשב שלך, ישר לתיקייה שלך. בלי מידע אישי.",
  "Clic derecho para guardar cualquier imagen como PNG, JPG, WebP, GIF o PDF. Convierte WebP y AVIF en tu equipo. Sin datos personales.",
  "Botão direito para salvar qualquer imagem como PNG, JPG, WebP, GIF ou PDF. Converte WebP e AVIF no PC. Sem dados pessoais.",
  "Per Rechtsklick jedes Bild als PNG, JPG, WebP, GIF oder PDF speichern. WebP und AVIF lokal umwandeln. Keine persönlichen Daten.",
  "Clic droit : enregistrez toute image en PNG, JPG, WebP, GIF ou PDF. Convertit WebP et AVIF en local. Aucune donnée personnelle.",
  "右クリックで画像をPNG・JPG・WebP・GIF・PDFとして保存。WebPやAVIFをパソコン上で変換し、指定のフォルダへ。個人データの収集なし。",
  "राइट-क्लिक करके किसी भी इमेज को PNG, JPG, WebP, GIF या PDF में सेव करें। WebP और AVIF आपके डिवाइस पर बदलें। कोई निजी डेटा नहीं।",
  "انقر بزر الماوس الأيمن لحفظ أي صورة بصيغة PNG أو JPG أو WebP أو GIF أو PDF. تحويل WebP وAVIF على جهازك. بلا بيانات شخصية."]),
 "optCountsTitle": ("Options section heading: the anonymous daily summary", None, "optSitesEmpty", [
  "Anonymous usage counts", "ספירות שימוש אנונימיות", "Recuentos de uso anónimos", "Contagens de uso anônimas", "Anonyme Nutzungszahlen", "Statistiques d'utilisation anonymes", "匿名の利用回数", "गुमनाम इस्तेमाल गिनती", "إحصاءات استخدام مجهولة"]),
 "optCountsLabel": ("Checkbox label (on by default)", None, "optCountsTitle", [
  "Send an anonymous daily summary", "לשלוח סיכום יומי אנונימי", "Enviar un resumen diario anónimo", "Enviar um resumo diário anônimo", "Eine anonyme tägliche Zusammenfassung senden", "Envoyer un résumé quotidien anonyme", "匿名の1日分のまとめを送信する", "रोज़ का गुमनाम सारांश भेजें", "إرسال ملخص يومي مجهول"]),
 "optCountsHint": ("What the summary is, where it goes, and what is never in it", None, "optCountsLabel", [
  "Once a day, Imgkeep sends a summary like \"12 saves as JPG, 1 failed\" to Aptabase, an open-source analytics service hosted in the EU, so we know which features to improve and which saves fail. Never images, page addresses, file names or anything that identifies you.",
  "פעם ביום ‏Imgkeep שולח סיכום כמו „12 שמירות כ-JPG, אחת נכשלה” ל-Aptabase, שירות אנליטיקה בקוד פתוח שמאוחסן באיחוד האירופי, כדי שנדע אילו תכונות לשפר ואילו שמירות נכשלות. אף פעם לא תמונות, כתובות של דפים, שמות קבצים או משהו שמזהה אותך.",
  "Una vez al día, Imgkeep envía un resumen como «12 guardados como JPG, 1 fallido» a Aptabase, un servicio de analítica de código abierto alojado en la UE, para saber qué funciones mejorar y qué guardados fallan. Nunca imágenes, direcciones de páginas, nombres de archivo ni nada que te identifique.",
  "Uma vez por dia, o Imgkeep envia um resumo como \"12 salvamentos como JPG, 1 falhou\" para o Aptabase, um serviço de análise de código aberto hospedado na UE, para sabermos quais recursos melhorar e quais salvamentos falham. Nunca imagens, endereços de páginas, nomes de arquivos ou qualquer coisa que identifique você.",
  "Einmal am Tag sendet Imgkeep eine Zusammenfassung wie „12-mal als JPG gespeichert, 1 fehlgeschlagen“ an Aptabase, einen Open-Source-Analysedienst mit Servern in der EU, damit wir wissen, welche Funktionen wir verbessern sollten und welche Speichervorgänge scheitern. Niemals Bilder, Seitenadressen, Dateinamen oder etwas, das dich identifiziert.",
  "Une fois par jour, Imgkeep envoie un résumé comme « 12 enregistrements en JPG, 1 échec » à Aptabase, un service d'analyse open source hébergé dans l'UE, pour savoir quelles fonctions améliorer et quels enregistrements échouent. Jamais d'images, d'adresses de pages, de noms de fichiers ni rien qui vous identifie.",
  "1日1回、「JPGで12回保存、1回失敗」のようなまとめを、EUでホストされているオープンソースの分析サービス Aptabase に送信します。改善すべき機能や失敗する保存を知るためです。画像、ページのアドレス、ファイル名、あなたを特定できる情報は一切送りません。",
  "दिन में एक बार Imgkeep \"JPG में 12 सेव, 1 विफल\" जैसा सारांश Aptabase को भेजता है, जो EU में होस्ट की गई एक ओपन-सोर्स एनालिटिक्स सेवा है, ताकि हम जान सकें कि किन सुविधाओं को बेहतर करना है और कौन-से सेव विफल होते हैं। कभी भी इमेज, पेज के पते, फ़ाइल के नाम या आपको पहचानने वाली कोई चीज़ नहीं।",
  "مرة في اليوم، يرسل Imgkeep ملخصًا مثل \"12 حفظًا بصيغة JPG، فشل 1\" إلى Aptabase، وهي خدمة تحليلات مفتوحة المصدر مستضافة في الاتحاد الأوروبي، لنعرف أي الميزات نحسّن وأي عمليات الحفظ تفشل. لا يتضمن أبدًا صورًا أو عناوين صفحات أو أسماء ملفات أو أي شيء يحدد هويتك."]),
 "optCountsShow": ("Expandable: shows the counts exactly as stored and sent", None, "optCountsHint", [
  "See exactly what's sent", "לראות בדיוק מה נשלח", "Ver exactamente qué se envía", "Ver exatamente o que é enviado", "Genau sehen, was gesendet wird", "Voir exactement ce qui est envoyé", "送信内容をそのまま見る", "देखें कि ठीक-ठीक क्या भेजा जाता है", "عرض ما يُرسل بالضبط"]),
 "optCountsToday": ("Label above today's counts", None, "optCountsShow", [
  "Counted today (sent after today):", "נספר היום (יישלח אחרי היום):", "Contado hoy (se envía después de hoy):", "Contado hoje (enviado depois de hoje):", "Heute gezählt (wird nach heute gesendet):", "Compté aujourd'hui (envoyé après aujourd'hui) :", "今日の集計（翌日以降に送信）：", "आज की गिनती (आज के बाद भेजी जाएगी):", "ما احتُسب اليوم (يُرسل بعد اليوم):"]),
 "optCountsLast": ("Label above the last summary sent", None, "optCountsToday", [
  "Last summary sent:", "הסיכום האחרון שנשלח:", "Último resumen enviado:", "Último resumo enviado:", "Zuletzt gesendete Zusammenfassung:", "Dernier résumé envoyé :", "最後に送信したまとめ：", "पिछला भेजा गया सारांश:", "آخر ملخص أُرسل:"]),
 "optCountsNone": ("Shown when there are no counts yet", None, "optCountsLast", [
  "Nothing yet.", "עדיין כלום.", "Nada todavía.", "Nada ainda.", "Noch nichts.", "Rien pour l'instant.", "まだありません。", "अभी कुछ नहीं।", "لا شيء بعد."]),
 "optCountsOff": ("Shown instead of today's counts when the summary is turned off", None, "optCountsNone", [
  "Off. Nothing is counted or sent.", "כבוי. שום דבר לא נספר ולא נשלח.", "Desactivado. No se cuenta ni se envía nada.", "Desativado. Nada é contado nem enviado.", "Aus. Es wird nichts gezählt oder gesendet.", "Désactivé. Rien n'est compté ni envoyé.", "オフ。何も集計・送信されません。", "बंद। कुछ भी गिना या भेजा नहीं जाता।", "متوقف. لا يُحتسب أو يُرسل أي شيء."]),
 "optTrust1": ("Trust list item", None, None, [
  "Images are converted on your computer and never uploaded. The only other thing Imgkeep sends is the anonymous daily summary above, which you can turn off.",
  "התמונות מומרות במחשב שלך ולא מועלות לשום מקום. הדבר היחיד האחר ש-Imgkeep שולח הוא הסיכום היומי האנונימי שלמעלה, ואפשר לכבות אותו.",
  "Las imágenes se convierten en tu equipo y nunca se suben. Lo único más que envía Imgkeep es el resumen diario anónimo de arriba, que puedes desactivar.",
  "As imagens são convertidas no seu computador e nunca são enviadas. A única outra coisa que o Imgkeep envia é o resumo diário anônimo acima, que você pode desativar.",
  "Bilder werden auf deinem Computer umgewandelt und nie hochgeladen. Das Einzige, was Imgkeep sonst sendet, ist die anonyme tägliche Zusammenfassung oben, die du ausschalten kannst.",
  "Les images sont converties sur votre ordinateur et jamais envoyées. La seule autre chose qu'Imgkeep envoie est le résumé quotidien anonyme ci-dessus, que vous pouvez désactiver.",
  "画像はパソコン上で変換され、アップロードされることはありません。それ以外に Imgkeep が送るのは上の匿名の1日分のまとめだけで、オフにできます。",
  "इमेज आपके कंप्यूटर पर बदली जाती हैं और कभी अपलोड नहीं होतीं। इसके अलावा Imgkeep सिर्फ़ ऊपर वाला गुमनाम रोज़ का सारांश भेजता है, जिसे आप बंद कर सकते हैं।",
  "تُحوَّل الصور على جهازك ولا تُرفع أبدًا. الشيء الوحيد الآخر الذي يرسله Imgkeep هو الملخص اليومي المجهول أعلاه، ويمكنك إيقافه."]),
}

def path(lang):
    return os.path.join(LOC, lang, "messages.json")

en = json.load(open(path("en"), encoding="utf-8"))
order = list(en)
for key, (desc, ph, after, texts) in M.items():
    if key in en:
        en[key]["message"] = texts[0]
        continue
    en[key] = {"message": texts[0], "description": desc}
    if ph:
        en[key]["placeholders"] = ph
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
    print(lang, len(data))
