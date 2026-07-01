# NSGlamour

Tools for building FFXIV glamour model mappings from `Item.csv`, converting
glamour equipment information, and generating template images.

## Files

- `scripts/build_item_mapping.py`
  - Reads an `Item.csv` file from a local path or URL.
  - Extracts item model information from `Model{Main}` and equipment slot
    metadata from `EquipSlotCategory`.
  - Produces a normalized mapping JSON, including stain names from `Stain.csv`.
- `scripts/resolve_chara.py`
  - Reads an Anamnesis `.chara` file.
  - Resolves each equipment entry against the generated mapping.
- `scripts/app.py`
  - Serves the `/template` image workspace and `/equipinfo` equipment converter.
- `start_gui.bat`
  - Double-click launcher for the local UI.

The Rising Stones submission helper has been split into the separate sibling
project `H:\NightingaleSilenceWeb\NSSubmitGlamourScirpt`.

## Slot Rules

`EquipSlotCategory` values are mapped with the rule set provided by the user:

- `3` -> `头部防具`
- `4,15,16,19,20,22,23` -> `身体防具`
- `5` -> `手部防具`
- `7,18` -> `腿部防具`
- `8` -> `脚部防具`
- `9` -> `耳饰`
- `10` -> `项链`
- `11` -> `手镯`
- `12` -> `戒指`
- `1,13,2` -> `武器`

## Usage

Build mapping:

```powershell
python scripts/build_item_mapping.py --item-csv "https://raw.githubusercontent.com/InfSein/ffxiv-datamining-mixed/master/chs/Item.csv"
```

Resolve a `.chara` file:

```powershell
python scripts/resolve_chara.py --chara ".\data\example.chara"
```

Start the local UI:

```powershell
start_gui.bat
```

The app opens the template workspace by default. Current pages:

- `/template`: template selection, image upload/crop, equipment rows, and PNG export.
- `/equipinfo`: import glamour data from supported links or pasted text, edit equipment, generate copy text, and send data to `/template`.

The equipment data will show:

- the resolved equipment name for each slot
- all candidate names when one model maps to multiple items
- dye display based on `DyeCount`, `DyeId`, and `DyeId2`

`update_mapping.bat` rebuilds `data\item_model_mapping.json` from the GitHub
CSV sources defined in `scripts\build_item_mapping.py`.

Manual data update:

```powershell
update_mapping.bat
```

## Deploy Under `/glamour`

Example Gunicorn service command:

```bash
python3 -m venv .venv
. .venv/bin/activate
pip install -r requirements.txt
NSGLAMOUR_BASE_PATH=/glamour gunicorn -w 2 -b 127.0.0.1:8766 scripts.app:app
```

Example Nginx location inside the existing `www.nightingalesilence.com` server:

```nginx
location = /glamour {
    return 301 /glamour/;
}

location /glamour/ {
    proxy_pass http://127.0.0.1:8766;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $host;
    proxy_set_header X-Forwarded-Prefix /glamour;
}
```

Health check:

```bash
curl https://www.nightingalesilence.com/glamour/api/health
```

### Slim Deploy Bundle

For WinSCP or manual uploads, prefer building and syncing the trimmed deploy
directory instead of syncing the whole local project:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\scripts\build_deploy.ps1
```

Then sync `deploy\NSGlamour` to the server project directory. The bundle keeps
runtime code, static assets, the generated mapping JSON, UI localization, and
only the font files referenced by `static\app.css`.

Do not deploy `.runtime/`: it can contain the dedicated Rising Stones browser
profile, cookies, local storage, and cache. Raw PSD files, `templates/psd2svg-output/`,
embedded source repositories such as `Anamnesis/`, and local assistant notes are
also excluded from `.deployignore` and the deploy bundle.

## Rising Stones Background Browser

The 石之家 import panel can use a long-lived Chrome/Chromium profile on the
server. Log in once with a small account, then users can paste Rising Stones
glamour detail links or IDs and let the backend read the equipment data through
that saved login state.

On Linux, install Chrome or Chromium and configure a persistent profile path:

```bash
sudo apt-get install chromium xvfb
mkdir -p /var/lib/nsglamour/risingstones-chrome-profile

NSGLAMOUR_BASE_PATH=/glamour \
NSGLAMOUR_RS_BROWSER_PROFILE=/var/lib/nsglamour/risingstones-chrome-profile \
NSGLAMOUR_RS_BROWSER_PORT=18765 \
NSGLAMOUR_CHROME_PATH=/usr/bin/chromium \
gunicorn -w 1 -b 127.0.0.1:8766 scripts.app:app
```

If the server has no desktop, start a temporary display for the first login:

```bash
Xvfb :99 -screen 0 1280x900x24 &
export DISPLAY=:99
```

Then open `/glamour/equipinfo`, click `后台登录`, and complete the Rising
Stones login in the server browser through your VNC/noVNC session. After login,
the session stays in `NSGLAMOUR_RS_BROWSER_PROFILE`.

Useful environment variables:

- `NSGLAMOUR_CHROME_PATH`: explicit Chrome/Chromium executable path.
- `NSGLAMOUR_RS_BROWSER_PROFILE`: persistent profile directory for the small account.
- `NSGLAMOUR_RS_BROWSER_PORT`: local DevTools port, default `18765`.
- `NSGLAMOUR_RS_BROWSER_HEADLESS=1`: start Chrome in headless mode after login is already saved.
- `NSGLAMOUR_RS_BROWSER_NO_SANDBOX=1`: only for container/root deployments that require it.
- `NSGLAMOUR_RS_BROWSER_ARGS`: extra Chrome flags, parsed like a shell command line.

Keep the DevTools port bound to `127.0.0.1`; never expose it through Nginx or a
public firewall. When using the background browser, prefer a single Gunicorn
worker (`-w 1`) unless the browser automation is split into a separate service.

## Public Security Notes

For public deployment, uploaded `.chara` files are parsed as untrusted input.
The current public UI keeps `.chara` import hidden inside the `/equipinfo` link
input drop target.

Optional environment variables:

- `NSGLAMOUR_MAX_CHARA_UPLOAD_MB`: upload size limit, default `5`.
- `NSGLAMOUR_ENABLE_CHARA_IMPORT=0`: optional kill switch for browser `.chara` uploads. Uploads are enabled by default.
