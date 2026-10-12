# Store listing translations: Imgkeep 0.8.0

Translations of the v8 description in [listing.md](listing.md), for the Chrome Web Store and Edge Add-ons.
The name and summary come from the package (`extension/_locales/<lang>/messages.json`), so only the
description is pasted here. Button and menu names match the extension's own translations.

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
‏Imgkeep הוא תוסף דפדפן חינמי בקוד פתוח. הוא מוסיף פריט אחד לתפריט הלחיצה הימנית: בוחרים פורמט, והתמונה מומרת במחשב שלך ונשמרת ישר לתיקייה שלך. או מעתיקים אותה כ-PNG ומדביקים בכל מקום.

עובד גם איפה שלחיצה ימנית לא: באתרים כמו Instagram ו-Pinterest התמונות מתחת לשכבה נוספת, כך שלחיצה ימנית לא מגיעה אליהן. בוחרים Imgkeep: מציאת תמונה כאן, ו-Imgkeep מוצא בשבילך את התמונה, בגודל הכי גדול שלה. כבוי עד שמפעילים אותו.

אתרים רבים מגישים היום תמונות WebP ו-AVIF שאפליקציות אחרות לא פותחות. ‏Imgkeep הופך אותן לקבצים שנפתחים בכל מקום, בלחיצה ימנית אחת:

‏Imgkeep: שמירת התמונה בתור ← PNG · JPG · WebP · GIF (שומר על האנימציה) · PDF · הפורמט המקורי · העתקה כ-PNG · אפשרויות נוספות…

פורמטים

• קבצים שנפתחים בכל מקום: JPG או PNG רגילים, וקובצי JPG נשמרים כ-‎.jpg ולא כ-‎.jfif. גם SVG ותמונות data:‎ עובדים.
• האנימציה נשמרת: ‏WebP,‏ AVIF ו-APNG מונפשים הופכים ל-GIF שממשיך לזוז, עם התזמון והשקיפות. קובצי GIF מונפשים נשמרים בדיוק כמו שהם.
• שמירה כ-PDF: קובץ PDF של עמוד אחד בגודל התמונה בדיוק, לקבלות, למסמכים ולשיתוף. השקיפות נשמרת.
• העתקה כ-PNG: התמונה נכנסת ללוח כקובץ PNG אמיתי, עם השקיפות, ומוכנה להדבקה בכל מקום.

גודל ואיכות

• שינוי גודל: מגדירים באפשרויות רוחב מרבי, ותמונות גדולות יותר מוקטנות כדי להתאים, עם אותן פרופורציות. תמונות קטנות יותר אף פעם לא מוגדלות.
• אפשרויות נוספות: תצוגה מקדימה של התוצאה עם הגודל האמיתי בפיקסלים ובקילובייטים, ובחירת פורמט, רוחב, איכות, רקע ושם קובץ לתמונה הזו בלבד.
• איכות בשליטתך: מחוונים לאיכות JPG ו-WebP, וצבע רקע לתמונות שקופות שנשמרות כ-JPG.

תיקיות ושמות

• שמירה לתיקייה שלך: בוחרים תיקייה פעם אחת וכל תמונה נכנסת אליה, או משתמשים בתיקיית ההורדות, או שואלים בכל פעם. אפשר להוסיף תתי-תיקיות כמו Imgkeep/{host}.
• שמות קבצים משלך: מרכיבים שמות מ-{name},‏ {host},‏ {date},‏ {time},‏ {w} ו-{h}, למשל {name}-{w}x{h}.
• אף פעם לא דורס: אם כבר קיים קובץ באותו שם, הקובץ החדש מקבל מספר, כמו " (1)", במקום להחליף אותו.

נבנה כדי שאפשר יהיה לסמוך עליו

• לא נכנס לדפים שלך: ‏Imgkeep לא קורא את האתרים שבהם ביקרת, עם חריג אחד שבשליטתך: כשמבקשים ממנו למצוא תמונה מוסתרת, הוא מסתכל על הדף הזה, פעם אחת, באותו רגע. הוא אף פעם לא משנה דף. כבוי עד שמפעילים אותו.
• התמונות שלך לא יוצאות מהמחשב: הן מומרות במכשיר שלך. בלי העלאות, בלי חשבון. הדבר היחיד ש-Imgkeep שולח הוא סיכום יומי אנונימי, כמו „12 שמירות כ-JPG, אחת נכשלה”, כדי שנדע מה לשפר. אף פעם לא כתובות או שמות קבצים. לחיצה אחת באפשרויות מכבה אותו.
• ארבע הרשאות בלבד: contextMenus,‏ downloads,‏ storage,‏ offscreen. שתיים נוספות, activeTab ו-scripting, רק אם מפעילים את מציאת התמונה כאן.
• קוד פתוח ברישיון MIT, בלי שלב בנייה, כך שמה שקוראים זה מה שרץ.
• חינמי, בלי הגבלות: בלי פרסומות, בלי לשוניות ברוכים הבאים. ‏Imgkeep פותח חלון קטן רק כשמבקשים (העתקה כ-PNG, אפשרויות נוספות) או כששמירה צריכה את האישור שלך, ומבקש דירוג פעם אחת בלבד, אחרי שהשתמשת בו זמן מה.

