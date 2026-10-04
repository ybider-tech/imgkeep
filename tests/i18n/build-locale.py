#!/usr/bin/env python3
"""Writes extension/_locales/<lang>/messages.json from a translation dict, copying descriptions
and placeholder definitions from the English file so translators only supply the text."""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
EN = json.load(open(os.path.join(ROOT, "extension", "_locales", "en", "messages.json"), encoding="utf-8"))

def write(lang, texts):
    missing = sorted(set(EN) - set(texts))
    extra = sorted(set(texts) - set(EN))
    if missing or extra:
        sys.exit(f"{lang}: missing {missing} extra {extra}")
    out = {}
    for key, en in EN.items():
        entry = {"message": texts[key]}
        if "placeholders" in en:
            entry["placeholders"] = en["placeholders"]
        out[key] = entry
    folder = os.path.join(ROOT, "extension", "_locales", lang)
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "messages.json"), "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{lang}: {len(out)} messages")
