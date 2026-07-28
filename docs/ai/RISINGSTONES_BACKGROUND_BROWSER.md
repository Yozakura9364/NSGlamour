# 石之家后台浏览器与登录态

## 适用范围

本文件描述 NSGlamour 的石之家远程读取链路：

- `/api/import-glamour-link` 解析石之家详情链接。
- 独立 Windows reader 的 Edge profile、登录和详情读取。
- 生产服务器到 reader 的 Tailscale 调用。
- 登录态刷新方式和安全边界。

## 当前运行模型

生产链路使用独立 Windows reader，不再让旧 Linux Web 服务器直接登录石之家：

1. 生产 Flask 从石之家链接中提取详情 ID。
2. 配置 `NSGLAMOUR_RS_READER_URL` 后，Flask 通过 Tailscale 调用 reader 的 `/v1/glamour-detail`。
3. reader 使用 Bearer token 鉴权，只接受 1 至 5 个纯数字详情 ID。
4. reader 维护专用 Edge profile，常态以 headless 模式运行。
5. 详情读取优先使用“Edge Cookie + reader 后端 HTTP”；页内 `fetch(...)` 只作为后备。
6. 生产配置 `NSGLAMOUR_RS_READER_REQUIRED=1`，reader 失败时禁止回退到旧服务器浏览器。

当前部署：

- reader 主机：`risingstones-reader`，Tailscale IP `100.64.65.72`。
- reader 目录：`C:\ProgramData\NSGlamourReader`。
- 计划任务：`NSGlamour Rising Stones Reader`。
- 专用本地账户：`NSGlamourReaderSvc`，不是管理员账户。
- reader 端口：`18770`，Windows 防火墙只允许 `100.64.0.0/10` 入站。
- DevTools：仅绑定 reader 本机 `127.0.0.1:18765`。
- 生产 token 文件：`/etc/nsglamour/risingstones-reader-token`，权限 `0600`。

## 登录态刷新

在本机项目根目录运行：

```powershell
powershell -ExecutionPolicy Bypass -File reader\windows\refresh-reader-login.ps1
```

脚本会生成并打开二维码，等待扫码确认，成功后让 reader 自动切回 headless。不要手工替换脚本里的密码或 token。

reader 必须遵循网站自己的登录入口，不能硬编码 `login.u.sdo.com` 地址：

1. 使用同一 Windows 服务账户和同一 Edge profile 临时启动非 headless Edge。
2. 打开 `https://ff14risingstones.web.sdo.com/pc/index.html#/post`。
3. 等首页完整加载后点击 `button.login-btn`，即“登录并绑定角色”。
4. 等网站生成本次登录对应的 `login.u.sdo.com` target；该 URL 可能包含动态上下文。
5. 勾选协议，选择第三个二维码登录标签，再生成二维码。
6. 手机确认后，以 `GHome/isLogin` 返回代码 `10000` 为成功依据。
7. 优雅关闭非 headless Edge，再用同一账户、同一 profile 启动 headless Edge。

旧服务器上的 `scripts/risingstones_login.py` 只保留为 Linux 可见模式排障工具，不是当前生产刷新入口。

## 为什么后端直读

已确认以下行为：

- headless Edge 可以保存和复用登录 Cookie。
- headless 页面内请求石之家 API 可能报 `Failed to fetch`。
- 同一登录态由 reader 在后端携带 Cookie、Origin、Referer 和浏览器 User-Agent 请求 API 可以成功。

因此不要把页内 `fetch(...)` 恢复为主读取路径，也不要因为它失败就判断登录态失效。

## Reader 接口

- `GET /health`：不含秘密的健康检查。
- `POST /v1/login/start`：启动非 headless 登录流程并准备二维码。
- `GET /v1/login/qr`：获取当前二维码。
- `GET /v1/login/status`：检查登录结果；成功后切回 headless。
- `POST /v1/glamour-detail`：读取石之家详情。

除 `/health` 外全部要求 Bearer token。reader 不是通用 URL 代理，禁止扩展为任意网页抓取器。

## 环境变量

生产 Flask：

- `NSGLAMOUR_RS_READER_URL`
- `NSGLAMOUR_RS_READER_TOKEN_FILE`
- `NSGLAMOUR_RS_READER_REQUIRED`

旧版同机浏览器变量仍用于后备和排障，但生产强制 reader 时不会回退：

- `NSGLAMOUR_RS_BROWSER_PROFILE`
- `NSGLAMOUR_RS_BROWSER_PORT`
- `NSGLAMOUR_RS_BROWSER_HEADLESS`
- `NSGLAMOUR_RS_BROWSER_ALLOW_HEADED_FALLBACK`
- `NSGLAMOUR_CHROME_PATH`
- `NSGLAMOUR_RS_BROWSER_NO_SANDBOX`
- `NSGLAMOUR_RS_BROWSER_ARGS`

## 安全边界

- 不在聊天、日志、Git 或命令输出中显示 token、Cookie、ticket、二维码会话参数或服务账户密码。
- reader 端口只通过 Tailscale 暴露；DevTools 永远不离开 `127.0.0.1`。
- token 文件只允许 reader 服务账户、SYSTEM 或管理员读取。
- 不复用管理员的日常浏览器 profile。
- 不复制 QQ 机器人用户的 Cookie、数据库或 `secret.key`。
- 临时二维码和诊断文件完成后及时删除。

## 已验证结果

2026-07-16 已完成：

- 旧生产服务器访问 `http://100.64.65.72:18770/health` 成功。
- 二维码确认后 `GHome/isLogin` 返回 `10000`。
- reader 读取详情 `274729` 成功，模式为 `remote-http`。
- 生产 `/glamour/api/import-glamour-link` 返回 HTTP 200，并解析出 5 件装备。
