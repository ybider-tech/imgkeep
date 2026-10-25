# Store listing translations: Imgkeep 0.11.0

Translations of the v9 description in [listing.md](listing.md), for the Chrome Web Store and Edge Add-ons.
The name and summary come from the package (`extension/_locales/<lang>/messages.json`), so only the
description is pasted here. Button and menu names match the extension's own translations.
They say "the browser's Downloads folder", never Chrome, so the same text works on Edge (which rejects descriptions naming Chrome).

Languages: Hebrew (he), Spanish (es), Portuguese, Brazil (pt_BR), German (de), French (fr), Japanese (ja),
Hindi (hi), Arabic (ar). Images stay English for now.

## How to add them

**Chrome Web Store** (after uploading the package): Store listing tab → language dropdown at the top
(it lists the languages found in `_locales`) → pick each one → paste its description → Save draft.
Screenshots, tiles and video are shared across languages unless you upload localised ones.

**Edge Add-ons** (Partner Center): Extension overview → Properties stays the same → Store listings →
"Manage languages" → tick the eight languages → open each one → paste its description, and fill the
required fields (search terms optional; reuse the English screenshots and logo) → Save → Publish.

---

## he — Hebrew

```text
‏Imgkeep הוא ממיר תמונות חינמי לתפריט הלחיצה הימנית. שומרים כל תמונה כ-PNG,‏ JPG,‏ WebP,‏ GIF או PDF, לוקחים ממנה את פלטת הצבעים, ממירים WebP ו-AVIF, ושומרים תמונות גם באתרים שמסתירים אותן מהלחיצה הימנית.

לחיצה ימנית על תמונה ← Imgkeep ← בוחרים פורמט. התמונה נשמרת ישר לתיקייה שבחרת, או מעתיקים אותה כ-PNG ומדביקים באפליקציה אחרת. התמונות מומרות במחשב שלך: בלי העלאות, בלי חשבון.

עובד גם איפה שלחיצה ימנית לא

באתרים כמו Instagram ו-Pinterest, שכבה מעל התמונה מונעת מ"שמירת התמונה בשם" של הדפדפן להגיע אליה. לוחצים לחיצה ימנית מעל התמונה ובוחרים "Imgkeep: מציאת תמונה כאן": ‏Imgkeep מוצא את התמונה שמתחת לשכבה, בגודל הכי גדול שזמין. אם הוא לא בטוח לאיזו תמונה התכוונת, הוא מציג את התמונות שעל המסך כדי שתבחר.

מציאת תמונה כאן כבויה עד שמפעילים אותה, באפשרויות או בפעם הראשונה שמשתמשים בה. היא מסתכלת על הדף הנוכחי רק כשמבקשים, ואף פעם לא משנה אותו.

המרת WebP ו-AVIF ל-PNG או JPG

אתרים רבים משתמשים היום בתמונות WebP ו-AVIF, שאפליקציות אחרות לרוב לא פותחות. ‏Imgkeep שומר אותן בפורמט שעובד בכל מקום שצריך.

• קבצים רגילים: קובצי JPG נשמרים כ-‎.jpg ולא כ-‎.jfif. גם SVG ותמונות data:‎ עובדים.
• האנימציה ממשיכה לזוז: ‏WebP,‏ AVIF ו-APNG מונפשים הופכים ל-GIF ששומר על התזמון והשקיפות. קובצי GIF מונפשים נשמרים בלי שינוי.
• שמירה כ-PDF: קובץ PDF של עמוד אחד בגודל התמונה, עם השקיפות. שימושי לקבלות, למסמכים ולשיתוף.
• העתקה כ-PNG: התמונה נכנסת ללוח כקובץ PNG אמיתי, עם השקיפות, ומדביקים אותה ישר בכלי עיצוב או מצגות כמו Canva או Google Slides.
• שמירה כ-AVIF: באפשרויות נוספות, קבצים שלרוב קטנים בחצי מ-JPG שנראה אותו דבר, עם השקיפות.
• אייקונים ומפות סיביות: באפשרויות נוספות שומרים כ-ICO (מ-16 עד 256 פיקסלים בקובץ אחד, לקיצורי דרך בשולחן העבודה ולאייקוני אתרים) או כ-BMP.
• שמירת המקור: שומרים את התמונה בפורמט המקורי שלה כשלא צריך המרה.

לוקחים את הצבעים מכל תמונה

לחיצה ימנית על תמונה ← Imgkeep ← קבלת פלטת צבעים. רואים את הצבעים העיקריים שלה, מהגדול לקטן, ולוחצים על צבע כדי להעתיק אותו כ-HEX,‏ RGB או HSL.

• מעתיקים את כולם בבת אחת כמשתני CSS, קטע Tailwind,‏ JSON או רשימה פשוטה.
• שומרים את הפלטה כרצועת דוגמיות PNG, קובץ ‎.gpl‏ (GIMP) או קובץ ‎.ase‏ (Adobe).
• עובד עם מציאת תמונה כאן, כך שאפשר לקחת צבעים מתמונות באתרים כמו Instagram ו-Pinterest שחוסמים את הלחיצה הימנית.
• מחושב במחשב שלך. התמונה והצבעים שלה לא יוצאים ממנו.

שינוי גודל ושליטה באיכות

• שינוי גודל אוטומטי: מגדירים רוחב מרבי באפשרויות. תמונות גדולות יותר מוקטנות באותן פרופורציות; תמונות קטנות יותר אף פעם לא מוגדלות.
• תצוגה מקדימה לפני השמירה: אפשרויות נוספות מציג את גודל התוצאה בפיקסלים ובקילובייטים. בוחרים פורמט, רוחב, איכות, רקע ושם קובץ לתמונה הזו.
• כוונון איכות: מחוונים לאיכות JPG ו-WebP, וצבע רקע לתמונות שקופות שנשמרות כ-JPG.

תיקיות ושמות קבצים לבחירתך

• שמירה לתיקייה שלך: בוחרים תיקייה פעם אחת, משתמשים בתיקיית ההורדות של הדפדפן, או שואלים בכל פעם. מסדרים תמונות בתתי-תיקיות כמו Imgkeep/{host}.
• שמות קבצים משלך: מרכיבים שמות מ-{name},‏ {host},‏ {date},‏ {time},‏ {w} ו-{h}, למשל {name}-{w}x{h}.
• אף פעם לא דורס: אם כבר קיים קובץ באותו שם, הקובץ החדש מקבל מספר, כמו " (1)".

המרה מקומית וגישה בשליטתך

• בלי העלאות: התמונות מומרות במחשב שלך. בלי חשבון.
• לא קורא דפים ברקע: ‏Imgkeep מסתכל על דף רק כשמבקשים ממנו למצוא בו תמונה, ואף פעם לא משנה דף.
• ארבע הרשאות בלבד: contextMenus,‏ downloads,‏ storage,‏ offscreen. שתיים נוספות, activeTab ו-scripting, רק אם מפעילים את מציאת תמונה כאן.
• סיכום יומי אנונימי אחד: ספירות שימוש וכשלים, כמו „12 שמירות כ-JPG, אחת נכשלה”, כדי שנדע מה לשפר. אף פעם לא תמונות, כתובות אתרים או שמות קבצים. לחיצה אחת באפשרויות מכבה אותו.
• קוד פתוח ברישיון MIT, בלי שלב בנייה: הקוד שקוראים הוא הקוד שרץ. החלק המהודר היחיד, מקודד ה-AVIF, הוא libavif בקוד פתוח, ללא שינוי ונבדק לפי טביעת האצבע שלו.
• חינמי, בלי הגבלות: בלי פרסומות, בלי לשוניות ברוכים הבאים, ובקשת דירוג אחת בלבד, אי פעם. כל תכונה שקיימת היום נשארת חינמית, כולל פלטות הצבעים.

כשאתר חוסם תמונה

אתרים מעטים מונעים מאתרים אחרים לקרוא את התמונות שלהם. רק אז, ורק אחרי שמאשרים בלחיצה, ‏Imgkeep מבקש מהדפדפן גישה לאתר האחד הזה. אפשר להסיר אותה בכל עת באפשרויות. או לבחור "לשמור בפורמט המקורי".

הצעות לתכונות והצבעה על רעיונות: https://imgkeep.app/ideas.html
```

