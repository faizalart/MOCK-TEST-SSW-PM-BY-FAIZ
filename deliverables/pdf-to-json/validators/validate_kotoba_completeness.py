#!/usr/bin/env python3
"""Strict per-context Kotoba completeness validator for SSW Mock Test bundles.

Validates:
- Zero dangling / unverified / unresolved termIds
- Nested options[qId][optId] vs byCompositeKey["qId::optId"] parity
- No duplicate termIds inside any prompt or option context
- Valid pure Hiragana furigana on kanji terms and zero "たんご" placeholders
- Non-empty, concise Indonesian meaning (<= 60 chars)
- Mapped terms actually appear inside the exact context text (no global leakage)
- No single-kanji substring collisions inside unsplit compound words (e.g., "目" inside "品目")
- No unmapped lexical content words (Kanji compounds, >=2 katakana loanwords, lexical hiragana, technical ASCII)
  or truncated verb/noun stems (e.g., "落と" instead of "落とす") while allowing ordinary grammatical particles
- Synchronized kotoba-tambahan entries (kotobaU, kotobaV, kotobaFormatted)
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

KANJI_RE = re.compile(r"[\u4e00-\u9faf々]")
SINGLE_KANJI_RE = re.compile(r"^[\u4e00-\u9faf々]$")
HIRAGANA_READING_RE = re.compile(r"^[\u3041-\u3096\u3099-\u309cー]+$")
KATAKANA_MULTI_RE = re.compile(r"[\u30a1-\u30f6ー]{2,}")
RT_RP_RE = re.compile(r"<(?:rt|rp)[^>]*>.*?</(?:rt|rp)>", re.IGNORECASE | re.DOTALL)
HTML_TAG_RE = re.compile(r"<[^>]+>")
PREFIX_MARKER_RE = re.compile(
    r"^(?:\[(?:イラスト|標識|図|写真|品目|保護具)[A-Za-z0-9]+\]\s*)+"
)

TECHNICAL_ASCII = {
    "ppm", "ml", "kg", "g", "L", "m", "HACCP", "CCP", "KYT", "FIFO",
    "OTAFF", "SNS", "5S", "O157", "O111", "X線", "Ｘ線",
}

ALLOWED_PARTICLES = {
    "を", "の", "に", "が", "は", "で", "と", "や", "も", "へ", "か", "ね", "よ",
    "だ", "な", "て", "た", "ば", "ず", "から", "まで", "より", "ので", "のに",
    "なら", "ても", "でも", "ながら", "たり", "だり", "など", "こと", "もの", "ため",
    "です", "ます", "ました", "ません", "ませんでした", "でした", "ですか", "ますか", "ませんか",
    "である", "であり", "であった", "ではない", "ではなく", "でない",
    "する", "し", "した", "して", "しない", "せず", "される", "され", "された", "されて",
    "できる", "でき", "できた", "できない",
    "いる", "い", "いた", "いて", "いない", "おり",
    "ある", "あり", "あっ", "あった", "あって", "ありません", "あります",
    "なる", "なり", "なっ", "なった", "なって",
    "ない", "なく", "なかっ", "なかった", "ないで", "ないか",
    "この", "その", "あの", "どの", "ここ", "そこ", "あそこ",
    "よう", "ように", "ような", "そう", "という", "といった", "だけ", "しか", "ばかり",
}

HIRA_LEXICAL = sorted(
    {
        "せっけん", "ほこり", "やけど", "やっつける", "なくす", "なくなる", "おそれ",
        "たばこ", "ぞうきん", "たわし", "かぼちゃ", "じゃがいも", "たまねぎ", "にんじん",
        "おにぎり", "くさり", "うがい", "はさまれる", "はさまれ", "はさまって", "はさみ",
        "ころぶ", "こぼれる", "ぶつかる", "つまずく", "つまる", "すべる", "しゃがむ",
        "あご", "ひじ", "ほほ", "かかと", "おなか", "おしり", "まぶた", "くしゃみ",
        "うろこ", "せき", "かたまり", "ごみ", "けが", "いのち", "まもる", "そろえる",
        "はかる", "めったに", "うっかり", "わざと", "あらかじめ", "きちんと", "しっかり",
        "ゆっくり", "ていねい", "まったく", "すべて", "おいしさ", "もっと", "それぞれ",
        "どちら", "いつも", "かならず", "なるべく", "できるだけ", "たくさん", "かなり",
        "ほとんど", "あまり", "とくに", "さらに", "なぜ", "いつ", "どこ", "どれ", "どう",
        "ひとり", "すでに", "おろそか", "えび", "かに", "くるみ", "そば", "さば", "いか",
        "たこ", "あさり", "しじみ", "はまぐり", "あわび", "うに", "いくら", "さけ", "かき",
        "ふた", "あわてて", "はずかしい", "ぶかぶか", "ぎっしり", "ひらひら", "まっすぐ",
        "すみずみ", "ぐらぐら", "ふらつき", "かゆみ", "じんましん", "さっと", "じゅうぶん",
        "うまく", "もとづく", "つながる", "かぶる", "ぬぐ", "ぶつける", "おさえる",
        "さわる", "ふかい", "はずれる", "ゆるむ", "こわれる", "きれる", "もらえる",
        "はずす", "あげる", "かわく", "おいしい", "おいしく", "すすぎ",
    },
    key=len,
    reverse=True,
)

TRUNCATED_VERB_ENDINGS = (
    "とす", "とし", "落と", "けて", "ける", "てる", "る", "す", "く", "ぐ",
    "つ", "ぶ", "む", "み", "づく", "まず", "かす",
)


def strip_ruby_and_html(text: str | None) -> str:
    if not text:
        return ""
    cleaned = str(text).replace("**", "")
    cleaned = RT_RP_RE.sub("", cleaned)
    cleaned = HTML_TAG_RE.sub("", cleaned)
    cleaned = PREFIX_MARKER_RE.sub("", cleaned)
    return cleaned.strip()


def has_kanji(text: str) -> bool:
    return bool(KANJI_RE.search(text or ""))


def is_single_kanji(text: str) -> bool:
    return bool(SINGLE_KANJI_RE.match(text or ""))


def is_valid_hiragana_reading(reading: str) -> bool:
    return bool(reading and HIRAGANA_READING_RE.match(reading))


def find_all_offsets(haystack: str, needle: str) -> list[int]:
    if not needle:
        return []
    offsets: list[int] = []
    start = 0
    while True:
        idx = haystack.find(needle, start)
        if idx == -1:
            break
        offsets.append(idx)
        start = idx + 1
    return offsets


def validate_context_completeness(
    context_key: str,
    html: str,
    term_ids: Any,
    terms_dict: dict[str, dict[str, Any]],
    allow_unresolved: bool = False,
) -> list[dict[str, Any]]:
    errors: list[dict[str, Any]] = []
    plain = strip_ruby_and_html(html)

    if not isinstance(term_ids, list):
        errors.append(
            {
                "code": "MISSING_MAPPING_ARRAY",
                "contextKey": context_key,
                "message": "termIds must be a list",
            }
        )
        return errors

    if len(set(term_ids)) != len(term_ids):
        errors.append(
            {
                "code": "DUPLICATE_TERM_IN_CONTEXT",
                "contextKey": context_key,
                "message": f"Duplicate termIds in {context_key}",
            }
        )

    resolved: list[tuple[dict[str, Any], list[int]]] = []
    for tid in term_ids:
        entry = terms_dict.get(tid)
        if not entry or (not allow_unresolved and entry.get("status") != "verified"):
            errors.append(
                {
                    "code": "DANGLING_OR_UNVERIFIED_TERM",
                    "contextKey": context_key,
                    "termId": tid,
                    "message": f"Dangling or unverified termId: {tid}",
                }
            )
            continue

        kanji = str(entry.get("kanji") or "")
        furigana = str(entry.get("furigana") or "")
        arti = str(entry.get("arti") or "")

        if furigana == "たんご":
            errors.append(
                {
                    "code": "PLACEHOLDER_TANGO_READING",
                    "contextKey": context_key,
                    "termId": tid,
                    "message": f'Placeholder "たんご" reading on {tid} ({kanji})',
                }
            )

        if has_kanji(kanji) and not is_valid_hiragana_reading(furigana):
            errors.append(
                {
                    "code": "INVALID_FURIGANA",
                    "contextKey": context_key,
                    "termId": tid,
                    "message": f'Invalid furigana "{furigana}" on kanji term {tid} ({kanji})',
                }
            )

        if not arti.strip() or len(arti) > 60:
            errors.append(
                {
                    "code": "MISSING_OR_LONG_MEANING",
                    "contextKey": context_key,
                    "termId": tid,
                    "message": f"Meaning missing or exceeds 60 chars ({len(arti)}) on {tid}",
                }
            )

        if not kanji or kanji not in plain:
            errors.append(
                {
                    "code": "SURFACE_NOT_IN_CONTEXT",
                    "contextKey": context_key,
                    "termId": tid,
                    "surface": kanji,
                    "message": f'Mapped term "{kanji}" ({tid}) does not appear in {context_key}',
                }
            )
            continue

        resolved.append((entry, find_all_offsets(plain, kanji)))

    # 1) Single-kanji / short-term substring collision check
    for entry, offsets in resolved:
        kanji = entry["kanji"]
        if not has_kanji(kanji):
            continue
        klen = len(kanji)
        independent_somewhere = False
        for pos in offsets:
            end = pos + klen
            swallowed = any(
                other_entry["id"] != entry["id"]
                and len(other_entry["kanji"]) > klen
                and any(op <= pos and op + len(other_entry["kanji"]) >= end for op in other_offsets)
                for other_entry, other_offsets in resolved
            )
            if swallowed:
                continue

            if is_single_kanji(kanji):
                left_is_kanji = pos > 0 and has_kanji(plain[pos - 1])
                right_is_kanji = end < len(plain) and has_kanji(plain[end])
                left_boundary_covered = any(
                    oe["id"] != entry["id"] and any(op + len(oe["kanji"]) == pos for op in oo)
                    for oe, oo in resolved
                )
                right_boundary_covered = any(
                    oe["id"] != entry["id"] and any(op == end for op in oo)
                    for oe, oo in resolved
                )
                if (left_is_kanji and not left_boundary_covered) or (
                    right_is_kanji and not right_boundary_covered
                ):
                    continue

            independent_somewhere = True
            break

        if not independent_somewhere:
            errors.append(
                {
                    "code": "SUBSTRING_KANJI_COLLISION",
                    "contextKey": context_key,
                    "termId": entry["id"],
                    "surface": kanji,
                    "message": f'Substring collision: "{kanji}" ({entry["id"]}) only appears inside another compound in {context_key}',
                }
            )

    # 2) Build character coverage mask over plain text
    covered_mask = [False] * len(plain)
    covered_ends: set[int] = set()
    for entry, offsets in resolved:
        klen = len(entry["kanji"])
        for pos in offsets:
            for k in range(pos, pos + klen):
                covered_mask[k] = True
            covered_ends.add(pos + klen)

    # 3) Check every uncovered contiguous span for missed Kanji, multi-katakana, lexical hiragana,
    #    technical ASCII, or truncated verb/noun inflections right after a covered kanji stem
    i = 0
    n = len(plain)
    while i < n:
        if covered_mask[i]:
            i += 1
            continue

        j = i
        while j < n and not covered_mask[j]:
            j += 1
        span = plain[i:j]

        # Flag uncovered kanji inside this uncovered run
        for km in re.finditer(r"[\u4e00-\u9faf々]+", span):
            errors.append(
                {
                    "code": "MISSING_LEXICAL_TERM",
                    "contextKey": context_key,
                    "surface": km.group(0),
                    "message": f'Unmapped kanji span "{km.group(0)}" at index {i + km.start()} of {context_key}',
                }
            )

        # Flag uncovered >=2-char katakana loanwords
        for kat in KATAKANA_MULTI_RE.finditer(span):
            errors.append(
                {
                    "code": "MISSING_LEXICAL_TERM",
                    "contextKey": context_key,
                    "surface": kat.group(0),
                    "message": f'Unmapped katakana term "{kat.group(0)}" at index {i + kat.start()} of {context_key}',
                }
            )

        # Flag uncovered technical ASCII codes (HACCP, CCP, ppm, etc.)
        for tech in TECHNICAL_ASCII:
            if re.fullmatch(r"[A-Za-z0-9]+", tech):
                for tm in re.finditer(rf"(?<![A-Za-z0-9]){re.escape(tech)}(?![A-Za-z0-9])", span):
                    errors.append(
                        {
                            "code": "MISSING_LEXICAL_TERM",
                            "contextKey": context_key,
                            "surface": tm.group(0),
                            "message": f'Unmapped technical code "{tm.group(0)}" at index {i + tm.start()} of {context_key}',
                        }
                    )

        # Flag uncovered lexical hiragana words (e.g., なくす, ほこり) while permitting particles
        p = 0
        slen = len(span)
        while p < slen:
            matched_lex = None
            for hw in HIRA_LEXICAL:
                if span.startswith(hw, p):
                    matched_lex = hw
                    break
            if matched_lex:
                prev_ch = span[p - 1] if p > 0 else (plain[i - 1] if i > 0 else "")
                next_pos = p + len(matched_lex)
                next_ch = span[next_pos] if next_pos < slen else (plain[i + next_pos] if i + next_pos < n else "")
                # Guard short hiragana words (e.g., うに inside ように, いか inside ないか) against substring false positives
                left_is_non_particle_hira = (
                    "\u3041" <= prev_ch <= "\u3096"
                    and prev_ch not in {"を", "の", "に", "が", "は", "で", "と", "や", "も", "へ"}
                )
                right_is_non_particle_hira = (
                    len(matched_lex) <= 2
                    and "\u3041" <= next_ch <= "\u3096"
                    and next_ch not in {"を", "の", "に", "が", "は", "で", "と", "や", "も", "へ", "だ"}
                )
                inside_noise = (len(matched_lex) <= 3 and left_is_non_particle_hira) or right_is_non_particle_hira
                if not inside_noise and not (matched_lex == "もし" and prev_ch == "か" and next_ch == "れ"):
                    errors.append(
                        {
                            "code": "MISSING_LEXICAL_TERM",
                            "contextKey": context_key,
                            "surface": matched_lex,
                            "message": f'Unmapped lexical hiragana "{matched_lex}" at index {i + p} of {context_key}',
                        }
                    )
                p += 1 if inside_noise else len(matched_lex)
                continue
            p += 1

        # Catch truncated stem tails when a covered Kanji term immediately precedes a single verb tail
        if i in covered_ends and i > 0:
            prev_char = plain[i - 1]
            # Find the covered term ending at i
            ending_terms = [
                e["kanji"]
                for e, offs in resolved
                if any(op + len(e["kanji"]) == i for op in offs)
            ]
            if ending_terms and has_kanji(prev_char):
                for tail in ("とす", "とし", "ける", "てる", "づく", "まず"):
                    if span.startswith(tail):
                        errors.append(
                            {
                                "code": "TRUNCATED_STEM_OR_TAIL",
                                "contextKey": context_key,
                                "surface": f"{ending_terms[0]}{tail}",
                                "message": f'Truncated stem "{ending_terms[0]}" before "{tail}" at {context_key}',
                            }
                        )
                        break
            elif ending_terms and has_kanji(ending_terms[0]):
                et = ending_terms[0]
                tail_expected = None
                if et[-1] in "けれてせめべね" and span.startswith("る") and not span.startswith("るために"):
                    tail_expected = "る"
                elif et[-1] == "と" and span.startswith("す"):
                    tail_expected = "す"
                elif et[-1] == "づ" and span.startswith("く"):
                    tail_expected = "く"
                if tail_expected:
                    errors.append(
                        {
                            "code": "TRUNCATED_STEM_OR_TAIL",
                            "contextKey": context_key,
                            "surface": f"{et}{tail_expected}",
                            "message": f'Truncated verb stem "{et}" missing "{tail_expected}" at {context_key}',
                        }
                    )

        i = j

    return errors


def validate_package_bundle(
    package_data: dict[str, Any],
    dict_data: dict[str, Any],
    mapping_data: dict[str, Any],
    tambahan_data: dict[str, Any] | None = None,
    master_dict_data: dict[str, Any] | None = None,
    allow_unresolved: bool = False,
) -> list[dict[str, Any]]:
    errors: list[dict[str, Any]] = []

    merged_terms: dict[str, dict[str, Any]] = {}
    if master_dict_data:
        merged_terms.update(master_dict_data.get("terms") or {})
    merged_terms.update(dict_data.get("terms") or {})

    questions = package_data.get("questions") or []
    map_questions = mapping_data.get("questions") or {}
    map_options = mapping_data.get("options") or {}
    map_composite = mapping_data.get("byCompositeKey") or {}
    tambahan_entries = (tambahan_data or {}).get("entries") or {}

    for q in questions:
        qid = q["id"]
        q_ids = map_questions.get(qid)
        prompt_html = q.get("prompt") or q.get("questionText") or ""
        instr_html = q.get("instructions") or ""
        # Check prompt context (accept either prompt or prompt+instructions)
        combined_html = f"{prompt_html} {instr_html}".strip()
        errors.extend(
            validate_context_completeness(
                context_key=qid,
                html=prompt_html,
                term_ids=q_ids,
                terms_dict=merged_terms,
                allow_unresolved=allow_unresolved,
            )
        )

        # Allow terms from instructions when mapped onto questions[qid] (never fail instruction terms in prompt)
        # Re-filter any SURFACE_NOT_IN_CONTEXT if surface appears in instructions
        if instr_html:
            instr_plain = strip_ruby_and_html(instr_html)
            errors = [
                err
                for err in errors
                if not (
                    err["contextKey"] == qid
                    and err["code"] == "SURFACE_NOT_IN_CONTEXT"
                    and err.get("surface", "") in instr_plain
                )
            ]

        q_opts_map = map_options.get(qid) or {}
        for opt in q.get("options") or []:
            oid = opt["id"]
            ckey = f"{qid}::{oid}"
            nested_ids = q_opts_map.get(oid)
            comp_ids = map_composite.get(ckey)

            if nested_ids != comp_ids:
                errors.append(
                    {
                        "code": "NESTED_COMPOSITE_MISMATCH",
                        "contextKey": ckey,
                        "message": f"options[{qid}][{oid}] != byCompositeKey[{ckey}]",
                    }
                )

            errors.extend(
                validate_context_completeness(
                    context_key=ckey,
                    html=opt.get("text") or "",
                    term_ids=nested_ids if nested_ids is not None else comp_ids,
                    terms_dict=merged_terms,
                    allow_unresolved=allow_unresolved,
                )
            )

        if tambahan_data is not None:
            t_entry = tambahan_entries.get(qid)
            if not isinstance(t_entry, dict):
                errors.append(
                    {
                        "code": "TAMBAHAN_MISSING_ENTRY",
                        "contextKey": qid,
                        "message": f"Missing kotoba-tambahan entry for {qid}",
                    }
                )
            else:
                ku = t_entry.get("kotobaU") or []
                kv = t_entry.get("kotobaV") or []
                kf = t_entry.get("kotobaFormatted") or ""
                if len(ku) != len(kv) or kf != "\n".join(kv):
                    errors.append(
                        {
                            "code": "TAMBAHAN_DESYNC",
                            "contextKey": qid,
                            "message": f"kotobaU/kotobaV/kotobaFormatted mismatch on {qid}",
                        }
                    )

    return errors


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Validate per-context Kotoba completeness.")
    parser.add_argument("--package", required=True, help="Path to package JSON file.")
    parser.add_argument("--dict", required=True, help="Path to sharedKotobaDictionary[-delta].json.")
    parser.add_argument("--mapping", required=True, help="Path to kotobaMapping[-delta].json.")
    parser.add_argument("--tambahan", help="Optional path to kotoba-tambahan[-delta].json.")
    parser.add_argument("--master-dict", help="Optional fallback master sharedKotobaDictionary.json.")
    parser.add_argument("--allow-unresolved", action="store_true", help="Allow status='unresolved' draft terms.")
    args = parser.parse_args(argv)

    pkg = json.loads(Path(args.package).read_text(encoding="utf-8"))
    dct = json.loads(Path(args.dict).read_text(encoding="utf-8"))
    mp = json.loads(Path(args.mapping).read_text(encoding="utf-8"))
    tb = json.loads(Path(args.tambahan).read_text(encoding="utf-8")) if args.tambahan else None
    md = json.loads(Path(args.master_dict).read_text(encoding="utf-8")) if args.master_dict else None

    errs = validate_package_bundle(pkg, dct, mp, tb, md, allow_unresolved=args.allow_unresolved)
    if errs:
        print(f"FAILED: {len(errs)} Kotoba completeness error(s) in {args.package}", file=sys.stderr)
        print(json.dumps(errs[:25], ensure_ascii=False, indent=2), file=sys.stderr)
        return 1

    print(
        json.dumps(
            {
                "status": "PASS",
                "package": args.package,
                "questions": len(pkg.get("questions") or []),
                "errors": 0,
            },
            ensure_ascii=False,
        )
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
