# 石之家 Windows Reader 运维

本文用于 NSGlamour 石之家 reader 的日常使用。实现和安全边界详见 [`docs/ai/RISINGSTONES_BACKGROUND_BROWSER.md`](../../docs/ai/RISINGSTONES_BACKGROUND_BROWSER.md)。

## 当前状态

- reader 主机：`risingstones-reader`
- Tailscale IP：`100.64.65.72`
- reader 地址：`http://100.64.65.72:18770`
- Windows 安装目录：`C:\ProgramData\NSGlamourReader`
- Windows 计划任务：`NSGlamour Rising Stones Reader`
- 生产服务器通过 Tailscale 调用 reader，不再直接登录石之家

正常情况下不需要登录 reader 服务器，也不需要手动启动 Edge。

## 刷新登录态

石之家导入提示登录失效时，在本机 Windows PowerShell 中运行：

```powershell
cd H:\NightingaleSilenceWeb\NSGlamour
powershell -ExecutionPolicy Bypass -File .\reader\windows\refresh-reader-login.ps1
```

脚本会：

1. 请求 reader 临时启动非 headless Edge。
2. 从石之家首页的“登录并绑定角色”进入动态登录页。
3. 生成并打开二维码。
4. 等待手机端扫码确认。
5. 验证登录成功后自动切回 headless。

二维码过期或等待超时时，重新运行同一条命令即可。不要修改脚本中的 reader 地址，也不要手工填写 token。

## Tailscale

- 本机运行刷新脚本时，Tailscale 必须处于已连接状态。
- 生产服务器和 reader 之间也始终通过 Tailscale 通信。
- 不需要每次刷新登录态时更新 Tailscale、重新登录或生成 Auth Key。
- 服务器重启后 Tailscale 和 reader 计划任务会自动启动。
- 只有设备被移出 Tailnet、Tailscale 登录失效或设备密钥过期时，才需要重新配置。
- 注册服务器时使用过的 Auth Key 可以撤销；撤销不会让已经注册的设备离线。
- 登录态刷新完成后，本机可以关机，reader 会继续在 Windows 服务器运行。

## 快速检查

本机检查 reader：

```powershell
Invoke-WebRequest -UseBasicParsing http://100.64.65.72:18770/health
```

正常响应：

```json
{"ok":true,"edge":true}
```

`edge` 为 `false` 不一定是故障。reader 刚启动且尚未收到读取或登录请求时，Edge 可以按需启动。

生产服务器检查：

```bash
curl http://100.64.65.72:18770/health
curl http://127.0.0.1:8765/glamour/api/health
```

## 常见问题

### 本机无法连接 reader

1. 确认本机 Tailscale 显示已连接。
2. 确认 `100.64.65.72` 设备在线。
3. 再运行 reader 健康检查。
4. 不要把 `18770` 开放到公网。

### 二维码没有打开

确认本机项目中的 `.runtime/risingstones-reader-token` 存在，然后重新运行刷新脚本。不要在终端打印文件内容。

### 手机确认后仍超时

先重新运行脚本生成新二维码。不要直接打开或硬编码 `login.u.sdo.com` 地址；登录必须从石之家首页的真实登录按钮进入。

### headless 页面报 `Failed to fetch`

这不等于登录失效。reader 正常读取路径是“Edge Cookie + reader 后端 HTTP”，页内请求只是后备路径。

## 重新安装 Reader

仅在 reader 服务器重装或计划任务损坏时使用。将以下文件放入 `C:\ProgramData\NSGlamourReader`：

- `node.exe`
- `risingstones-reader.js`
- `install-reader.ps1`
- `reader-token.txt`

然后在 reader 服务器的管理员 PowerShell 中运行：

```powershell
powershell -ExecutionPolicy Bypass -File C:\ProgramData\NSGlamourReader\install-reader.ps1 -ListenHost 100.64.65.72
```

安装脚本会创建专用标准用户、授予批处理登录权限、注册开机计划任务，并添加只允许 Tailscale 网段访问的防火墙规则。

## 安全要求

- 不提交或展示 `.runtime/risingstones-reader-token`、`reader-token.txt`、Cookie、ticket 或二维码会话参数。
- 不复用管理员日常浏览器 profile。
- 不复制 QQ 机器人的数据库、Cookie 或 `secret.key`。
- DevTools 端口 `18765` 只能绑定 reader 本机 `127.0.0.1`。