## es — Spanish

```text
Imgkeep es un conversor de imágenes gratuito para tu menú del clic derecho. Guarda cualquier imagen como PNG, JPG, WebP, GIF o PDF, saca su paleta de colores, convierte WebP y AVIF, y guarda fotos incluso en sitios que las ocultan del clic derecho.

Clic derecho en una imagen → Imgkeep → elige el formato. Se guarda directamente en la carpeta que elijas, o cópiala como PNG y pégala en otra aplicación. Las imágenes se convierten en tu equipo: sin subidas, sin cuenta.

FUNCIONA DONDE EL CLIC DERECHO NO LLEGA

En sitios como Instagram y Pinterest, una capa sobre la foto impide que el "Guardar imagen como" del navegador llegue a ella. Haz clic derecho sobre la foto y elige "Imgkeep: Buscar imagen aquí": Imgkeep encuentra la imagen detrás de la capa, en el tamaño más grande disponible. Si no está seguro de qué imagen querías, te muestra las imágenes de la pantalla para que elijas.

Buscar imagen aquí está desactivado hasta que lo actives, en Opciones o la primera vez que lo uses. Solo mira la página actual cuando se lo pides, y nunca la cambia.

CONVIERTE WEBP Y AVIF A PNG O JPG

Muchos sitios usan ahora imágenes WebP y AVIF, que otras aplicaciones a menudo no pueden abrir. Imgkeep las guarda en un formato que funciona donde lo necesites.

• Archivos de imagen estándar: los JPG se guardan como .jpg, no como .jfif. También funcionan las imágenes SVG y data:.
• Las animaciones siguen moviéndose: WebP, AVIF y APNG animados se convierten en un GIF que conserva su ritmo y su transparencia. Los GIF animados se guardan sin cambios.
• Guardar como PDF: un PDF de una página del tamaño de la imagen, con su transparencia. Útil para recibos, documentos y compartir.
• Copiar como PNG: pon la imagen en el portapapeles como un PNG de verdad, con su transparencia, y pégala directamente en una herramienta de diseño o de presentaciones como Canva o Google Slides.
• Guardar como AVIF: en Más opciones, archivos que suelen ocupar la mitad que un JPG que se ve igual, con su transparencia.
• Iconos y mapas de bits: en Más opciones, guarda como ICO (de 16 a 256 px en un solo archivo, para accesos directos y favicons) o BMP.
• Conserva el original: guarda la imagen en su formato original cuando no necesites convertirla.

TOMA LOS COLORES DE CUALQUIER IMAGEN

Clic derecho en una imagen → Imgkeep → Obtener paleta de colores. Ve sus colores principales, de mayor a menor, y haz clic en uno para copiarlo como HEX, RGB o HSL.

• Cópialos todos a la vez como variables CSS, un fragmento de Tailwind, JSON o una lista.
• Guarda la paleta como una tira de muestras PNG, un archivo .gpl (GIMP) o un archivo .ase (Adobe).
• Funciona con Buscar imagen aquí, así que puedes tomar colores de fotos en sitios como Instagram y Pinterest que bloquean el clic derecho.
• Se calcula en tu equipo. La imagen y sus colores nunca salen de él.

CAMBIA EL TAMAÑO Y CONTROLA LA CALIDAD

• Cambio de tamaño automático: fija un ancho máximo en Opciones. Las imágenes más grandes se reducen manteniendo su proporción; las más pequeñas nunca se amplían.
• Vista previa antes de guardar: Más opciones muestra el tamaño del resultado en píxeles y kilobytes. Elige formato, ancho, calidad, fondo y nombre de archivo para esa imagen.
• Ajusta la calidad: controles de calidad para JPG y WebP, y un color de fondo para imágenes transparentes guardadas como JPG.

ELIGE TUS CARPETAS Y NOMBRES DE ARCHIVO

• Guarda en tu carpeta: elige una carpeta una vez, usa la carpeta de descargas del navegador o pregunta cada vez. Organiza las imágenes en subcarpetas como Imgkeep/{host}.
• Nombres de archivo a tu medida: crea nombres con {name}, {host}, {date}, {time}, {w} y {h}, por ejemplo {name}-{w}x{h}.
• Nunca sobrescribe: si ya existe un archivo con el mismo nombre, el nuevo recibe un número, como " (1)".

CONVERSIÓN LOCAL Y ACCESO BAJO TU CONTROL

• Sin subidas: las imágenes se convierten en tu equipo. Sin cuenta.
• No lee páginas en segundo plano: Imgkeep solo mira una página cuando le pides que encuentre una imagen en ella, y nunca cambia una página.
• Solo cuatro permisos: contextMenus, downloads, storage, offscreen. Dos más, activeTab y scripting, solo si activas Buscar imagen aquí.
• Un único resumen diario anónimo: recuentos de uso y fallos, como «12 guardados como JPG, 1 fallido», para saber qué mejorar. Nunca imágenes, direcciones web ni nombres de archivo. Un clic en Opciones lo desactiva.
• Código abierto con licencia MIT y sin paso de compilación: el código que lees es el código que se ejecuta. La única parte compilada, el codificador AVIF, es libavif, de código abierto, sin cambios y verificada por su huella.
• Gratis y sin límites: sin anuncios, sin pestañas de bienvenida y una sola petición de valoración, nunca más. Todas las funciones disponibles hoy seguirán siendo gratis, incluidas las paletas de colores.

CUANDO UN SITIO BLOQUEA UNA IMAGEN

Algunos sitios impiden que otros sitios lean sus imágenes. Solo entonces, y solo después de que lo permitas con un clic, Imgkeep pide a tu navegador acceso a ese único sitio. Puedes quitarlo cuando quieras en Opciones. O elige "Guardar en el formato original".

Sugiere funciones y vota ideas: https://imgkeep.app/ideas.html
```

