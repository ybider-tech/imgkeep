// The one rating ask in its own window: behind the "Enjoying Imgkeep? Rate it…" menu item, and opened once by
// itself after a quick save from the menu, when the ask is due (most saves open no window of their own).

import { localisePage } from "./lib/i18n.js";
import { reviewAsk, reviewUses } from "./lib/ui.js";

localisePage();
document.getElementById("ask").append(reviewAsk(() => setTimeout(() => window.close(), 1200), await reviewUses()));
