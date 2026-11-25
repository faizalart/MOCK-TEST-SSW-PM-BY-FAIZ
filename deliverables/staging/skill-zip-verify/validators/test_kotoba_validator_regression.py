#!/usr/bin/env python3
"""Self-contained regression tests for validate_kotoba_completeness.py."""

from __future__ import annotations

import copy
import sys
import unittest
from pathlib import Path

VALIDATORS_DIR = Path(__file__).resolve().parent
if str(VALIDATORS_DIR) not in sys.path:
    sys.path.insert(0, str(VALIDATORS_DIR))

from validate_kotoba_completeness import (  # noqa: E402
    validate_context_completeness,
    validate_package_bundle,
)


def make_term(tid: str, kanji: str, furigana: str, arti: str, unit_type: str = "noun", status: str = "verified") -> dict:
    return {
        "id": tid,
        "kanji": kanji,
        "furigana": furigana,
        "unitType": unit_type,
        "arti": arti,
        "status": status,
    }


def make_fixture() -> tuple[dict, dict, dict, dict]:
    terms = {
        "t1": make_term("t1", "図", "ず", "gambar / diagram"),
        "t2": make_term("t2", "作業服", "さぎょうふく", "pakaian kerja"),
        "t3": make_term("t3", "襟", "えり", "kerah pakaian"),
        "t4": make_term("t4", "内側", "うちがわ", "bagian dalam"),
        "t5": make_term("t5", "消費者", "しょうひしゃ", "konsumen"),
        "t6": make_term("t6", "ルール", "るーる", "aturan / tata tertib"),
        "t7": make_term("t7", "ほこり", "ほこり", "debu halus"),
        "t8": make_term("t8", "落とす", "おとす", "menjatuhkan / merontokkan", "verb"),
        "t9": make_term("t9", "なくす", "なくす", "menghilangkan / mencegah", "verb"),
        "t10": make_term("t10", "帽子", "ぼうし", "topi kerja", "noun"),
        "t11": make_term("t11", "品目", "ひんもく", "jenis barang / item"),
        "t_eye": make_term("t_eye", "目", "め", "mata"),
        "t_trunc": make_term("t_trunc", "落と", "おと", "menjatuhkan", "verb"),
        "t_tango": make_term("t_tango", "清潔", "たんご", "kebersihan"),
        "t_blank": make_term("t_blank", "清潔", "", "kebersihan"),
        "t_fridge": make_term("t_fridge", "冷蔵庫", "れいぞうこ", "lemari pendingin"),
    }
    dict_data = {"terms": terms}
    pkg_data = {
        "setId": "reg-test-01",
        "questions": [
            {
                "id": "reg-q001",
                "prompt": "<ruby>図<rt>ず</rt></ruby>の<ruby>作業服<rt>さぎょうふく</rt></ruby>は<ruby>襟<rt>えり</rt></ruby>の<ruby>内側<rt>うちがわ</rt></ruby>にほこりを<ruby>落<rt>お</rt></ruby>とす<ruby>品目<rt>ひんもく</rt></ruby>のルールがあります。",
                "instructions": "",
                "options": [
                    {
                        "id": "A",
                        "text": "<ruby>消費者<rt>しょうひしゃ</rt></ruby>のために<ruby>帽子<rt>ぼうし</rt></ruby>でほこりをなくす。",
                    }
                ],
            }
        ],
    }
    mapping_data = {
        "questions": {"reg-q001": ["t1", "t2", "t3", "t4", "t7", "t8", "t11", "t6"]},
        "options": {"reg-q001": {"A": ["t5", "t10", "t7", "t9"]}},
        "byCompositeKey": {"reg-q001::A": ["t5", "t10", "t7", "t9"]},
    }
    tambahan_data = {
        "entries": {
            "reg-q001": {
                "id": "reg-q001",
                "kotobaU": ["図（ず）", "内側（うちがわ）"],
                "kotobaV": ["図（ず） : gambar / diagram", "内側（うちがわ） : bagian dalam"],
                "kotobaFormatted": "図（ず） : gambar / diagram\n内側（うちがわ） : bagian dalam",
            }
        }
    }
    return pkg_data, dict_data, mapping_data, tambahan_data