## pt_BR — Portuguese (Brazil)

```text
O Imgkeep é um conversor de imagens gratuito para o seu menu do clique direito. Salve qualquer imagem como PNG, JPG, WebP, GIF ou PDF, pegue a paleta de cores, converta WebP e AVIF e salve fotos até em sites que as escondem do clique direito.

Clique direito em uma imagem → Imgkeep → escolha o formato. Ela é salva direto na pasta que você escolheu, ou copie como PNG e cole em outro app. As imagens são convertidas no seu computador: sem uploads, sem conta.

FUNCIONA ONDE O CLIQUE DIREITO NÃO CHEGA

Em sites como Instagram e Pinterest, uma camada sobre a foto impede que o "Salvar imagem como" do navegador chegue até ela. Clique com o botão direito sobre a foto e escolha "Imgkeep: Encontrar imagem aqui": o Imgkeep encontra a imagem atrás da camada, no maior tamanho disponível. Se não tiver certeza de qual imagem você quis, ele mostra as imagens da tela para você escolher.

Encontrar imagem aqui fica desativado até você ativar, nas Opções ou na primeira vez que usar. Ele só olha a página atual quando você pede, e nunca a altera.

CONVERTA WEBP E AVIF PARA PNG OU JPG

Muitos sites agora usam imagens WebP e AVIF, que outros apps muitas vezes não abrem. O Imgkeep salva essas imagens em um formato que funciona onde você precisar.

• Arquivos de imagem padrão: JPGs são salvos como .jpg, não .jfif. Imagens SVG e data: também funcionam.
• Animações continuam se movendo: WebP, AVIF e APNG animados viram um GIF que mantém o tempo e a transparência. GIFs animados são salvos sem alterações.
• Salvar como PDF: um PDF de uma página do tamanho da imagem, com transparência. Útil para recibos, documentos e compartilhamento.
• Copiar como PNG: coloque a imagem na área de transferência como um PNG de verdade, com transparência, e cole direto em uma ferramenta de design ou de slides como Canva ou Google Slides.
• Salvar como AVIF: em Mais opções, arquivos que costumam ter metade do tamanho de um JPG com a mesma aparência, com transparência.
• Ícones e bitmaps: em Mais opções, salve como ICO (de 16 a 256 px em um só arquivo, para atalhos na área de trabalho e favicons) ou BMP.
• Mantenha o original: salve a imagem no formato original quando não precisar converter.

PEGUE AS CORES DE QUALQUER IMAGEM

Clique direito em uma imagem → Imgkeep → Obter paleta de cores. Veja as cores principais, da maior para a menor, e clique em uma para copiá-la como HEX, RGB ou HSL.

• Copie todas de uma vez como variáveis CSS, um trecho de Tailwind, JSON ou uma lista simples.
• Salve a paleta como uma faixa de amostras PNG, um arquivo .gpl (GIMP) ou um arquivo .ase (Adobe).
• Funciona com Encontrar imagem aqui, então você pode pegar cores de fotos em sites como Instagram e Pinterest que bloqueiam o clique direito.
• Calculado no seu computador. A imagem e as cores dela nunca saem dele.

REDIMENSIONE IMAGENS E CONTROLE A QUALIDADE

• Redimensionamento automático: defina uma largura máxima nas Opções. Imagens maiores são reduzidas mantendo a proporção; as menores nunca são ampliadas.
• Prévia antes de salvar: Mais opções mostra o tamanho do resultado em pixels e kilobytes. Escolha formato, largura, qualidade, fundo e nome do arquivo para essa imagem.
• Ajuste a qualidade: controles de qualidade para JPG e WebP, e uma cor de fundo para imagens transparentes salvas como JPG.

ESCOLHA SUAS PASTAS E NOMES DE ARQUIVO

• Salve na sua pasta: escolha uma pasta uma vez, use a pasta de downloads do navegador ou pergunte sempre. Organize as imagens em subpastas como Imgkeep/{host}.
• Nomes de arquivo personalizados: monte nomes com {name}, {host}, {date}, {time}, {w} e {h}, por exemplo {name}-{w}x{h}.
• Nunca sobrescreve: se já existe um arquivo com o mesmo nome, o novo recebe um número, como " (1)".

CONVERSÃO LOCAL E ACESSO SOB SEU CONTROLE

• Sem uploads: as imagens são convertidas no seu computador. Sem conta.
• Não lê páginas em segundo plano: o Imgkeep só olha uma página quando você pede para encontrar uma imagem nela, e nunca altera uma página.
• Só quatro permissões: contextMenus, downloads, storage, offscreen. Mais duas, activeTab e scripting, só se você ativar Encontrar imagem aqui.
• Um único resumo diário anônimo: contagens de uso e falhas, como "12 salvamentos como JPG, 1 falhou", para sabermos o que melhorar. Nunca imagens, endereços de sites ou nomes de arquivos. Um clique nas Opções desativa.
• Código aberto com licença MIT e sem etapa de build: o código que você lê é o código que roda. A única parte compilada, o codificador AVIF, é o libavif, de código aberto, sem alterações e verificado pela sua impressão digital.
• Grátis e sem limites: sem anúncios, sem abas de boas-vindas e um único pedido de avaliação, só uma vez. Todos os recursos disponíveis hoje continuam grátis, incluindo as paletas de cores.

QUANDO UM SITE BLOQUEIA UMA IMAGEM

Alguns sites impedem que outros sites leiam suas imagens. Só nesse caso, e só depois que você permitir com um clique, o Imgkeep pede ao navegador acesso a esse único site. Você pode remover quando quiser nas Opções. Ou escolha "Salvar no formato original".

Sugira recursos e vote em ideias: https://imgkeep.app/ideas.html
```

## de — German

