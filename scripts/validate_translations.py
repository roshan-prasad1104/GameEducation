"""Checks lesson/quiz translations in backend/src/main/resources/seed/i18n/<lang>/<subject>.json
against the English source (seed/content.json).

A translation file mirrors one English subject position by position:
  {"language": "hi", "subject": "math", "name": ..., "description": ...,
   "chapters": [{"title", "description",
                 "lessons": [{"title", "summary", "content"}],
                 "quiz": {"title", "description",
                          "questions": [{"prompt", "options": [...], "explanation"}]}}]}

Hard errors (exit 1): structure/count mismatches, empty strings, altered code blocks or inline
code, options that are pure numbers/symbols not kept verbatim, numbers in questions/options
missing from the translation, text not written in the target script, heading count mismatch.

Usage: python scripts/validate_translations.py [lang ...]    (default: every language folder)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent / "backend/src/main/resources/seed"
KEY_POINTS = {"hi": "मुख्य बातें", "or": "ମୁଖ୍ୟ କଥା", "te": "ముఖ్యాంశాలు"}  # must match LessonView.jsx
SCRIPTS = {"hi": (0x0900, 0x097F), "or": (0x0B00, 0x0B7F), "te": (0x0C00, 0x0C7F)}
FENCE = re.compile(r"```.*?```", re.S)
INLINE = re.compile(r"`[^`\n]+`")
NUMBER = re.compile(r"\d+(?:\.\d+)?")
HEADING = re.compile(r"^#{1,6} ", re.M)

errors: list[str] = []
warnings: list[str] = []


def err(where, msg):
    errors.append(f"{where}: {msg}")


def strip_code(s):
    return INLINE.sub(" ", FENCE.sub(" ", s))


def script_ratio(s, lang):
    lo, hi = SCRIPTS[lang]
    text = strip_code(s)
    letters = [c for c in text if c.isalpha()]
    if not letters:
        return 1.0
    return sum(1 for c in letters if lo <= ord(c) <= hi) / len(letters)


def check_text(where, en, tr, lang, *, numbers_strict=False, min_ratio=0.5):
    if not isinstance(tr, str) or not tr.strip():
        err(where, "missing or empty")
        return
    if FENCE.findall(en) != FENCE.findall(tr):
        err(where, "fenced code blocks must be copied verbatim, in the same order")
    if sorted(INLINE.findall(FENCE.sub("", en))) != sorted(INLINE.findall(FENCE.sub("", tr))):
        err(where, "inline `code` spans must be kept verbatim")
    if len(HEADING.findall(en)) != len(HEADING.findall(tr)):
        err(where, f"heading count {len(HEADING.findall(tr))} != English {len(HEADING.findall(en))}")
    en_nums = NUMBER.findall(strip_code(en))
    tr_nums = NUMBER.findall(strip_code(tr))
    missing = [n for n in set(en_nums) if n not in tr_nums]
    if missing:
        msg = f"numbers missing from translation: {sorted(missing)} (use Western digits 0-9)"
        if numbers_strict:
            err(where, msg)
        else:
            warnings.append(f"{where}: {msg}")
    if any(c.isalpha() for c in strip_code(en)) and script_ratio(tr, lang) < min_ratio:
        err(where, f"not written in the target script (ratio {script_ratio(tr, lang):.2f})")


def check_option(where, en, tr, lang):
    if not isinstance(tr, str) or not tr.strip():
        err(where, "missing or empty")
        return
    text = strip_code(en)
    if not re.search(r"[A-Za-z]", text):
        if tr != en:
            err(where, f"symbolic/numeric option must stay verbatim: {en!r} -> {tr!r}")
        return
    # Formulas, units and acronyms ("2πrh", "80 cm²", "LPG", "kJ/kg") may stay exactly as in English.
    if tr == en and not re.search(r"[A-Za-z]{4,}", text):
        return
    check_text(where, en, tr, lang, numbers_strict=True, min_ratio=0.3 if re.search(r"[A-Za-z]{4,}", text) else 0)


def check_option_set(where, en_opts, tr_opts):
    """An explanatory note added to just one option makes it stand out and can give the answer away."""
    annotated = [i for i, (a, b) in enumerate(zip(en_opts, tr_opts))
                 if isinstance(b, str) and "(" in b and "(" not in a]
    if len(annotated) == 1 and len(en_opts) > 2:
        err(where, f"only option {annotated[0]} got an added note in brackets; annotate all options or none")


def check_subject(lang, en_subject, path):
    tr = json.loads(path.read_text(encoding="utf-8"))
    w = f"{lang}/{path.name}"
    if tr.get("language") != lang or tr.get("subject") != en_subject["code"]:
        err(w, "language/subject header does not match the file location")
    check_text(f"{w} name", en_subject["name"], tr.get("name"), lang)
    check_text(f"{w} description", en_subject["description"], tr.get("description"), lang)
    en_ch, tr_ch = en_subject["chapters"], tr.get("chapters") or []
    if len(en_ch) != len(tr_ch):
        err(w, f"{len(tr_ch)} chapters, English has {len(en_ch)}")
        return
    for ci, (ec, tc) in enumerate(zip(en_ch, tr_ch), 1):
        cw = f"{w} ch{ci}"
        check_text(f"{cw} title", ec["title"], tc.get("title"), lang)
        check_text(f"{cw} description", ec["description"], tc.get("description"), lang)
        el, tl = ec["lessons"], tc.get("lessons") or []
        if len(el) != len(tl):
            err(cw, f"{len(tl)} lessons, English has {len(el)}")
        for li, (a, b) in enumerate(zip(el, tl), 1):
            lw = f"{cw} lesson{li}"
            check_text(f"{lw} title", a["title"], b.get("title"), lang)
            check_text(f"{lw} summary", a["summary"], b.get("summary"), lang)
            check_text(f"{lw} content", a["content"], b.get("content"), lang)
            kp = re.search(r"^#{2,3}\s*Key points\s*$", a["content"], re.M | re.I)
            if kp and isinstance(b.get("content"), str) and not re.search(
                    r"^#{2,3}\s*" + re.escape(KEY_POINTS[lang]) + r"\s*$", b["content"], re.M):
                err(f"{lw} content", f'the closing "Key points" heading must be "{KEY_POINTS[lang]}" (the app looks for it)')
            if isinstance(b.get("content"), str) and len(b["content"]) < 0.6 * len(a["content"]):
                err(f"{lw} content", "much shorter than the English lesson; translate it completely")
        eq, tq = ec["quiz"], tc.get("quiz") or {}
        check_text(f"{cw} quiz title", eq["title"], tq.get("title"), lang)
        check_text(f"{cw} quiz description", eq["description"], tq.get("description"), lang)
        eqs, tqs = eq["questions"], tq.get("questions") or []
        if len(eqs) != len(tqs):
            err(cw, f"{len(tqs)} questions, English has {len(eqs)}")
        for qi, (a, b) in enumerate(zip(eqs, tqs), 1):
            qw = f"{cw} q{qi}"
            check_text(f"{qw} prompt", a["prompt"], b.get("prompt"), lang, numbers_strict=True, min_ratio=0.3)
            check_text(f"{qw} explanation", a["explanation"], b.get("explanation"), lang, numbers_strict=True, min_ratio=0.3)
            opts = b.get("options") or []
            if len(opts) != len(a["options"]):
                err(qw, f"{len(opts)} options, English has {len(a['options'])} (order must match: the answer key is shared)")
            for oi, (x, y) in enumerate(zip(a["options"], opts)):
                check_option(f"{qw} option{oi}", x, y, lang)
            check_option_set(qw, a["options"], opts)
            extra = set(b) - {"prompt", "options", "explanation"}
            if extra:
                err(qw, f"unexpected keys {sorted(extra)} (never include correctIndex)")


def main(langs):
    content = json.loads((ROOT / "content.json").read_text(encoding="utf-8"))
    by_code = {s["code"]: s for s in content["subjects"]}
    i18n = ROOT / "i18n"
    langs = langs or sorted(p.name for p in i18n.iterdir() if p.is_dir()) if i18n.exists() else langs
    for lang in langs:
        if lang not in SCRIPTS:
            err(lang, "unsupported language")
            continue
        for path in sorted((i18n / lang).glob("*.json")):
            subject = path.stem
            if subject not in by_code:
                err(f"{lang}/{path.name}", "unknown subject code")
                continue
            try:
                check_subject(lang, by_code[subject], path)
            except (json.JSONDecodeError, KeyError, TypeError, AttributeError) as e:
                err(f"{lang}/{path.name}", f"unreadable: {e}")
        missing = sorted(set(by_code) - {p.stem for p in (i18n / lang).glob("*.json")})
        if missing:
            warnings.append(f"{lang}: subjects not translated yet: {missing}")
    for w in warnings:
        print("WARN ", w)
    for e in errors:
        print("ERROR", e)
    print(f"{len(errors)} error(s), {len(warnings)} warning(s)")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
