# NSGlamour Codex Notes

## Project Shape

- This project is a Flask web app for FFXIV glamour equipment data and image template generation.
- The active public/local pages are `/template` and `/equipinfo`; `/` redirects to `/template`.
- Legacy homepage and card-designer files have been removed.
- It may not be a Git repository. Inspect files directly and do not assume `git status` is available.
- Read Chinese text with UTF-8-aware commands in PowerShell, for example `Get-Content -Encoding UTF8`.
- Keep the public `README.md` minimal: it should only expose the project title. Do not add project notes, deployment notes, AI/Codex notes, usage instructions, or troubleshooting content there.
- Put local-only project notes in `_snapshots/README-full-20260701.md` or another ignored file under `_snapshots/` instead; `_snapshots/` is intentionally ignored so those notes are not pushed to GitHub.

## Important Files

- `scripts/app.py`: Flask routes, upload limits, base-path handling, import APIs, and optional Rising Stones helpers.
- `scripts/resolve_chara.py`: `.chara` parsing and resolved equipment data shape.
- `scripts/build_item_mapping.py`: CSV-to-JSON mapping generation.
- `templates/template.html` and `static/template.js`: template workspace, equipment rows, image crop/upload, and PNG export.
- `templates/equipinfo.html` and `static/equipinfo.js`: equipment text/link import, hidden `.chara` drop import, copy text generation, and history.
- `static/ui-language.js` and `data/ui-localization.json`: foreground UI localization.
- `static/app.css`: shared app styling.

## Frontend Rules

- Preserve the compact Chinese UI and existing amber-accented visual language.
- Do not hard-code English-only labels where existing UI is localized.
- For public `/glamour` deployment, route frontend URLs through existing helpers such as `appPath(...)` instead of hard-coded root paths.
- When editing `static/template.js`, `static/equipinfo.js`, `static/ui-language.js`, or `static/app.css`, bump the matching static version query string in the related template.
- Keep mobile layout in mind; verify text does not overflow compact controls.

## Verification

- After JavaScript edits, run:

```powershell
node --check static\template.js
node --check static\equipinfo.js
node --check static\ui-language.js
```

- If the local server is running, check:

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/api/health
```

- For mapping updates, use `update_mapping.bat` or `python scripts/build_item_mapping.py` and confirm `data/item_model_mapping.json` changed as intended.

## Public Deployment

- Public deployment uses `NSGLAMOUR_BASE_PATH=/glamour`.
- Treat uploaded `.chara` files as untrusted input and keep parser/server changes conservative.
- `NSGLAMOUR_ENABLE_CHARA_IMPORT=0` disables browser `.chara` uploads if needed.