```text
Imgkeep ist ein kostenloser Bildkonverter für dein Rechtsklickmenü. Speichere jedes Bild als PNG, JPG, WebP, GIF oder PDF, hol dir seine Farbpalette, wandle WebP und AVIF um und speichere Fotos sogar auf Websites, die sie vor dem Rechtsklick verstecken.

Rechtsklick auf ein Bild → Imgkeep → Format wählen. Es wird direkt in deinem gewählten Ordner gespeichert, oder kopiere es als PNG und füge es in eine andere App ein. Die Bilder werden auf deinem Computer umgewandelt: keine Uploads, kein Konto.

FUNKTIONIERT, WO DER RECHTSKLICK NICHT HINKOMMT

Auf Websites wie Instagram und Pinterest verhindert eine Ebene über dem Foto, dass das „Bild speichern unter“ des Browsers es erreicht. Klicke mit der rechten Maustaste auf das Foto und wähle „Imgkeep: Bild hier finden“: Imgkeep findet das Bild hinter der Ebene, in der größten verfügbaren Größe. Wenn es nicht sicher ist, welches Bild du meinst, zeigt es dir die Bilder auf dem Bildschirm zur Auswahl.

Bild hier finden ist aus, bis du es einschaltest, in den Optionen oder bei der ersten Nutzung. Es sieht sich die aktuelle Seite nur an, wenn du es bittest, und verändert sie nie.

WEBP UND AVIF IN PNG ODER JPG UMWANDELN

Viele Websites nutzen heute WebP- und AVIF-Bilder, die andere Programme oft nicht öffnen. Imgkeep speichert sie in einem Format, das überall funktioniert, wo du es brauchst.

• Normale Bilddateien: JPGs werden als .jpg gespeichert, nicht als .jfif. SVG- und data:-Bilder funktionieren auch.
• Animationen bleiben in Bewegung: animierte WebP-, AVIF- und APNG-Bilder werden zu einem GIF mit Timing und Transparenz. Animierte GIFs werden unverändert gespeichert.
• Als PDF speichern: ein einseitiges PDF in der Größe des Bildes, mit Transparenz. Praktisch für Belege, Dokumente und zum Teilen.
• Als PNG kopieren: Das Bild landet als echtes PNG mit Transparenz in der Zwischenablage, und du fügst es direkt in ein Design- oder Präsentationstool wie Canva oder Google Slides ein.
• Als AVIF speichern: In Weitere Optionen, oft halb so groß wie ein JPG, das gleich aussieht, mit Transparenz.
• Icons und Bitmaps: In Weitere Optionen als ICO speichern (16 bis 256 px in einer Datei, für Desktop-Verknüpfungen und Favicons) oder als BMP.
• Original behalten: Speichere das Bild im Originalformat, wenn du keine Umwandlung brauchst.

FARBEN AUS JEDEM BILD HOLEN

Rechtsklick auf ein Bild → Imgkeep → Farbpalette holen. Sieh seine Hauptfarben, größte zuerst, und klick auf eine, um sie als HEX, RGB oder HSL zu kopieren.

• Kopiere alle auf einmal als CSS-Variablen, Tailwind-Snippet, JSON oder einfache Liste.
• Speichere die Palette als PNG-Farbstreifen, als .gpl-Datei (GIMP) oder als .ase-Datei (Adobe).
• Funktioniert mit „Bild hier finden“, so holst du Farben auch aus Fotos auf Websites wie Instagram und Pinterest, die den Rechtsklick blockieren.
• Wird auf deinem Computer berechnet. Das Bild und seine Farben verlassen ihn nie.

BILDGRÖSSE ÄNDERN UND QUALITÄT STEUERN

• Automatisch verkleinern: Lege in den Optionen eine maximale Breite fest. Größere Bilder werden proportional verkleinert; kleinere werden nie vergrößert.
• Vorschau vor dem Speichern: Weitere Optionen zeigt die Größe des Ergebnisses in Pixeln und Kilobyte. Wähle Format, Breite, Qualität, Hintergrund und Dateinamen für dieses Bild.
• Qualität einstellen: Regler für die JPG- und WebP-Qualität und eine Hintergrundfarbe für transparente Bilder, die als JPG gespeichert werden.

ORDNER UND DATEINAMEN NACH WAHL

• In deinen Ordner speichern: einmal einen Ordner wählen, den Download-Ordner des Browsers nutzen oder jedes Mal fragen. Sortiere Bilder in Unterordner wie Imgkeep/{host}.
• Eigene Dateinamen: Namen aus {name}, {host}, {date}, {time}, {w} und {h} bauen, z. B. {name}-{w}x{h}.
• Überschreibt nie: Gibt es schon eine Datei mit demselben Namen, bekommt die neue eine Nummer wie " (1)".

LOKALE UMWANDLUNG UND ZUGRIFF UNTER DEINER KONTROLLE

• Keine Uploads: Die Bilder werden auf deinem Computer umgewandelt. Kein Konto.
• Kein Lesen von Seiten im Hintergrund: Imgkeep sieht sich eine Seite nur an, wenn du es bittest, dort ein Bild zu finden, und verändert nie eine Seite.
• Nur vier Berechtigungen: contextMenus, downloads, storage, offscreen. Zwei weitere, activeTab und scripting, nur wenn du Bild hier finden einschaltest.
• Eine anonyme tägliche Zusammenfassung: Nutzungszahlen und Fehler wie „12-mal als JPG gespeichert, 1 fehlgeschlagen“, damit wir wissen, was wir verbessern sollten. Niemals Bilder, Webadressen oder Dateinamen. Ein Klick in den Optionen schaltet sie aus.
• Open Source unter der MIT-Lizenz, ohne Build-Schritt: Der Code, den du liest, ist der Code, der läuft. Der einzige kompilierte Teil, der AVIF-Encoder, ist das quelloffene libavif, unverändert und per Fingerabdruck geprüft.
• Kostenlos und ohne Grenzen: keine Werbung, keine Willkommens-Tabs und nur eine einzige Bitte um eine Bewertung. Jede Funktion, die es heute gibt, bleibt kostenlos, auch die Farbpaletten.

WENN EINE WEBSITE EIN BILD BLOCKIERT

Einige Websites verhindern, dass andere Websites ihre Bilder lesen. Nur dann, und erst nachdem du es per Klick erlaubt hast, bittet Imgkeep deinen Browser um Zugriff auf genau diese eine Website. Du kannst ihn jederzeit in den Optionen entfernen. Oder wähle „Stattdessen im Originalformat speichern“.

Funktionen vorschlagen und über Ideen abstimmen: https://imgkeep.app/ideas.html
```

## fr — French

