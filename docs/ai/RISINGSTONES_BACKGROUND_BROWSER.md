# 石之家后台浏览器与登录态

## 适用范围

本文件只描述 NSGlamour 里石之家远程读取这条链路：

- `/api/import-glamour-link` 解析石之家详情链接。
- 后台专用 Chrome/Chromium 资料目录。
- DevTools 本地端口。
- 登录态刷新方式。

## 当前运行模型

石之家链路当前是“专用浏览器 + 后端代读”模式，不是前端直接抓站：

1. 后端维护一个石之家专用浏览器资料目录。
2. 浏览器 DevTools 只绑定 `127.0.0.1:<port>`。
3. `/api/import-glamour-link` 从石之家详情链接里提取详情 ID。
4. 后端优先通过 DevTools 读取专用浏览器里的 Cookie。
5. 后端带这些 Cookie 直接请求 `https://apiff14risingstones.web.sdo.com/api/home/`。
6. 只有在 HTTP 直连失败时，才保留页内 `fetch(...)` 这条旧后备路径。

## 为什么这样做

2026-07-06 已确认过一个长期坑：

- `HeadlessChrome` 访问石之家页面时，站点可能返回挑战页或拦截页。
- 这会让页内 `fetch("glamour/glamourDetail")` 在 headless 模式下报 `Failed to fetch`。
- 但同一份登录态 Cookie 往往仍可用于后端直连 `apiff14risingstones` API。

因此当前原则是：

- 常态运行优先保留 `NSGLAMOUR_RS_BROWSER_HEADLESS=1`。
- 读取详情优先走“Cookie + 后端 HTTP”。
- 不把“非 headless 浏览器常驻”作为默认方案，因为用户反馈那样登录态更短。

## 最简单的登录态刷新方法

服务器上直接运行：

```bash
cd /www/wwwroot/NightingaleSilenceWeb/NSGlamour
.venv/bin/python scripts/risingstones_login.py
```

这个脚本的设计目标就是“最简单刷新登录态”：

1. 先关闭当前占用同一资料目录的石之家后台浏览器。
2. 强制用可见模式打开同一个专用资料目录。
3. 让你在专用浏览器里重新登录石之家小号。
4. 你回到终端按一次回车。
5. 脚本再自动切回当前环境配置的默认模式，通常是 headless。

如果服务器没有桌面，需要先进入 `Xvfb` / `VNC` / `noVNC` 再执行。

如果当前终端不能交互，脚本会只负责打开可见浏览器；登录完成后请手动重启服务。

## 相关环境变量

- `NSGLAMOUR_RS_BROWSER_PROFILE`
  - 石之家专用浏览器资料目录。
- `NSGLAMOUR_RS_BROWSER_PORT`
  - DevTools 端口，只应监听 `127.0.0.1`。
- `NSGLAMOUR_RS_BROWSER_HEADLESS`
  - 常态浏览器模式。公开部署推荐保持为 `1`。
- `NSGLAMOUR_RS_BROWSER_ALLOW_HEADED_FALLBACK`
  - 是否允许读取失败时自动退到非 headless 重试。
  - 默认不要开启，除非明确需要临时排障。
- `NSGLAMOUR_CHROME_PATH`
  - 显式指定 Chrome / Chromium 可执行文件。
- `NSGLAMOUR_RS_BROWSER_NO_SANDBOX`
  - Linux 服务器需要时开启。
- `NSGLAMOUR_RS_BROWSER_ARGS`
  - 额外浏览器参数。

## 安全边界

- DevTools 端口绝不能暴露到公网。
- 这条能力只应该接受石之家详情链接或详情 ID，不要扩展成通用代理抓取器。
- 不要复用管理员自己的日常浏览器资料目录。
- 登录态异常时优先刷新石之家小号，不要尝试导入普通 Chrome 全局 Cookie。

## 维护提示

- 如果石之家再次调整风控，先验证“Cookie 直连 API”是否仍可用，再考虑页面抓取。
- 如果后端 HTTP 直连也被拦，再去抓服务器上的返回码、响应体和请求头，不要只盯着 `Failed to fetch`。
- 修改 `scripts/app.py` 里石之家链路后，至少重新检查：
  - 登录态刷新脚本 `scripts/risingstones_login.py`
  - `/api/import-glamour-link`
  - 错误文案的人类可读性
