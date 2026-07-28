# NSGlamour

FFXIV 幻化展示图片生成工具。导入装备数据（Eorzea Collection、石之家、`.chara` 文件或文字），套用模板导出图片。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 后端 | Python 3 + Flask + gunicorn |
| 前端 | 原生 JS + Canvas + CSS 变量 |
| 存储 | JSON（装备库/国际化）+ IndexedDB（客户端） |
| 集成 | Chrome DevTools Protocol（石之家）、HTML 抓取（Eorzea Collection） |

## 快速启动

```bash
pip install -r requirements.txt
python scripts/app.py
```

浏览器自动打开 `http://127.0.0.1:8765`。

## 启动方式

| 命令 | 说明 |
| --- | --- |
| `start_gui.bat` | 启动并打开浏览器（Windows 开发用） |
| `start_8765_background.bat` | 后台启动，日志写入 `nsglamour-server.log` |
| `python scripts/app.py` | 直接启动（跨平台） |
| `gunicorn scripts.app:app` | 生产部署 |

## 数据更新

运行 `update_mapping.bat` 或 `python scripts/build_item_mapping.py`，从 GitHub CSV 更新装备数据。

## 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `NSGLAMOUR_PORT` | `8765` | 端口 |
| `NSGLAMOUR_NO_BROWSER` | — | 设为 `1` 禁止自动打开浏览器 |
| `NSGLAMOUR_ENABLE_CHARA_IMPORT` | `1` | 设为 `0` 禁用 `.chara` 导入 |
| `NSGLAMOUR_CHROME_PATH` | — | Chrome/Chromium 路径（石之家功能） |
| `NSGLAMOUR_BASE_PATH` | — | 反向代理二级路径 |
| `NSGLAMOUR_ICON_BASE_URL` | `https://img.nightingalesilence.com/ui/icon` | 图标源地址，可覆盖默认 CDN / 自定义域 |
| `NSGLAMOUR_ICON_CACHE_DIR` | `.runtime/icon-cache` | 图标缓存目录 |
| `NSGLAMOUR_DEBUG_ERRORS` | — | 设为 `1` 返回详细错误信息 |
| `NSGLAMOUR_ENABLE_LINK_IMPORT` | `1` | 设为 `0` 临时关闭石之家和 Eorzea Collection 外链导入 |
| `NSGLAMOUR_RS_READER_URL` | — | 独立石之家 reader 地址 |
| `NSGLAMOUR_RS_READER_TOKEN_FILE` | `.runtime/risingstones-reader-token` | reader Bearer token 文件路径 |
| `NSGLAMOUR_RS_READER_REQUIRED` | — | 设为 `1` 禁止 reader 失败时回退旧浏览器 |

## 石之家 Reader

生产环境通过独立 Windows reader 读取石之家数据。日常使用、登录态刷新、Tailscale 和故障检查见：

- [`reader/windows/README.md`](reader/windows/README.md)

登录态失效时，在本机项目根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File .\reader\windows\refresh-reader-login.ps1
```

## Playwright

仓库内的 `playwright.config.js` 会优先使用系统已安装的浏览器，不强依赖 `playwright install chromium`。

默认优先级：

1. `NSGLAMOUR_PLAYWRIGHT_EXECUTABLE_PATH` 或 `PLAYWRIGHT_EXECUTABLE_PATH`
2. Microsoft Edge
3. Google Chrome
4. Chromium

如需查看当前会命中的浏览器，可运行：

```bash
node -e "console.log(require('./scripts/playwright-system-browser').describePreferredSystemBrowser())"
```

## 部署

`scripts/build_deploy.ps1` 将项目打包到 `deploy/NSGlamour`，使用 gunicorn 服务。
