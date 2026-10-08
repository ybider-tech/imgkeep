#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""0.6.1 messages: "New" in the menu, the one rating ask, What's new link, updated trust wording.
Adds or updates these keys in every locale (English first), keeping the English key order."""
import json, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
LOC = os.path.join(ROOT, "extension", "_locales")
LANGS = ["en", "he", "es", "pt_BR", "de", "fr", "ja", "hi", "ar"]

# key: (description, placeholders, after_key, [en, he, es, pt_BR, de, fr, ja, hi, ar])
M = {
 "menuNew": ("A right-click menu item that is new in this version, for 30 days after an update. $ITEM$ is the item's own name.",
  {"item": {"content": "$1", "example": "Copy as PNG"}}, "menuMoreOptions",
  ["$ITEM$ · New", "$ITEM$ · חדש", "$ITEM$ · Nuevo", "$ITEM$ · Novo", "$ITEM$ · Neu", "$ITEM$ · Nouveau", "$ITEM$ · 新機能", "$ITEM$ · नया", "$ITEM$ · جديد"]),
 "menuRate": ("Right-click menu item shown once, for up to 14 days, after someone has used Imgkeep for a while. Opens the rating ask.", None, "menuNew",
  ["Enjoying Imgkeep? Rate it…", "נהנים מ-Imgkeep? דרגו אותו…", "¿Te gusta Imgkeep? Valóralo…", "Gostando do Imgkeep? Avalie…", "Gefällt dir Imgkeep? Bewerte es…", "Imgkeep vous plaît ? Notez-le…", "Imgkeep を気に入りましたか？評価する…", "Imgkeep पसंद आ रहा है? रेटिंग दें…", "هل يعجبك Imgkeep؟ قيّمه…"]),
 "reviewTitle": ("Heading of the one rating ask", None, None,
  ["Enjoying Imgkeep?", "נהנים מ-Imgkeep?", "¿Te gusta Imgkeep?", "Gostando do Imgkeep?", "Gefällt dir Imgkeep?", "Imgkeep vous plaît ?", "Imgkeep を気に入りましたか？", "Imgkeep पसंद आ रहा है?", "هل يعجبك Imgkeep؟"]),
 "reviewBody": ("Text of the one rating ask", None, None,
  ["A rating in the store helps other people find it. It takes a few seconds, and we'll only ask this once.",
   "דירוג בחנות עוזר לאנשים אחרים למצוא אותו. זה לוקח כמה שניות, ונשאל את זה רק פעם אחת.",
   "Una valoración en la tienda ayuda a que otras personas lo encuentren. Lleva unos segundos, y solo te lo preguntaremos una vez.",
   "Uma avaliação na loja ajuda outras pessoas a encontrá-lo. Leva alguns segundos, e só vamos pedir isso uma vez.",
   "Eine Bewertung im Store hilft anderen, es zu finden. Das dauert ein paar Sekunden, und wir fragen nur dieses eine Mal.",
   "Une note dans la boutique aide d'autres personnes à le trouver. Cela prend quelques secondes, et nous ne le demanderons qu'une fois.",
   "ストアでの評価は、ほかの人が見つけるきっかけになります。数秒で終わります。このお願いは一度だけです。",
   "स्टोर में रेटिंग से दूसरे लोगों को इसे ढूँढने में मदद मिलती है। इसमें कुछ ही सेकंड लगते हैं, और हम यह सिर्फ़ एक बार पूछेंगे।",
   "يساعد تقييمك في المتجر الآخرين على العثور عليه. يستغرق ذلك بضع ثوانٍ، ولن نطلب ذلك إلا مرة واحدة."]),
 "reviewRate": ("Button and Options link: opens the store's review page", None, None,
  ["Rate Imgkeep", "דירוג Imgkeep", "Valorar Imgkeep", "Avaliar o Imgkeep", "Imgkeep bewerten", "Noter Imgkeep", "Imgkeep を評価", "Imgkeep को रेटिंग दें", "تقييم Imgkeep"]),
 "reviewNo": ("Button: decline the rating ask (it won't be asked again)", None, None,
  ["No thanks", "לא תודה", "No, gracias", "Não, obrigado", "Nein, danke", "Non merci", "結構です", "नहीं, धन्यवाद", "لا، شكرًا"]),
 "reviewThanks": ("Shown after choosing Rate Imgkeep", None, None,
  ["Thank you!", "תודה רבה!", "¡Gracias!", "Obrigado!", "Danke!", "Merci !", "ありがとうございます！", "धन्यवाद!", "شكرًا لك!"]),
 "reviewOk": ("Shown after choosing No thanks", None, None,
  ["Got it. We won't ask again.", "הבנו. לא נשאל שוב.", "Entendido. No volveremos a preguntar.", "Tudo bem. Não vamos perguntar de novo.", "Alles klar. Wir fragen nicht noch einmal.", "C'est noté. Nous ne demanderons plus.", "わかりました。もうお聞きしません。", "ठीक है। हम दोबारा नहीं पूछेंगे।", "حسنًا. لن نسأل مرة أخرى."]),
 "optWhatsNew": ("Options link to the What's new page on imgkeep.app", None, "optVersion",
  ["What's new", "מה חדש", "Novedades", "Novidades", "Neuigkeiten", "Nouveautés", "新機能", "नया क्या है", "ما الجديد"]),
 "optTrust2": ("Trust list item", None, None,
  ["No ads and no welcome tabs. Small windows open only when you ask for one or a save needs your OK. Imgkeep asks for a rating once, after you've used it for a while.",
   "בלי פרסומות ובלי לשוניות ברוכים הבאים. חלונות קטנים נפתחים רק כשמבקשים או כששמירה צריכה את האישור שלך. ‏Imgkeep מבקש דירוג פעם אחת, אחרי שהשתמשת בו זמן מה.",
   "Sin anuncios ni pestañas de bienvenida. Las ventanas pequeñas solo se abren cuando tú las pides o cuando un guardado necesita tu aprobación. Imgkeep pide una valoración una sola vez, después de que lo hayas usado un tiempo.",
   "Sem anúncios e sem abas de boas-vindas. Janelas pequenas só abrem quando você pede ou quando um salvamento precisa da sua confirmação. O Imgkeep pede uma avaliação só uma vez, depois que você já o usou por um tempo.",
   "Keine Werbung und keine Willkommens-Tabs. Kleine Fenster öffnen sich nur, wenn du sie aufrufst oder ein Speichervorgang deine Zustimmung braucht. Imgkeep bittet einmal um eine Bewertung, nachdem du es eine Weile genutzt hast.",
   "Pas de pub ni d'onglets de bienvenue. De petites fenêtres s'ouvrent seulement quand vous les demandez ou quand un enregistrement a besoin de votre accord. Imgkeep demande une note une seule fois, après que vous l'avez utilisé un moment.",
   "広告なし、ようこそタブなし。小さなウィンドウが開くのは、あなたが呼び出したときか、保存に確認が必要なときだけです。評価のお願いは、しばらく使っていただいた後に一度だけです。",
   "न विज्ञापन, न वेलकम टैब। छोटी विंडो तभी खुलती हैं जब आप खुद कहें या किसी सेव के लिए आपकी मंज़ूरी चाहिए। कुछ समय इस्तेमाल करने के बाद Imgkeep सिर्फ़ एक बार रेटिंग माँगता है।",
   "بلا إعلانات وبلا علامات تبويب ترحيبية. لا تُفتح النوافذ الصغيرة إلا عندما تطلبها أو عندما يحتاج الحفظ إلى موافقتك. يطلب Imgkeep تقييمًا مرة واحدة فقط، بعد أن تستخدمه لفترة."]),
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