כשאתר חוסם תמונה

אתרים מעטים מונעים מאתרים אחרים לקרוא את התמונות שלהם. רק אז, ורק אחרי שמאשרים בלחיצה, ‏Imgkeep מבקש מהדפדפן גישה לאתר האחד הזה. אפשר להסיר אותה בכל עת באפשרויות. או לבחור "לשמור בפורמט המקורי".

כל תכונה ב-Imgkeep היום נשארת חינמית. רעיונות והצבעות: imgkeep.app/ideas.html
```

## es — Spanish

```text
Imgkeep es una extensión de navegador gratuita y de código abierto. Añade una opción al menú del clic derecho: eliges un formato y la imagen se convierte en tu equipo y se guarda directamente en tu carpeta. O cópiala como PNG y pégala donde quieras.

Funciona donde el clic derecho no llega: en sitios como Instagram y Pinterest, las fotos están bajo otra capa y el clic derecho no las alcanza. Elige Imgkeep: Buscar imagen aquí e Imgkeep encuentra la foto por ti, en su tamaño más grande. Desactivado hasta que lo actives.

Muchos sitios sirven ahora imágenes WebP y AVIF que otras aplicaciones no abren. Imgkeep las convierte en archivos que se abren en cualquier parte, con un clic derecho:

Imgkeep: Guardar imagen como → PNG · JPG · WebP · GIF (conserva la animación) · PDF · Formato original · Copiar como PNG · Más opciones…

FORMATOS

• Archivos que se abren en cualquier sitio: JPG o PNG estándar, y los JPG se guardan como .jpg, no como .jfif. También funcionan las imágenes SVG y data:.
• Conserva la animación: WebP, AVIF y APNG animados se convierten en un GIF que sigue moviéndose, con su ritmo y su transparencia. Los GIF animados se guardan tal cual.
• Guardar como PDF: un PDF de una página del tamaño exacto de la imagen, para recibos, documentos y compartir. La transparencia se conserva.
• Copiar como PNG: pon la imagen en el portapapeles como un PNG de verdad, con su transparencia, y pégala donde quieras.

TAMAÑO Y CALIDAD

• Cambiar tamaño: fija un ancho máximo en Opciones y las imágenes más grandes se reducen para caber, manteniendo su proporción. Las más pequeñas nunca se amplían.
• Más opciones: mira una vista previa del resultado con su tamaño real en píxeles y kilobytes, y elige formato, ancho, calidad, fondo y nombre de archivo solo para esa imagen.
• Calidad a tu medida: controles de calidad para JPG y WebP, y el color de fondo para imágenes transparentes guardadas como JPG.

CARPETAS Y NOMBRES

• Guarda en tu carpeta: elige una carpeta una vez y todas las imágenes irán allí, o usa las Descargas de Chrome, o pregunta cada vez. Añade subcarpetas como Imgkeep/{host}.
• Tus nombres de archivo: crea nombres con {name}, {host}, {date}, {time}, {w} y {h}, por ejemplo {name}-{w}x{h}.
• Nunca sobrescribe: si ya existe un archivo con el mismo nombre, el nuevo recibe un número, como " (1)", en lugar de reemplazarlo.

HECHO PARA SER DE CONFIANZA

• No se mete en tus páginas: Imgkeep no lee los sitios que visitas, con una excepción que tú controlas: cuando le pides que encuentre una imagen tapada, mira esa página, una sola vez, en ese momento. Nunca cambia una página. Desactivado hasta que lo actives.
• Tus imágenes nunca salen de tu equipo: se convierten en tu dispositivo. Sin subidas, sin cuenta. Lo único que envía Imgkeep es un resumen diario anónimo, como «12 guardados como JPG, 1 fallido», para saber qué mejorar. Nunca direcciones ni nombres de archivo. Un clic en Opciones lo desactiva.
• Solo cuatro permisos: contextMenus, downloads, storage, offscreen. Dos más, activeTab y scripting, solo si activas Buscar imagen aquí.
• Código abierto con licencia MIT y sin paso de compilación: lo que lees es lo que se ejecuta.
• Gratis y sin límites: sin anuncios ni pestañas de bienvenida. Imgkeep solo abre una pequeña ventana cuando tú la pides (Copiar como PNG, Más opciones) o cuando un guardado necesita tu aprobación, y pide una valoración una sola vez, después de que lo hayas usado un tiempo.

CUANDO UN SITIO BLOQUEA UNA IMAGEN

Algunos sitios impiden que otros sitios lean sus imágenes. Solo entonces, y solo después de que lo permitas con un clic, Imgkeep pide a tu navegador acceso a ese único sitio. Puedes quitarlo cuando quieras en Opciones. O elige "Guardar en el formato original".