```text
Imgkeep est un convertisseur d'images gratuit pour votre menu du clic droit. Enregistrez n'importe quelle image en PNG, JPG, WebP, GIF ou PDF, récupérez sa palette de couleurs, convertissez le WebP et l'AVIF, et enregistrez des photos même sur les sites qui les cachent au clic droit.

Clic droit sur une image → Imgkeep → choisissez le format. Elle est enregistrée directement dans le dossier de votre choix, ou copiez-la en PNG et collez-la dans une autre application. Les images sont converties sur votre ordinateur : pas d'envoi, pas de compte.

FONCTIONNE LÀ OÙ LE CLIC DROIT NE PASSE PAS

Sur des sites comme Instagram et Pinterest, un calque posé sur la photo empêche le « Enregistrer l'image sous » du navigateur de l'atteindre. Faites un clic droit sur la photo et choisissez « Imgkeep : Trouver l'image ici » : Imgkeep trouve l'image derrière le calque, dans la plus grande taille disponible. S'il n'est pas sûr de l'image voulue, il vous montre les images à l'écran pour que vous choisissiez.

Trouver l'image ici est désactivé tant que vous ne l'activez pas, dans les Options ou à la première utilisation. Il ne regarde la page en cours que lorsque vous le demandez, et ne la modifie jamais.

CONVERTIR LE WEBP ET L'AVIF EN PNG OU JPG

Beaucoup de sites utilisent désormais des images WebP et AVIF, que d'autres applications n'ouvrent souvent pas. Imgkeep les enregistre dans un format qui fonctionne partout où vous en avez besoin.

• Des fichiers standard : les JPG sont enregistrés en .jpg, pas en .jfif. Les images SVG et data: fonctionnent aussi.
• Les animations continuent de bouger : les WebP, AVIF et APNG animés deviennent un GIF qui garde son rythme et sa transparence. Les GIF animés sont enregistrés sans changement.
• Enregistrer en PDF : un PDF d'une page à la taille de l'image, transparence comprise. Pratique pour les reçus, les documents et le partage.
• Copier en PNG : l'image va dans le presse-papiers en vrai PNG, transparence comprise, et se colle directement dans un outil de design ou de présentation comme Canva ou Google Slides.
• Enregistrer en AVIF : dans Plus d'options, des fichiers souvent deux fois plus légers qu'un JPG au même rendu, transparence comprise.
• Icônes et bitmaps : dans Plus d'options, enregistrez en ICO (de 16 à 256 px dans un seul fichier, pour les raccourcis du bureau et les favicons) ou en BMP.
• Garder l'original : enregistrez l'image dans son format d'origine quand vous n'avez pas besoin de conversion.

RÉCUPÉREZ LES COULEURS DE N'IMPORTE QUELLE IMAGE

Clic droit sur une image → Imgkeep → Obtenir la palette de couleurs. Voyez ses couleurs principales, de la plus présente à la moins présente, et cliquez sur une couleur pour la copier en HEX, RGB ou HSL.

• Copiez-les toutes d'un coup en variables CSS, en extrait Tailwind, en JSON ou en simple liste.
• Enregistrez la palette en bande de nuances PNG, en fichier .gpl (GIMP) ou en fichier .ase (Adobe).
• Fonctionne avec « Trouver l'image ici », pour prendre les couleurs de photos sur des sites comme Instagram et Pinterest qui bloquent le clic droit.
• Calculé sur votre ordinateur. L'image et ses couleurs ne le quittent jamais.

REDIMENSIONNER ET CONTRÔLER LA QUALITÉ

• Redimensionnement automatique : fixez une largeur maximale dans les Options. Les images plus grandes sont réduites en gardant leurs proportions ; les plus petites ne sont jamais agrandies.
• Aperçu avant l'enregistrement : Plus d'options affiche la taille du résultat en pixels et en kilo-octets. Choisissez le format, la largeur, la qualité, le fond et le nom de fichier pour cette image.
• Régler la qualité : curseurs de qualité JPG et WebP, et une couleur de fond pour les images transparentes enregistrées en JPG.

CHOISISSEZ VOS DOSSIERS ET NOMS DE FICHIERS

• Enregistrer dans votre dossier : choisissez un dossier une fois, utilisez le dossier de téléchargements du navigateur ou demandez à chaque fois. Rangez les images dans des sous-dossiers comme Imgkeep/{host}.
• Noms de fichiers personnalisés : composez des noms avec {name}, {host}, {date}, {time}, {w} et {h}, par exemple {name}-{w}x{h}.
• N'écrase jamais rien : si un fichier du même nom existe déjà, le nouveau reçoit un numéro, comme « (1) ».

CONVERSION LOCALE ET ACCÈS SOUS VOTRE CONTRÔLE

• Pas d'envoi : les images sont converties sur votre ordinateur. Pas de compte.
• Aucune lecture des pages en arrière-plan : Imgkeep ne regarde une page que lorsque vous lui demandez d'y trouver une image, et ne modifie jamais une page.
• Seulement quatre autorisations : contextMenus, downloads, storage, offscreen. Deux de plus, activeTab et scripting, seulement si vous activez Trouver l'image ici.
• Un seul résumé quotidien anonyme : des compteurs d'utilisation et d'échecs, comme « 12 enregistrements en JPG, 1 échec », pour savoir quoi améliorer. Jamais d'images, d'adresses de sites ni de noms de fichiers. Un clic dans les Options le désactive.
• Open source sous licence MIT, sans étape de compilation : le code que vous lisez est le code qui s'exécute. La seule partie compilée, l'encodeur AVIF, est libavif, open source, inchangé et vérifié par son empreinte.
• Gratuit, sans limites : pas de pub, pas d'onglets de bienvenue, et une seule demande de note, une fois pour toutes. Toutes les fonctions disponibles aujourd'hui restent gratuites, palettes de couleurs comprises.

QUAND UN SITE BLOQUE UNE IMAGE

Quelques sites empêchent d'autres sites de lire leurs images. Seulement dans ce cas, et seulement après que vous l'avez autorisé d'un clic, Imgkeep demande à votre navigateur l'accès à ce seul site. Vous pouvez le retirer à tout moment dans les Options. Ou choisissez « Enregistrer au format d'origine ».

Proposez des fonctions et votez pour des idées : https://imgkeep.app/ideas.html
```

## ja — Japanese

