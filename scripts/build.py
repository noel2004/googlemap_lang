"""Package the extension without dependencies, test files, or browser caches."""
import hashlib
import json
from pathlib import Path
import zipfile

root = Path(__file__).resolve().parent.parent
manifest = json.loads((root / 'manifest.json').read_text())
files = [
    'manifest.json', 'background.js', 'languages.js', 'redirects.js', 'ui.js',
    'popup.html', 'popup.js', 'options.html', 'options.js', 'styles.css',
    'README.md', 'LICENSE', 'privacy.html',
]
files.extend(path.relative_to(root).as_posix() for path in sorted((root / '_locales').glob('*/messages.json')))
files.extend(path.relative_to(root).as_posix() for path in sorted((root / 'icons').glob('*.png')))
dist = root / 'dist'
dist.mkdir(exist_ok=True)
archive = dist / f'your-lang-for-google-map-{manifest["version"]}.zip'
with zipfile.ZipFile(archive, 'w', compression=zipfile.ZIP_DEFLATED) as package:
    for name in files:
        info = zipfile.ZipInfo(name, date_time=(2026, 1, 1, 0, 0, 0))
        info.compress_type = zipfile.ZIP_DEFLATED
        info.external_attr = 0o100644 << 16
        package.writestr(info, (root / name).read_bytes())
with zipfile.ZipFile(archive) as package:
    assert package.testzip() is None, 'Corrupt archive'
    for name in files:
        assert package.read(name) == (root / name).read_bytes(), name
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
archive.with_suffix('.zip.sha256').write_text(f'{digest}  {archive.name}\n')
print(f'{archive} ({archive.stat().st_size} bytes, {len(files)} files)')
print(f'SHA256: {digest}')

handoff_files = [
    'store/SUBMISSION.md', 'store/LISTING.md', 'store/ASSETS.md', 'privacy.html',
    'icons/icon128.png', 'store/artwork/promo-440x280.png',
    'store/artwork/screenshot-settings-1280x800.png',
    'store/artwork/screenshot-menu-1280x800.png',
    'store/artwork/screenshot-languages-1280x800.png',
]
handoff = dist / f'your-lang-for-google-map-submission-{manifest["version"]}.zip'
with zipfile.ZipFile(handoff, 'w', compression=zipfile.ZIP_DEFLATED) as package:
    package.write(archive, archive.name)
    package.write(archive.with_suffix('.zip.sha256'), archive.with_suffix('.zip.sha256').name)
    for name in handoff_files:
        package.write(root / name, name)
with zipfile.ZipFile(handoff) as package:
    assert package.testzip() is None, 'Corrupt handoff archive'
print(f'Submission handoff: {handoff} ({handoff.stat().st_size} bytes)')