Todas las funciones de Imgkeep de hoy seguirán siendo gratis. Ideas y votos: imgkeep.app/ideas.html
```

## pt_BR — Portuguese (Brazil)

```text
O Imgkeep é uma extensão de navegador gratuita e de código aberto. Ela adiciona um item ao menu do clique direito: você escolhe um formato e a imagem é convertida no seu computador e salva direto na sua pasta. Ou copie como PNG e cole onde quiser.

Funciona onde o clique direito não chega: em sites como Instagram e Pinterest, as fotos ficam sob outra camada e o clique direito não as alcança. Escolha Imgkeep: Encontrar imagem aqui e o Imgkeep encontra a foto para você, no maior tamanho. Desativado até você ativar.

Muitos sites agora usam imagens WebP e AVIF que outros apps não abrem. O Imgkeep transforma essas imagens em arquivos que abrem em qualquer lugar, com um clique direito:

Imgkeep: Salvar imagem como → PNG · JPG · WebP · GIF (mantém a animação) · PDF · Formato original · Copiar como PNG · Mais opções…

FORMATOS

• Arquivos que abrem em qualquer lugar: JPG ou PNG padrão, e JPGs são salvos como .jpg, não .jfif. Imagens SVG e data: também funcionam.
• Mantém a animação: WebP, AVIF e APNG animados viram um GIF que continua se movendo, com o tempo e a transparência. GIFs animados são salvos exatamente como são.
• Salvar como PDF: um PDF de uma página do tamanho exato da imagem, para recibos, documentos e compartilhamento. A transparência é mantida.
• Copiar como PNG: coloque a imagem na área de transferência como um PNG de verdade, com transparência, e cole onde quiser.

TAMANHO E QUALIDADE

• Redimensionar: defina uma largura máxima nas Opções e as imagens maiores são reduzidas para caber, mantendo a proporção. As menores nunca são ampliadas.
• Mais opções: veja uma prévia do resultado com o tamanho real em pixels e kilobytes, e escolha formato, largura, qualidade, fundo e nome do arquivo só para essa imagem.
• Qualidade sob seu controle: controles de qualidade para JPG e WebP, e a cor de fundo para imagens transparentes salvas como JPG.

PASTAS E NOMES

• Salva na sua pasta: escolha uma pasta uma vez e toda imagem vai para lá, ou use os Downloads do Chrome, ou pergunte sempre. Adicione subpastas como Imgkeep/{host}.
• Seus nomes de arquivo: monte nomes com {name}, {host}, {date}, {time}, {w} e {h}, por exemplo {name}-{w}x{h}.
• Nunca sobrescreve: se já existe um arquivo com o mesmo nome, o novo recebe um número, como " (1)", em vez de substituí-lo.

FEITO PARA SER CONFIÁVEL

• Fica fora das suas páginas: o Imgkeep não lê os sites que você visita, com uma exceção que você controla: quando você pede para encontrar uma imagem coberta, ele olha aquela página, uma única vez, naquele momento. Ele nunca altera uma página. Desativado até você ativar.
• Suas imagens nunca saem do seu computador: são convertidas no seu dispositivo. Sem uploads, sem conta. A única coisa que o Imgkeep envia é um resumo diário anônimo, como "12 salvamentos como JPG, 1 falhou", para sabermos o que melhorar. Nunca endereços ou nomes de arquivos. Um clique nas Opções desativa.
• Só quatro permissões: contextMenus, downloads, storage, offscreen. Mais duas, activeTab e scripting, só se você ativar Encontrar imagem aqui.
• Código aberto com licença MIT e sem etapa de build: o que você lê é o que roda.
• Grátis e sem limites: sem anúncios e sem abas de boas-vindas. O Imgkeep só abre uma janela pequena quando você pede (Copiar como PNG, Mais opções) ou quando um salvamento precisa da sua confirmação, e pede uma avaliação só uma vez, depois que você já o usou por um tempo.

QUANDO UM SITE BLOQUEIA UMA IMAGEM

Alguns sites impedem que outros sites leiam suas imagens. Só nesse caso, e só depois que você permitir com um clique, o Imgkeep pede ao navegador acesso a esse único site. Você pode remover quando quiser nas Opções. Ou escolha "Salvar no formato original".

Todos os recursos do Imgkeep de hoje continuam grátis. Ideias e votos: imgkeep.app/ideas.html
```

## de — German

```text
Imgkeep ist eine kostenlose Open-Source-Browsererweiterung. Sie fügt deinem Rechtsklickmenü einen Eintrag hinzu: Format wählen, und das Bild wird auf deinem Computer umgewandelt und direkt in deinem Ordner gespeichert. Oder kopiere es als PNG und füge es überall ein.

Funktioniert, wo der Rechtsklick nicht hinkommt: Auf Websites wie Instagram und Pinterest liegen Fotos unter einer weiteren Ebene, sodass ein Rechtsklick sie nicht erreicht. Wähle Imgkeep: Bild hier finden, und Imgkeep findet das Foto für dich, in der größten Version. Aus, bis du es einschaltest.

Viele Websites liefern heute WebP- und AVIF-Bilder, die andere Programme nicht öffnen. Imgkeep macht daraus Dateien, die sich überall öffnen lassen, mit einem Rechtsklick:

Imgkeep: Bild speichern als → PNG · JPG · WebP · GIF (behält Animation) · PDF · Originalformat · Als PNG kopieren · Weitere Optionen…

FORMATE

• Dateien, die sich überall öffnen: normales JPG oder PNG, und JPGs werden als .jpg gespeichert, nicht als .jfif. SVG- und data:-Bilder funktionieren auch.
• Animation bleibt erhalten: animierte WebP-, AVIF- und APNG-Bilder werden zu einem GIF, das sich weiter bewegt, mit Timing und Transparenz. Animierte GIFs werden unverändert gespeichert.
• Als PDF speichern: ein einseitiges PDF genau in der Größe des Bildes, für Belege, Dokumente und zum Teilen. Transparenz bleibt erhalten.
• Als PNG kopieren: Das Bild landet als echtes PNG mit Transparenz in der Zwischenablage, bereit zum Einfügen.

GRÖSSE UND QUALITÄT

• Größe ändern: Lege in den Optionen eine maximale Breite fest, und größere Bilder werden passend verkleinert, ohne ihre Form zu verlieren. Kleinere werden nie vergrößert.
• Weitere Optionen: Sieh dir eine Vorschau des Ergebnisses mit der echten Größe in Pixeln und Kilobyte an und wähle Format, Breite, Qualität, Hintergrund und Dateinamen nur für dieses Bild.
• Qualität nach Wunsch: Regler für die JPG- und WebP-Qualität und die Hintergrundfarbe für transparente Bilder, die als JPG gespeichert werden.

ORDNER UND NAMEN

• Speichert in deinen Ordner: einmal einen Ordner wählen und jedes Bild landet dort, oder den Download-Ordner von Chrome nutzen, oder jedes Mal fragen. Mit Unterordnern wie Imgkeep/{host}.
• Deine Dateinamen: Namen aus {name}, {host}, {date}, {time}, {w} und {h} bauen, z. B. {name}-{w}x{h}.
• Überschreibt nie: Gibt es schon eine Datei mit demselben Namen, bekommt die neue eine Nummer wie " (1)", statt sie zu ersetzen.

GEBAUT, UM VERTRAUEN ZU VERDIENEN

• Bleibt aus deinen Seiten heraus: Imgkeep liest die Websites, die du besuchst, nicht – mit einer Ausnahme, die du steuerst: Wenn du es bittest, ein verdecktes Bild zu finden, sieht es sich diese Seite an, einmal, in diesem Moment. Es verändert nie eine Seite. Aus, bis du es einschaltest.
• Deine Bilder verlassen nie deinen Computer: Sie werden auf deinem Gerät umgewandelt. Keine Uploads, kein Konto. Das Einzige, was Imgkeep sendet, ist eine anonyme tägliche Zusammenfassung wie „12-mal als JPG gespeichert, 1 fehlgeschlagen“, damit wir wissen, was wir verbessern sollten. Niemals Adressen oder Dateinamen. Ein Klick in den Optionen schaltet sie aus.
• Nur vier Berechtigungen: contextMenus, downloads, storage, offscreen. Zwei weitere, activeTab und scripting, nur wenn du Bild hier finden einschaltest.
• Open Source unter der MIT-Lizenz, ohne Build-Schritt: Was du liest, ist das, was läuft.
• Kostenlos und ohne Grenzen: keine Werbung, keine Willkommens-Tabs. Imgkeep öffnet nur dann ein kleines Fenster, wenn du es aufrufst (Als PNG kopieren, Weitere Optionen) oder wenn ein Speichervorgang deine Zustimmung braucht, und bittet nur ein einziges Mal um eine Bewertung, nachdem du es eine Weile genutzt hast.

WENN EINE WEBSITE EIN BILD BLOCKIERT

Einige Websites verhindern, dass andere Websites ihre Bilder lesen. Nur dann, und erst nachdem du es per Klick erlaubt hast, bittet Imgkeep deinen Browser um Zugriff auf genau diese eine Website. Du kannst ihn jederzeit in den Optionen entfernen. Oder wähle „Stattdessen im Originalformat speichern“.

Jede Funktion, die Imgkeep heute hat, bleibt kostenlos. Ideen und Abstimmungen: imgkeep.app/ideas.html
```

## fr — French

```text
Imgkeep est une extension de navigateur gratuite et open source. Elle ajoute une entrée au menu du clic droit : choisissez un format, et l'image est convertie sur votre ordinateur puis enregistrée directement dans votre dossier. Ou copiez-la en PNG et collez-la où vous voulez.

Fonctionne là où le clic droit ne passe pas : sur des sites comme Instagram et Pinterest, les photos sont sous un autre calque, et le clic droit ne les atteint pas. Choisissez Imgkeep : Trouver l'image ici, et Imgkeep trouve la photo pour vous, dans sa plus grande taille. Désactivé tant que vous ne l'activez pas.

Beaucoup de sites servent désormais des images WebP et AVIF que d'autres applications n'ouvrent pas. Imgkeep les transforme en fichiers qui s'ouvrent partout, en un clic droit :