```text
Imgkeep は、右クリックメニューで使える無料の画像変換ツールです。どんな画像も PNG・JPG・WebP・GIF・PDF で保存でき、カラーパレットを取り出し、WebP や AVIF を変換し、右クリックから画像を隠しているサイトでも写真を保存できます。

画像を右クリック →「Imgkeep」→ 形式を選ぶ。選んだフォルダにそのまま保存されます。PNG としてコピーして、別のアプリに貼り付けることもできます。画像はパソコン上で変換され、アップロードもアカウントも不要です。

右クリックが届かない場所でも使える

Instagram や Pinterest などのサイトでは、写真の上に重なった層のせいで、ブラウザの「名前を付けて画像を保存」が届きません。写真の上で右クリックして「Imgkeep: ここで画像を探す」を選ぶと、Imgkeep が層の下の画像を、利用できるいちばん大きいサイズで見つけます。どの画像か判断できないときは、画面上の画像を表示して選んでもらいます。

「ここで画像を探す」は、オンにするまでオフです。オプションから、または初めて使うときにオンにできます。ページを見るのは頼まれたときだけで、ページを変更することはありません。

WEBP と AVIF を PNG や JPG に変換

最近は多くのサイトが WebP や AVIF の画像を使っていますが、他のアプリでは開けないことがよくあります。Imgkeep なら、必要な場所でそのまま使える形式で保存できます。

• 標準的な画像ファイル：JPG は .jfif ではなく .jpg で保存されます。SVG や data: 画像にも対応。
• アニメーションはそのまま：アニメーション WebP・AVIF・APNG は、タイミングと透過を保った GIF になります。アニメーション GIF はそのまま保存されます。
• PDF で保存：画像と同じサイズの 1 ページの PDF。透過も保たれます。領収書や書類、共有に便利です。
• PNGとしてコピー：透過を保った本物の PNG としてクリップボードに入れ、Canva や Google Slides などのデザインやスライドのツールにそのまま貼り付けられます。
• AVIF で保存：「その他のオプション」で、同じ見た目の JPG の半分ほどのサイズになることが多いファイルを、透過を保ったまま保存できます。
• アイコンとビットマップ：「その他のオプション」で ICO（16〜256 px を 1 つのファイルに。デスクトップのショートカットやファビコンに）や BMP で保存できます。
• 元の形式のまま：変換が不要なときは、画像を元の形式で保存できます。

どんな画像からも色を取り出す

画像を右クリック →「Imgkeep」→「カラーパレットを取得」。主な色が多い順に表示され、クリックすると HEX・RGB・HSL でコピーできます。

• すべての色を CSS変数、Tailwind のスニペット、JSON、シンプルなリストとしてまとめてコピー。
• パレットを PNG のスウォッチ画像、.gpl ファイル（GIMP）、.ase ファイル（Adobe）として保存。
•「ここで画像を探す」と組み合わせれば、Instagram や Pinterest のように右クリックを妨げるサイトの写真からも色を取り出せます。
• 色はパソコン上で計算されます。画像もその色も外に送られることはありません。

サイズ変更と画質の調整

• 自動でサイズ変更：オプションで最大幅を設定すると、それより大きい画像は縦横比を保って縮小されます。小さい画像は拡大されません。
• 保存前にプレビュー：「その他のオプション」で、仕上がりのピクセル数とキロバイト単位のサイズを確認できます。その画像の形式、幅、画質、背景、ファイル名を選べます。
• 画質を調整：JPG と WebP の画質スライダー、透過画像を JPG で保存するときの背景色を設定できます。

フォルダとファイル名を自由に

• 指定のフォルダへ保存：一度フォルダを選ぶか、ブラウザのダウンロード フォルダを使うか、毎回確認するかを選べます。Imgkeep/{host} のようなサブフォルダで整理できます。
• ファイル名を自由に：{name}、{host}、{date}、{time}、{w}、{h} を組み合わせて名前を作れます。例：{name}-{w}x{h}
• 上書きしない：同じ名前のファイルがあれば、新しいファイルに「 (1)」のような番号を付けます。

パソコン上での変換と、あなたが決めるアクセス

• アップロードなし：画像はパソコン上で変換されます。アカウントも不要です。
• バックグラウンドでページを読みません：Imgkeep がページを見るのは、そこで画像を探すよう頼まれたときだけで、ページを変更することはありません。
• 権限は 4 つだけ：contextMenus、downloads、storage、offscreen。「ここで画像を探す」をオンにした場合のみ、activeTab と scripting の 2 つが加わります。
• 匿名の 1 日分のまとめを 1 回だけ：「JPGで12回保存、1回失敗」のような使用回数と失敗の数で、改善に役立てます。画像、サイトのアドレス、ファイル名は一切含みません。オプションでワンクリックでオフにできます。
• MIT ライセンスのオープンソースで、ビルド工程なし。読めるコードがそのまま動きます。唯一のコンパイル済み部分である AVIF エンコーダーは、オープンソースの libavif をそのまま使い、フィンガープリントで検証しています。
• 無料で制限なし：広告なし、ようこそタブなし、評価のお願いは一度だけ。現在のすべての機能は、カラーパレットも含めて、これからも無料です。

サイトが画像をブロックしているとき

一部のサイトは、他のサイトから画像を読み込めないようにしています。その場合に限り、あなたがクリックで許可したときだけ、Imgkeep はそのサイトひとつへのアクセスをブラウザに求めます。アクセスはオプションからいつでも削除できます。「代わりに元の形式で保存」を選ぶこともできます。

機能の提案やアイデアへの投票：https://imgkeep.app/ideas.html
```

## hi — Hindi

