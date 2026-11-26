import os
import shutil
import zipfile
from pathlib import Path

src_zip = Path(r"C:\Users\Admin\Downloads\latsol-otaff-pm-modul-5.1-10-paket.zip")
incoming_zip = Path("deliverables/incoming/latsol-otaff-pm-modul-5.1-10-paket.zip")
staging_dir = Path("deliverables/staging/otaff-pm51-10-packages")

incoming_zip.parent.mkdir(parents=True, exist_ok=True)
if not incoming_zip.exists():
    shutil.copy2(src_zip, incoming_zip)
    print(f"Copied ZIP to {incoming_zip}")

if staging_dir.exists():
    shutil.rmtree(staging_dir)
staging_dir.mkdir(parents=True, exist_ok=True)

with zipfile.ZipFile(incoming_zip, "r") as zf:
    bad = zf.testzip()
    if bad is not None:
        raise RuntimeError(f"Corrupted ZIP member: {bad}")
    names = zf.namelist()
    print(f"ZIP integrity OK. Total archive entries: {len(names)}")
    for name in names:
        # Path traversal check
        normalized = name.replace("\\", "/")
        if normalized.startswith("/") or ".." in Path(normalized).parts:
            raise RuntimeError(f"Unsafe path in ZIP: {name}")
        target = (staging_dir / normalized).resolve()
        if not str(target).startswith(str(staging_dir.resolve())):
            raise RuntimeError(f"Path traversal detected: {name}")
    zf.extractall(staging_dir)
    print(f"Extracted safely to {staging_dir}")

# Inventory extracted files
files = [p for p in staging_dir.rglob("*") if p.is_file()]
print(f"Total extracted files: {len(files)}")
by_ext = {}
for f in files:
    ext = f.suffix.lower() or "(no ext)"
    by_ext[ext] = by_ext.get(ext, 0) + 1
print("Counts by extension:", by_ext)

print("\nNon-PNG files:")
for f in sorted(files):
    if f.suffix.lower() != ".png":
        print(" ", f.relative_to(staging_dir).as_posix(), f"({f.stat().st_size} bytes)")
