# Imgkeep privacy policy

Last updated: 19 October 2026

Imgkeep is a browser extension for Chrome and Microsoft Edge that saves the image you right-click as PNG, JPG, WebP, GIF or PDF, or copies it as PNG.

## What Imgkeep collects

No personal data. Your images never leave your computer. The only thing Imgkeep sends is one anonymous daily summary of how its features were used, described below, and you can turn it off.

## What Imgkeep reads

Imgkeep reads only the image you right-click and choose to save. It converts that image on your computer and uploads nothing. Imgkeep doesn't read the sites you visit, with one exception you control: when you ask it to find a hidden image, it looks at that page, just once, at that moment. It never changes a page. Off until you turn it on. When you choose "Find image here" on a site that covers its images (like Instagram or Pinterest), Imgkeep looks at that one page, at that moment, only to find the addresses of the images on screen, and then saves the one you choose like any other. Nothing else from the page is read or kept. You can turn this off in Options, under "Images that sites cover".

## The anonymous daily summary

Since version 0.7.0, Imgkeep counts on your computer how often its features are used. Once a day it sends the totals of the previous day it was used to PostHog, an open-source analytics service, in its EU cloud (eu.i.posthog.com), to learn which features to improve and whether saves fail. (Up to version 0.8.1, summaries went to Aptabase, also hosted in the EU.) It is on by default. Turn it off in Imgkeep's Options, under "Anonymous usage counts"; anything counted and not yet sent is then deleted. The same section shows exactly what has been counted and the last summary sent.

A summary contains only:

- successful saves per format (PNG, JPG, WebP, AVIF, GIF, PDF, ICO, BMP, original) and per save mode (Downloads, a folder you chose, ask every time), how many were made smaller by the maximum width, and how many used the "last used" format at the top of the menu;
- for each conversion, the format the image had and the format it was saved as (for example WebP to JPG), read from the image itself (since 0.8.1);
- failed saves per type of error (for example "the site blocked it" or "couldn't read the image"), and failed copies;
- how many images were copied, how often More options was opened and used to save;
- how often a site-access or folder question was shown and a site was allowed, how the one rating question was answered, and how often Find image here was turned on and found an image, showed a list or found nothing;
- whether Imgkeep was installed that day (a count of 1, since 0.10.2), so we know how many people install it;
- the extension's version, the browser (Chrome or Edge) and its language.

It never contains images, image or page addresses, site names, file or folder names, the text of your settings, or any identifier for you or your device. Each summary carries a new random number, so summaries can't be linked to each other.

Like any service your browser connects to, PostHog receives your IP address when a summary arrives. Imgkeep's PostHog project is set to discard it, and each summary asks PostHog not to look up a location from it, so no IP address, country or city is stored. Each summary is sent as an anonymous event: PostHog keeps no profile of a person for it. PostHog keeps events for up to one year on Imgkeep's plan. Its privacy policy: https://posthog.com/privacy

## Where your settings live

Your settings (save mode, subfolder, file-name template, quality, background colour, maximum width and whether the daily summary is on) are stored in your browser's sync storage. If sync is on in Chrome or Edge, the browser copies them across your devices. If you choose a folder, the browser's handle to that folder is stored locally in the extension's IndexedDB and never leaves your computer. The extension's local storage on this computer keeps the format and width you last used in More options, today's counts until they are summarised, and a count of saves that worked or failed, used only to decide when to ask you once for a rating and to label new menu items after an update.

## The clipboard

Imgkeep writes to your clipboard only when you choose "Copy as PNG", and only the image you picked. It never reads your clipboard.

## Access to sites

Some sites block other sites from reading their images. Only then, and only after you click a button, Imgkeep asks your browser for access to that one site, to fetch the images you pick there. You can remove that access at any time in Imgkeep's Options, under "Sites you've allowed".

## When you remove Imgkeep

If you remove Imgkeep, your browser opens a short, optional Google Form asking why (two questions). Imgkeep adds only its version number to the form's address and sends nothing itself. The form doesn't collect email addresses, and answering is up to you. It is hosted by Google, so Google's privacy policy applies to that page.

## The imgkeep.app website

The website counts, anonymously, which pages are visited and which pages lead people to the Chrome Web Store or Edge Add-ons, so we know which guides help. For each page view it sends the page's path and the name of the site you came from (for example "google.com", never the full address); for each click on a store button, the page and which store; on the Free Image Converter, which formats were converted (for example "webp → jpg", or "→ clipboard" for Copy as PNG) and how many files, never the images, their names or sizes. It sends this to PostHog, the same EU analytics service as the extension's daily summary, with one direct request and no PostHog code. It sets no cookies and stores nothing in your browser, every event gets a new random number so visits can't be linked to each other or to you, no IP address is stored and no location is looked up. Nothing is sent if your browser asks sites not to track you (Global Privacy Control or Do Not Track). The code is short and public: imgkeep.app/count.js

## What Imgkeep never does

No ads, no tracking across sites, no personal data, and your data is never sold.

## Changes

Any change to this policy will be announced before it ships.

## Contact

helloimgkeep@gmail.com · https://imgkeep.app