```text
Imgkeep आपके राइट-क्लिक मेन्यू के लिए एक मुफ़्त इमेज कन्वर्टर है। किसी भी इमेज को PNG, JPG, WebP, GIF या PDF के रूप में सेव करें, उसका कलर पैलेट लें, WebP और AVIF बदलें, और उन साइटों पर भी फ़ोटो सेव करें जो उन्हें राइट-क्लिक से छिपाती हैं।

इमेज पर राइट-क्लिक करें → Imgkeep → अपना फ़ॉर्मैट चुनें। इमेज सीधे आपके चुने हुए फ़ोल्डर में सेव होती है, या उसे PNG के रूप में कॉपी करके किसी दूसरे ऐप में पेस्ट करें। इमेज आपके कंप्यूटर पर ही बदली जाती हैं: न अपलोड, न अकाउंट।

जहाँ राइट-क्लिक काम नहीं करता, वहाँ भी काम करता है

Instagram और Pinterest जैसी साइटों पर फ़ोटो के ऊपर एक परत होती है, जिसकी वजह से ब्राउज़र का अपना "इमेज इस रूप में सेव करें" उस तक नहीं पहुँचता। फ़ोटो पर राइट-क्लिक करें और "Imgkeep: यहाँ इमेज ढूँढें" चुनें: Imgkeep परत के पीछे की इमेज को उसके सबसे बड़े उपलब्ध साइज़ में ढूँढ देता है। अगर उसे पक्का पता न हो कि आप कौन-सी इमेज चाहते थे, तो वह स्क्रीन पर मौजूद इमेज दिखाता है ताकि आप चुन सकें।

यहाँ इमेज ढूँढें तब तक बंद रहता है जब तक आप इसे चालू न करें, विकल्पों में या पहली बार इस्तेमाल करते समय। यह मौजूदा पेज को सिर्फ़ तभी देखता है जब आप कहें, और उसे कभी नहीं बदलता।

WEBP और AVIF को PNG या JPG में बदलें

आजकल कई साइटें WebP और AVIF इमेज इस्तेमाल करती हैं, जिन्हें दूसरे ऐप अक्सर नहीं खोल पाते। Imgkeep उन्हें ऐसे फ़ॉर्मैट में सेव करता है जो हर उस जगह काम करे जहाँ आपको ज़रूरत हो।

• सामान्य इमेज फ़ाइलें: JPG फ़ाइलें .jfif नहीं, .jpg के रूप में सेव होती हैं। SVG और data: इमेज भी चलती हैं।
• एनिमेशन चलता रहता है: एनिमेटेड WebP, AVIF और APNG ऐसे GIF बन जाते हैं जिनमें टाइमिंग और पारदर्शिता बनी रहती है। एनिमेटेड GIF बिना बदलाव के सेव होते हैं।
• PDF में सेव करें: इमेज के साइज़ का एक पेज का PDF, पारदर्शिता के साथ। रसीदों, दस्तावेज़ों और शेयर करने के लिए उपयोगी।
• PNG के रूप में कॉपी करें: इमेज पारदर्शिता के साथ असली PNG के रूप में क्लिपबोर्ड पर जाती है, और आप उसे सीधे Canva या Google Slides जैसे डिज़ाइन या स्लाइड टूल में पेस्ट कर सकते हैं।
• AVIF में सेव करें: और विकल्प में, अक्सर उतने ही अच्छे दिखने वाले JPG से आधे साइज़ की फ़ाइलें, पारदर्शिता के साथ।
• आइकन और बिटमैप: और विकल्प में ICO (एक ही फ़ाइल में 16 से 256 px, डेस्कटॉप शॉर्टकट और फ़ेविकॉन के लिए) या BMP के रूप में सेव करें।
• मूल रखें: जब बदलने की ज़रूरत न हो, तो इमेज को उसके मूल फ़ॉर्मैट में सेव करें।

किसी भी इमेज से रंग लें

इमेज पर राइट-क्लिक करें → Imgkeep → कलर पैलेट पाएं। उसके मुख्य रंग देखें, सबसे ज़्यादा वाले पहले, और किसी रंग पर क्लिक करके उसे HEX, RGB या HSL के रूप में कॉपी करें।

• सारे रंग एक साथ CSS वेरिएबल, Tailwind स्निपेट, JSON या सादी सूची के रूप में कॉपी करें।
• पैलेट को PNG स्वैच पट्टी, .gpl फ़ाइल (GIMP) या .ase फ़ाइल (Adobe) के रूप में सेव करें।
• यहाँ इमेज ढूँढें के साथ काम करता है, ताकि Instagram और Pinterest जैसी साइटों पर भी फ़ोटो से रंग ले सकें जो राइट-क्लिक रोकती हैं।
• आपके कंप्यूटर पर निकाला जाता है। इमेज और उसके रंग कभी बाहर नहीं जाते।

इमेज का साइज़ बदलें और क्वालिटी नियंत्रित करें

• अपने-आप साइज़ बदलें: विकल्पों में अधिकतम चौड़ाई तय करें। बड़ी इमेज अनुपात बनाए रखते हुए छोटी हो जाती हैं; छोटी इमेज कभी बड़ी नहीं की जातीं।
• सेव करने से पहले प्रीव्यू: और विकल्प नतीजे का साइज़ पिक्सेल और किलोबाइट में दिखाता है। उस इमेज के लिए फ़ॉर्मैट, चौड़ाई, क्वालिटी, बैकग्राउंड और फ़ाइल का नाम चुनें।
• क्वालिटी एडजस्ट करें: JPG और WebP क्वालिटी के स्लाइडर, और JPG में सेव होने वाली पारदर्शी इमेज के लिए बैकग्राउंड रंग।

अपने फ़ोल्डर और फ़ाइल नाम चुनें

• आपके फ़ोल्डर में सेव: एक बार फ़ोल्डर चुनें, ब्राउज़र का डाउनलोड फ़ोल्डर इस्तेमाल करें, या हर बार पूछें। इमेज को Imgkeep/{host} जैसे सब-फ़ोल्डर में व्यवस्थित करें।
• अपने फ़ाइल नाम: {name}, {host}, {date}, {time}, {w} और {h} से नाम बनाएँ, जैसे {name}-{w}x{h}।
• कभी ओवरराइट नहीं करता: अगर उसी नाम की फ़ाइल पहले से है, तो नई फ़ाइल को " (1)" जैसा नंबर मिलता है।

आपके कंप्यूटर पर कन्वर्ज़न और आपके नियंत्रण में पहुँच

• कोई अपलोड नहीं: इमेज आपके कंप्यूटर पर ही बदली जाती हैं। कोई अकाउंट नहीं।
• बैकग्राउंड में पेज नहीं पढ़ता: Imgkeep किसी पेज को सिर्फ़ तभी देखता है जब आप उससे वहाँ इमेज ढूँढने को कहें, और कभी किसी पेज को नहीं बदलता।
• सिर्फ़ चार अनुमतियाँ: contextMenus, downloads, storage, offscreen। दो और, activeTab और scripting, सिर्फ़ तब जब आप यहाँ इमेज ढूँढें चालू करें।
• रोज़ एक गुमनाम सारांश: इस्तेमाल और विफलताओं की गिनती, जैसे "JPG में 12 सेव, 1 विफल", ताकि हम जानें कि क्या बेहतर करना है। कभी भी इमेज, वेबसाइट के पते या फ़ाइल के नाम नहीं। विकल्पों में एक क्लिक से इसे बंद करें।
• MIT लाइसेंस के तहत ओपन सोर्स, बिना बिल्ड स्टेप के, यानी जो कोड आप पढ़ते हैं वही चलता है। एकमात्र कंपाइल किया गया हिस्सा, AVIF एनकोडर, ओपन-सोर्स libavif है, बिना बदलाव के और उसके फ़िंगरप्रिंट से जाँचा गया।
• मुफ़्त, बिना किसी सीमा के: न विज्ञापन, न वेलकम टैब, और रेटिंग का अनुरोध सिर्फ़ एक बार। आज उपलब्ध हर सुविधा मुफ़्त रहेगी, कलर पैलेट भी।

जब कोई साइट इमेज को ब्लॉक करती है

कुछ साइटें दूसरी साइटों को अपनी इमेज पढ़ने से रोकती हैं। सिर्फ़ तभी, और सिर्फ़ आपके क्लिक करके अनुमति देने के बाद, Imgkeep आपके ब्राउज़र से उस एक साइट की पहुँच माँगता है। आप इसे कभी भी विकल्पों में हटा सकते हैं। या "इसके बजाय मूल फ़ॉर्मैट में सेव करें" चुनें।

सुविधाएँ सुझाएँ और आइडिया पर वोट करें: https://imgkeep.app/ideas.html
```

## ar — Arabic