class TestKotobaCompletenessValidator(unittest.TestCase):
    def test_valid_complete_package_and_allowed_particles_pass(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        errs = validate_package_bundle(pkg, dct, mp, tb)
        self.assertEqual(errs, [], f"Expected 0 errors when particles like の/に/を/が/あります are left unmapped, got {errs}")

    def test_rejects_missing_uchigawa_and_eri_and_zu(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["questions"]["reg-q001"] = ["t2", "t7", "t8", "t11", "t6"]  # drops 図(t1), 襟(t3), 内側(t4)
        errs = validate_package_bundle(pkg, dct, mp, tb)
        surfaces = {e.get("surface") for e in errs if e["code"] == "MISSING_LEXICAL_TERM"}
        self.assertTrue({"図", "襟", "内側"}.issubset(surfaces), f"Expected missing 図/襟/内側, got {errs}")

    def test_rejects_missing_shohisha_nakusu_hokori_rule(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["options"]["reg-q001"]["A"] = ["t10"]  # drops 消費者(t5), ほこり(t7), なくす(t9)
        mp["byCompositeKey"]["reg-q001::A"] = ["t10"]
        mp["questions"]["reg-q001"] = ["t1", "t2", "t3", "t4", "t7", "t8", "t11"]  # drops ルール(t6)
        errs = validate_package_bundle(pkg, dct, mp, tb)
        surfaces = {e.get("surface") for e in errs if e["code"] == "MISSING_LEXICAL_TERM"}
        self.assertTrue({"消費者", "ほこり", "なくす", "ルール"}.issubset(surfaces), f"Got {errs}")

    def test_rejects_truncated_stem_otosu(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["questions"]["reg-q001"] = ["t1", "t2", "t3", "t4", "t7", "t_trunc", "t11", "t6"]
        errs = validate_package_bundle(pkg, dct, mp, tb)
        self.assertTrue(any(e["code"] == "TRUNCATED_STEM_OR_TAIL" for e in errs), f"Expected TRUNCATED_STEM_OR_TAIL, got {errs}")

    def test_rejects_dangling_id(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["options"]["reg-q001"]["A"].append("kb-nonexistent-999")
        mp["byCompositeKey"]["reg-q001::A"] = copy.deepcopy(mp["options"]["reg-q001"]["A"])
        errs = validate_package_bundle(pkg, dct, mp, tb)
        self.assertTrue(any(e["code"] == "DANGLING_OR_UNVERIFIED_TERM" for e in errs), f"Got {errs}")

    def test_rejects_blank_and_tango_readings(self) -> None:
        dct = {
            "t_tango": make_term("t_tango", "清潔", "たんご", "bersih"),
            "t_blank": make_term("t_blank", "帽子", "", "topi"),
        }
        errs = validate_context_completeness("c1", "清潔と帽子。", ["t_tango", "t_blank"], dct)
        codes = {e["code"] for e in errs}
        self.assertIn("PLACEHOLDER_TANGO_READING", codes)
        self.assertIn("INVALID_FURIGANA", codes)

    def test_rejects_substring_kanji_collision_me_in_hinmoku(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["questions"]["reg-q001"].append("t_eye")
        errs = validate_package_bundle(pkg, dct, mp, tb)
        self.assertTrue(any(e["code"] == "SUBSTRING_KANJI_COLLISION" and e.get("termId") == "t_eye" for e in errs), f"Got {errs}")

    def test_rejects_surface_not_in_context(self) -> None:
        pkg, dct, mp, tb = make_fixture()
        mp["options"]["reg-q001"]["A"].append("t_fridge")
        mp["byCompositeKey"]["reg-q001::A"].append("t_fridge")
        errs = validate_package_bundle(pkg, dct, mp, tb)
        self.assertTrue(any(e["code"] == "SURFACE_NOT_IN_CONTEXT" and e.get("termId") == "t_fridge" for e in errs), f"Got {errs}")

    def test_allows_ordinary_particles_and_auxiliaries(self) -> None:
        dct = {
            "a1": make_term("a1", "手洗い", "てあらい", "mencuci tangan"),
            "a2": make_term("a2", "石けん", "せっけん", "sabun"),
            "a3": make_term("a3", "重要", "じゅうよう", "penting", "adjective"),
        }
        errs = validate_context_completeness("c2", "手洗いを石けんでおこなうことは重要です。", ["a1", "a2", "a3"], dct)
        self.assertEqual(errs, [], f"Ordinary grammar/particles must pass, got {errs}")


if __name__ == "__main__":
    unittest.main(verbosity=2)