Imgkeep : Enregistrer l'image en → PNG · JPG · WebP · GIF (garde l'animation) · PDF · Format d'origine · Copier en PNG · Plus d'options…

FORMATS

• Des fichiers qui s'ouvrent partout : JPG ou PNG standard, et les JPG sont enregistrés en .jpg, pas en .jfif. Les images SVG et data: fonctionnent aussi.
• L'animation est conservée : les WebP, AVIF et APNG animés deviennent un GIF qui bouge toujours, avec son rythme et sa transparence. Les GIF animés sont enregistrés tels quels.
• Enregistrer en PDF : un PDF d'une page à la taille exacte de l'image, pour les reçus, les documents et le partage. La transparence est conservée.
• Copier en PNG : l'image va dans le presse-papiers en vrai PNG, transparence comprise, prête à être collée.

TAILLE ET QUALITÉ

• Redimensionner : fixez une largeur maximale dans les Options et les images plus grandes sont réduites pour tenir, en gardant leurs proportions. Les plus petites ne sont jamais agrandies.
• Plus d'options : un aperçu du résultat avec sa taille réelle en pixels et en kilo-octets, puis le choix du format, de la largeur, de la qualité, du fond et du nom de fichier pour cette image seulement.
• La qualité que vous choisissez : curseurs de qualité JPG et WebP, et couleur de fond pour les images transparentes enregistrées en JPG.

DOSSIERS ET NOMS

• Enregistre dans votre dossier : choisissez un dossier une fois et chaque image y va, ou utilisez les Téléchargements de Chrome, ou demandez à chaque fois. Ajoutez des sous-dossiers comme Imgkeep/{host}.
• Vos noms de fichiers : composez des noms avec {name}, {host}, {date}, {time}, {w} et {h}, par exemple {name}-{w}x{h}.
• N'écrase jamais rien : si un fichier du même nom existe déjà, le nouveau reçoit un numéro, comme « (1) », au lieu de le remplacer.

CONÇU POUR MÉRITER VOTRE CONFIANCE