```text
Imgkeep محوّل صور مجاني لقائمة النقر بزر الماوس الأيمن. احفظ أي صورة بصيغة PNG أو JPG أو WebP أو GIF أو PDF، وخذ لوحة ألوانها، وحوّل صور WebP وAVIF، واحفظ الصور حتى في المواقع التي تخفيها عن النقرة اليمنى.

انقر بزر الماوس الأيمن على صورة ← Imgkeep ← اختر الصيغة. تُحفظ مباشرة في المجلد الذي اخترته، أو انسخها بصيغة PNG والصقها في تطبيق آخر. تُحوَّل الصور على جهازك: بلا رفع ملفات، بلا حساب.

يعمل حيث لا تعمل النقرة اليمنى

في مواقع مثل Instagram وPinterest، توجد طبقة فوق الصورة تمنع أمر "حفظ الصورة باسم" في المتصفح من الوصول إليها. انقر بزر الماوس الأيمن فوق الصورة واختر "Imgkeep: البحث عن الصورة هنا"، فيجد Imgkeep الصورة خلف الطبقة بأكبر حجم متاح. وإذا لم يكن متأكدًا من الصورة التي تقصدها، يعرض لك الصور الظاهرة على الشاشة لتختار منها.

البحث عن الصورة هنا متوقف حتى تشغّله، من الخيارات أو في أول مرة تستخدمه. لا ينظر إلى الصفحة الحالية إلا عندما تطلب ذلك، ولا يغيّرها أبدًا.

تحويل WebP وAVIF إلى PNG أو JPG

تستخدم مواقع كثيرة اليوم صور WebP وAVIF، التي لا تفتحها التطبيقات الأخرى في أحيان كثيرة. يحفظها Imgkeep بصيغة تعمل أينما احتجت إليها.

• ملفات صور قياسية: تُحفظ ملفات JPG بامتداد ‎.jpg وليس ‎.jfif. تعمل صور SVG وdata:‎ أيضًا.
• الحركة تستمر: تتحول صور WebP وAVIF وAPNG المتحركة إلى GIF يحافظ على توقيتها وشفافيتها. وتُحفظ ملفات GIF المتحركة دون تغيير.
• الحفظ بصيغة PDF: ملف PDF من صفحة واحدة بحجم الصورة، مع الشفافية. مفيد للإيصالات والمستندات والمشاركة.
• النسخ بصيغة PNG: تُنسخ الصورة إلى الحافظة كملف PNG حقيقي مع شفافيتها، لتلصقها مباشرة في أداة تصميم أو عروض تقديمية مثل Canva أو Google Slides.
• الحفظ بصيغة AVIF: من مزيد من الخيارات، ملفات غالبًا بنصف حجم JPG يبدو مثلها، مع الحفاظ على الشفافية.
• الأيقونات والصور النقطية: من مزيد من الخيارات، احفظ بصيغة ICO (من 16 إلى 256 بكسل في ملف واحد، لاختصارات سطح المكتب وأيقونات المواقع) أو BMP.
• الاحتفاظ بالأصل: احفظ الصورة بصيغتها الأصلية عندما لا تحتاج إلى تحويل.

خذ الألوان من أي صورة

انقر بزر الماوس الأيمن على صورة ← Imgkeep ← الحصول على لوحة الألوان. شاهد ألوانها الرئيسية، الأكثر أولًا، وانقر على لون لنسخه بصيغة HEX أو RGB أو HSL.

• انسخها كلها دفعة واحدة كمتغيرات CSS أو مقتطف Tailwind أو JSON أو قائمة بسيطة.
• احفظ اللوحة كشريط عينات PNG أو ملف ‎.gpl (GIMP) أو ملف ‎.ase (Adobe).
• يعمل مع "البحث عن الصورة هنا"، فيمكنك أخذ الألوان من الصور في مواقع مثل Instagram وPinterest التي تمنع النقرة اليمنى.
• تُحسب على جهازك. الصورة وألوانها لا تغادره أبدًا.

تغيير حجم الصور والتحكم في الجودة

• تغيير الحجم تلقائيًا: حدّد عرضًا أقصى من الخيارات. تُصغَّر الصور الأكبر مع الحفاظ على نسبها، ولا تُكبَّر الصور الأصغر أبدًا.
• معاينة قبل الحفظ: يعرض مزيد من الخيارات حجم النتيجة بالبكسل والكيلوبايت. اختر الصيغة والعرض والجودة والخلفية واسم الملف لتلك الصورة.
• ضبط الجودة: أشرطة لضبط جودة JPG وWebP، ولون خلفية للصور الشفافة المحفوظة بصيغة JPG.

اختر مجلداتك وأسماء ملفاتك

• الحفظ في مجلدك: اختر مجلدًا مرة واحدة، أو استخدم مجلد التنزيلات في المتصفح، أو اطلب السؤال في كل مرة. نظّم الصور في مجلدات فرعية مثل Imgkeep/{host}.
• أسماء ملفات مخصصة: كوّن الأسماء من {name} و{host} و{date} و{time} و{w} و{h}، مثل {name}-{w}x{h}.
• لا يستبدل أي ملف: إذا كان هناك ملف بالاسم نفسه، يحصل الملف الجديد على رقم مثل " (1)".

تحويل على جهازك ووصول تتحكم فيه

• بلا رفع ملفات: تُحوَّل الصور على جهازك. بلا حساب.
• لا قراءة للصفحات في الخلفية: لا ينظر Imgkeep إلى صفحة إلا عندما تطلب منه العثور على صورة فيها، ولا يغيّر أي صفحة أبدًا.
• أربعة أذونات فقط: contextMenus وdownloads وstorage وoffscreen. واثنان آخران، activeTab وscripting، فقط إذا شغّلت البحث عن الصورة هنا.
• ملخص يومي مجهول واحد: أعداد الاستخدام والإخفاقات، مثل "12 حفظًا بصيغة JPG، فشل 1"، لنعرف ما الذي نحسّنه. لا صور ولا عناوين مواقع ولا أسماء ملفات أبدًا. نقرة واحدة في الخيارات توقفه.
• مفتوح المصدر بترخيص MIT، وبلا خطوة بناء، فالشيفرة التي تقرؤها هي التي تعمل. الجزء المُجمَّع الوحيد، مُرمِّز AVIF، هو libavif مفتوح المصدر، دون تعديل ويُتحقق منه ببصمته.
• مجاني وبلا حدود: بلا إعلانات، بلا علامات تبويب ترحيبية، وطلب تقييم واحد فقط، مرة واحدة. كل ميزة متاحة اليوم ستبقى مجانية، بما فيها لوحات الألوان.

عندما يحظر موقع صورة

تمنع بعض المواقع المواقع الأخرى من قراءة صورها. في هذه الحالة فقط، وفقط بعد أن تسمح بذلك بنقرة، يطلب Imgkeep من متصفحك الوصول إلى ذلك الموقع وحده. يمكنك إزالته في أي وقت من الخيارات. أو اختر "الحفظ بالصيغة الأصلية بدلًا من ذلك".

اقترح ميزات وصوّت على الأفكار: https://imgkeep.app/ideas.html
```
