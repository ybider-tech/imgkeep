# Uninstall form (Google Forms)

**Live:** created and published 2026-10-11 in helloimgkeep@gmail.com's Google Forms, named "Imgkeep uninstall feedback".
- Pre-filled link (the extension uses this, with its own version in place of `0.7.1`):
  `https://docs.google.com/forms/d/e/1FAIpQLSfC9O-KMngfyRF6yA7BMdxHgmHRSZBIDJdHeF886wsq_8aT6w/viewform?usp=pp_url&entry.1734858481=0.7.1`
- Entry ids: reason `entry.1021747388`, keep-it `entry.956757514`, version `entry.1734858481`.
- Header image served from this repo (raw.githubusercontent.com), set through "By URL".

Opened by the browser right after someone removes Imgkeep (`chrome.runtime.setUninstallURL`, from 0.7.1).
Owner: helloimgkeep@gmail.com. Answers go to the form's Google Sheet. English only.

## Look (Customize theme, palette icon)
- **Header image:** `header-1600x400.png` (re-render from `header.html` if the icon or wording changes).
- **Colour:** custom `#0f6b5c` (Imgkeep green). **Background:** the lightest option.
- **Fonts:** any clean sans in the list (Roboto is fine) for header, questions and text.

## Content

**Title:** Imgkeep uninstall feedback (the header image already says "Sorry to see you go")

**Description:**
> Two quick questions, both optional. Answers are anonymous: we don't ask for your name or email.
> Want a reply? Write to helloimgkeep@gmail.com instead.

**1. Why did you remove Imgkeep?** Multiple choice, not required, with "Other" turned on.
- It didn't work on a site I needed
- A feature I need is missing
- Too many windows or prompts
- I only needed it once
- I found something else that works better
- Other: …

**2. What would have made you keep it?** Paragraph, not required.
Description: "Even one sentence helps."

**3. Version.** Short answer, not required. Description: "Filled in automatically, no need to change it."
(Filled from the link, so we know which version people left from.)

**Confirmation message** (Settings → Presentation):
> Thank you. We read every answer. If you change your mind, Imgkeep is still at imgkeep.app.

## Settings
- Responses → **Collect email addresses: Do not collect.**
- Responses → **Limit to 1 response: off** (on would force people to sign in to Google).
- **Allow response editing: off.** No sign-in required anywhere.
- Presentation → **Show progress bar: off**, **Shuffle question order: off**.

## Link for the extension
⋮ menu → **Get pre-filled link** → type `0.7.1` in **Version** → **Get link** → copy.
It looks like `https://docs.google.com/forms/d/e/…/viewform?usp=pp_url&entry.123456789=0.7.1`.
The extension replaces `0.7.1` with its own version, so the link keeps working for later releases.