• Reste en dehors de vos pages : Imgkeep ne lit pas les sites que vous visitez, à une exception près, que vous contrôlez : quand vous lui demandez de trouver une image recouverte, il regarde cette page, une seule fois, à ce moment-là. Il ne modifie jamais une page. Désactivé tant que vous ne l'activez pas.
• Vos images ne quittent jamais votre ordinateur : elles sont converties sur votre appareil. Pas d'envoi, pas de compte. La seule chose qu'Imgkeep envoie est un résumé quotidien anonyme, comme « 12 enregistrements en JPG, 1 échec », pour savoir quoi améliorer. Jamais d'adresses ni de noms de fichiers. Un clic dans les Options le désactive.
• Seulement quatre autorisations : contextMenus, downloads, storage, offscreen. Deux de plus, activeTab et scripting, seulement si vous activez Trouver l'image ici.
• Open source sous licence MIT, sans étape de compilation : ce que vous lisez est ce qui s'exécute.
• Gratuit, sans limites : pas de pub, pas d'onglets de bienvenue. Imgkeep n'ouvre une petite fenêtre que si vous la demandez (Copier en PNG, Plus d'options) ou quand un enregistrement a besoin de votre accord, et ne demande une note qu'une seule fois, après que vous l'avez utilisé un moment.

QUAND UN SITE BLOQUE UNE IMAGE

Quelques sites empêchent d'autres sites de lire leurs images. Seulement dans ce cas, et seulement après que vous l'avez autorisé d'un clic, Imgkeep demande à votre navigateur l'accès à ce seul site. Vous pouvez le retirer à tout moment dans les Options. Ou choisissez « Enregistrer au format d'origine ».

Toutes les fonctions d'Imgkeep d'aujourd'hui restent gratuites. Idées et votes : imgkeep.app/ideas.html
```

## ja — Japanese

```text
Imgkeep は無料のオープンソースのブラウザ拡張機能です。右クリックメニューに項目を1つ追加します。形式を選ぶと、画像はパソコン上で変換され、そのまま指定のフォルダに保存されます。PNG としてコピーして、どこにでも貼り付けることもできます。

右クリックが届かない場所でも使えます：Instagram や Pinterest などのサイトでは、写真の上に別の層があり、右クリックが届きません。「Imgkeep: ここで画像を探す」を選ぶと、Imgkeep が写真をいちばん大きいサイズで見つけます。オンにするまでオフです。

最近は多くのサイトが、他のアプリでは開けない WebP や AVIF の画像を使っています。Imgkeep なら右クリック一回で、どこでも開けるファイルに変換できます。

Imgkeep: 名前を付けて画像を保存 → PNG · JPG · WebP · GIF（アニメーションを保持） · PDF · 元の形式 · PNGとしてコピー · その他のオプション…

形式

• どこでも開けるファイル：標準的な JPG や PNG で保存。JPG は .jfif ではなく .jpg で保存されます。SVG や data: 画像にも対応。
• アニメーションを保持：アニメーション WebP・AVIF・APNG は、タイミングと透過を保ったまま動く GIF になります。アニメーション GIF はそのまま保存されます。
• PDF で保存：画像とまったく同じサイズの 1 ページの PDF。領収書や書類、共有に便利です。透過も保たれます。
• PNGとしてコピー：透過を保った本物のPNGとしてクリップボードに入れ、どこにでも貼り付けられます。

サイズと画質

• サイズ変更：オプションで最大幅を設定すると、それより大きい画像は縦横比を保って縮小されます。小さい画像は拡大されません。
• その他のオプション：仕上がりをプレビューし、実際のピクセル数とファイルサイズを確認してから、その画像だけの形式、幅、画質、背景、ファイル名を選べます。
• 画質を調整：JPG と WebP の画質スライダー、透過画像を JPG で保存するときの背景色を設定できます。

フォルダとファイル名

• 指定のフォルダへ保存：一度フォルダを選べば、すべての画像がそこに保存されます。Chrome のダウンロード フォルダを使うことも、毎回確認することもできます。Imgkeep/{host} のようなサブフォルダも追加できます。
• ファイル名を自由に：{name}、{host}、{date}、{time}、{w}、{h} を組み合わせて名前を作れます。例：{name}-{w}x{h}
• 上書きしない：同じ名前のファイルがあれば、置き換えずに「 (1)」のような番号を付けて保存します。

安心して使えるように

• ページには立ち入りません：Imgkeep は閲覧中のサイトを読み取りません。例外はあなたが決める1つだけ。覆われた画像を探すよう頼んだときに、そのページを、その瞬間に1回だけ見ます。ページを変更することはありません。オンにするまでオフです。
• 画像がパソコンの外に出ることはありません：お使いのデバイス上で変換されます。アップロードもアカウントもなし。Imgkeep が送るのは「JPGで12回保存、1回失敗」のような匿名の1日分のまとめだけで、改善に役立てます。アドレスやファイル名は一切含みません。オプションでワンクリックでオフにできます。
• 権限は 4 つだけ：contextMenus、downloads、storage、offscreen。「ここで画像を探す」をオンにした場合のみ、activeTab と scripting の 2 つが加わります。
• MIT ライセンスのオープンソースで、ビルド工程なし。読めるコードがそのまま動きます。
• 無料で制限なし：広告なし、ようこそタブなし。小さなウィンドウが開くのは、あなたが呼び出したとき（PNGとしてコピー、その他のオプション）か、保存に確認が必要なときだけ。評価のお願いは、しばらく使っていただいた後に一度だけです。

サイトが画像をブロックしているとき

一部のサイトは、他のサイトから画像を読み込めないようにしています。その場合に限り、あなたがクリックで許可したときだけ、Imgkeep はそのサイトひとつへのアクセスをブラウザに求めます。アクセスはオプションからいつでも削除できます。「代わりに元の形式で保存」を選ぶこともできます。

現在の Imgkeep のすべての機能は、これからも無料です。アイデアと投票：imgkeep.app/ideas.html
```

## hi — Hindi

```text
Imgkeep एक मुफ़्त, ओपन-सोर्स ब्राउज़र एक्सटेंशन है। यह आपके राइट-क्लिक मेन्यू में एक विकल्प जोड़ता है: फ़ॉर्मैट चुनें, और इमेज आपके कंप्यूटर पर बदलकर सीधे आपके फ़ोल्डर में सेव हो जाती है। या इसे PNG के रूप में कॉपी करके कहीं भी पेस्ट करें।

जहाँ राइट-क्लिक काम नहीं करता, वहाँ भी काम करता है: Instagram और Pinterest जैसी साइटों पर फ़ोटो एक और परत के नीचे होती हैं, इसलिए राइट-क्लिक उन तक नहीं पहुँचता। Imgkeep: यहाँ इमेज ढूँढें चुनें, और Imgkeep आपके लिए फ़ोटो उसके सबसे बड़े साइज़ में ढूँढ देता है। जब तक आप चालू न करें, यह बंद रहता है।

आजकल कई साइटें WebP और AVIF इमेज देती हैं जो दूसरे ऐप नहीं खोलते। Imgkeep एक राइट-क्लिक में उन्हें ऐसी फ़ाइलों में बदल देता है जो हर जगह खुलती हैं:

Imgkeep: इमेज इस रूप में सेव करें → PNG · JPG · WebP · GIF (एनिमेशन बना रहता है) · PDF · मूल फ़ॉर्मैट · PNG के रूप में कॉपी करें · और विकल्प…

फ़ॉर्मैट

• हर जगह खुलने वाली फ़ाइलें: सामान्य JPG या PNG, और JPG फ़ाइलें .jfif नहीं, .jpg के रूप में सेव होती हैं। SVG और data: इमेज भी चलती हैं।
• एनिमेशन बना रहता है: एनिमेटेड WebP, AVIF और APNG ऐसे GIF बन जाते हैं जो चलते रहते हैं, उनकी टाइमिंग और पारदर्शिता के साथ। एनिमेटेड GIF बिल्कुल वैसे ही सेव होते हैं।
• PDF में सेव करें: इमेज के बिल्कुल बराबर आकार का एक पेज का PDF, रसीदों, दस्तावेज़ों और शेयर करने के लिए। पारदर्शिता बनी रहती है।
• PNG के रूप में कॉपी करें: इमेज पारदर्शिता के साथ असली PNG के रूप में क्लिपबोर्ड पर जाती है, कहीं भी पेस्ट करने के लिए तैयार।

साइज़ और क्वालिटी

• साइज़ बदलें: विकल्पों में अधिकतम चौड़ाई तय करें और बड़ी इमेज आकार का अनुपात बनाए रखते हुए छोटी हो जाती हैं। छोटी इमेज कभी बड़ी नहीं की जातीं।
• और विकल्प: नतीजे का प्रीव्यू उसके असली साइज़ (पिक्सेल और किलोबाइट) के साथ देखें, फिर सिर्फ़ उस इमेज के लिए फ़ॉर्मैट, चौड़ाई, क्वालिटी, बैकग्राउंड और फ़ाइल का नाम चुनें।
• क्वालिटी आपके हाथ में: JPG और WebP क्वालिटी के स्लाइडर, और JPG में सेव होने वाली पारदर्शी इमेज के लिए बैकग्राउंड रंग।

फ़ोल्डर और नाम

• आपके फ़ोल्डर में सेव: एक बार फ़ोल्डर चुनें और हर इमेज वहीं जाएगी, या Chrome का डाउनलोड फ़ोल्डर इस्तेमाल करें, या हर बार पूछें। Imgkeep/{host} जैसे सब-फ़ोल्डर जोड़ें।
• आपके फ़ाइल नाम: {name}, {host}, {date}, {time}, {w} और {h} से नाम बनाएँ, जैसे {name}-{w}x{h}।
• कभी ओवरराइट नहीं करता: अगर उसी नाम की फ़ाइल पहले से है, तो नई फ़ाइल को " (1)" जैसा नंबर मिलता है और पुरानी फ़ाइल बदली नहीं जाती।

भरोसे के लिए बनाया गया

• आपके पेजों से दूर रहता है: Imgkeep आपकी देखी गई साइटों को नहीं पढ़ता, सिर्फ़ एक अपवाद के साथ जो आपके हाथ में है: जब आप उससे कोई ढकी हुई इमेज ढूँढने को कहते हैं, तो वह उस पेज को एक बार, उसी पल देखता है। वह कभी किसी पेज को नहीं बदलता। जब तक आप चालू न करें, यह बंद रहता है।
• आपकी इमेज कभी आपके कंप्यूटर से बाहर नहीं जातीं: वे आपके डिवाइस पर ही बदली जाती हैं। न अपलोड, न अकाउंट। Imgkeep सिर्फ़ एक गुमनाम रोज़ का सारांश भेजता है, जैसे "JPG में 12 सेव, 1 विफल", ताकि हम जानें कि क्या बेहतर करना है। कभी भी पते या फ़ाइल के नाम नहीं। विकल्पों में एक क्लिक से इसे बंद करें।
• सिर्फ़ चार अनुमतियाँ: contextMenus, downloads, storage, offscreen। दो और, activeTab और scripting, सिर्फ़ तब जब आप यहाँ इमेज ढूँढें चालू करें।
• MIT लाइसेंस के तहत ओपन सोर्स, बिना बिल्ड स्टेप के, यानी जो आप पढ़ते हैं वही चलता है।
• मुफ़्त, बिना किसी सीमा के: न विज्ञापन, न वेलकम टैब। Imgkeep छोटी विंडो तभी खोलता है जब आप खुद कहें (PNG के रूप में कॉपी करें, और विकल्प) या जब किसी सेव के लिए आपकी मंज़ूरी चाहिए, और कुछ समय इस्तेमाल के बाद सिर्फ़ एक बार रेटिंग माँगता है।

जब कोई साइट इमेज को ब्लॉक करती है

कुछ साइटें दूसरी साइटों को अपनी इमेज पढ़ने से रोकती हैं। सिर्फ़ तभी, और सिर्फ़ आपके क्लिक करके अनुमति देने के बाद, Imgkeep आपके ब्राउज़र से उस एक साइट की पहुँच माँगता है। आप इसे कभी भी विकल्पों में हटा सकते हैं। या "इसके बजाय मूल फ़ॉर्मैट में सेव करें" चुनें।

Imgkeep की आज की हर सुविधा मुफ़्त रहेगी। सुझाव और वोट: imgkeep.app/ideas.html
```

## ar — Arabic

```text
Imgkeep إضافة متصفح مجانية ومفتوحة المصدر. تضيف عنصرًا واحدًا إلى قائمة النقر بزر الماوس الأيمن: اختر صيغة، فتُحوَّل الصورة على جهازك وتُحفظ مباشرة في مجلدك. أو انسخها بصيغة PNG والصقها في أي مكان.

يعمل حيث لا تعمل النقرة اليمنى: في مواقع مثل Instagram وPinterest، تكون الصور تحت طبقة أخرى فلا تصل إليها النقرة اليمنى. اختر Imgkeep: البحث عن الصورة هنا، وسيجد Imgkeep الصورة لك بأكبر حجم لها. متوقف حتى تشغّله.

تقدّم مواقع كثيرة اليوم صور WebP وAVIF لا تفتحها التطبيقات الأخرى. يحوّلها Imgkeep إلى ملفات تُفتح في كل مكان، بنقرة يمنى واحدة:

Imgkeep: حفظ الصورة بصيغة ← PNG · JPG · WebP · GIF (مع الحفاظ على الحركة) · PDF · الصيغة الأصلية · نسخ بصيغة PNG · مزيد من الخيارات…

الصيغ

• ملفات تُفتح في أي مكان: JPG أو PNG قياسية، وتُحفظ ملفات JPG بامتداد ‎.jpg وليس ‎.jfif. تعمل صور SVG وdata:‎ أيضًا.
• الحفاظ على الحركة: تتحول صور WebP وAVIF وAPNG المتحركة إلى GIF يظل متحركًا، بتوقيتها وشفافيتها. وتُحفظ ملفات GIF المتحركة كما هي تمامًا.
• الحفظ بصيغة PDF: ملف PDF من صفحة واحدة بحجم الصورة تمامًا، للإيصالات والمستندات والمشاركة. وتبقى الشفافية كما هي.
• النسخ بصيغة PNG: تُنسخ الصورة إلى الحافظة كملف PNG حقيقي مع شفافيتها، جاهزة للصق في أي مكان.

الحجم والجودة

• تغيير الحجم: حدّد عرضًا أقصى من الخيارات فتُصغَّر الصور الأكبر لتناسبه مع الحفاظ على نسبها. ولا تُكبَّر الصور الأصغر أبدًا.
• مزيد من الخيارات: عاين النتيجة بحجمها الحقيقي بالبكسل والكيلوبايت، ثم اختر الصيغة والعرض والجودة والخلفية واسم الملف لهذه الصورة وحدها.
• جودة تتحكم بها: أشرطة لضبط جودة JPG وWebP، ولون الخلفية للصور الشفافة المحفوظة بصيغة JPG.

المجلدات والأسماء

• الحفظ في مجلدك: اختر مجلدًا مرة واحدة وستذهب إليه كل صورة، أو استخدم مجلد التنزيلات في Chrome، أو اطلب السؤال في كل مرة. أضف مجلدات فرعية مثل Imgkeep/{host}.
• أسماء ملفاتك: كوّن الأسماء من {name} و{host} و{date} و{time} و{w} و{h}، مثل {name}-{w}x{h}.
• لا يستبدل أي ملف: إذا كان هناك ملف بالاسم نفسه، يحصل الملف الجديد على رقم مثل " (1)" بدلًا من استبدال القديم.

مصمَّم ليكون جديرًا بالثقة

• يبقى خارج صفحاتك: لا يقرأ Imgkeep المواقع التي تزورها، باستثناء واحد تتحكم فيه: عندما تطلب منه العثور على صورة مخفية، ينظر إلى تلك الصفحة مرة واحدة، في تلك اللحظة. ولا يغيّر أي صفحة أبدًا. متوقف حتى تشغّله.
• صورك لا تغادر جهازك أبدًا: تُحوَّل على جهازك. بلا رفع ملفات، بلا حساب. الشيء الوحيد الذي يرسله Imgkeep هو ملخص يومي مجهول، مثل "12 حفظًا بصيغة JPG، فشل 1"، لنعرف ما الذي نحسّنه. لا عناوين ولا أسماء ملفات أبدًا. نقرة واحدة في الخيارات توقفه.
• أربعة أذونات فقط: contextMenus وdownloads وstorage وoffscreen. واثنان آخران، activeTab وscripting، فقط إذا شغّلت البحث عن الصورة هنا.
• مفتوح المصدر بترخيص MIT، وبلا خطوة بناء، فما تقرؤه هو ما يعمل.
• مجاني وبلا حدود: بلا إعلانات، بلا علامات تبويب ترحيبية. لا يفتح Imgkeep نافذة صغيرة إلا عندما تطلبها (نسخ بصيغة PNG، مزيد من الخيارات) أو عندما يحتاج الحفظ إلى موافقتك، ويطلب تقييمًا مرة واحدة فقط بعد أن تستخدمه لفترة.

عندما يحظر موقع صورة

تمنع بعض المواقع المواقع الأخرى من قراءة صورها. في هذه الحالة فقط، وفقط بعد أن تسمح بذلك بنقرة، يطلب Imgkeep من متصفحك الوصول إلى ذلك الموقع وحده. يمكنك إزالته في أي وقت من الخيارات. أو اختر "الحفظ بالصيغة الأصلية بدلًا من ذلك".

كل ميزة في Imgkeep اليوم ستبقى مجانية. الأفكار والتصويت: imgkeep.app/ideas.html
```
