// The window behind the "Enjoying Imgkeep? Rate it…" menu item: the one rating ask, nothing else.

import { localisePage } from "./lib/i18n.js";
import { reviewAsk } from "./lib/ui.js";

localisePage();
document.getElementById("ask").append(reviewAsk(() => setTimeout(() => window.close(), 1200)));
