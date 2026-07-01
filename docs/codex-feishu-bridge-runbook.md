# Codex 飞书桥接排障经验

这份记录用于避免 Codex 接入飞书后再次出现“飞书里发消息没反应”的问题。当前本机桥接基于 `lark-channel-bridge`，配置不在 NSGlamour 项目里，而在用户目录：

- 主配置：`C:\Users\13359\.lark-channel\config.json`
- profile：`codex`
- 桌面启动脚本：`C:\Users\13359\Desktop\启动Codex飞书桥.bat`
- bridge 日志：`C:\Users\13359\.lark-channel\profiles\codex\logs\bridge-YYYYMMDD.jsonl`
- daemon 日志：`C:\Users\13359\.lark-channel\profiles\codex\logs\daemon\`
- session 映射：`C:\Users\13359\.lark-channel\profiles\codex\sessions.json.catalog.json`
- secret 存储：`C:\Users\13359\.lark-channel\profiles\codex\secrets.enc`

## 当前固定方案

启动桥接时使用：

```powershell
lark-channel-bridge run --profile codex --skip-check-lark-cli
```

桌面脚本也应保持同样命令：

```bat
@echo off
title Codex Lark Channel Bridge
echo Starting lark-channel-bridge...
echo Keep this window open while using Codex from Lark.
echo.
lark-channel-bridge run --profile codex --skip-check-lark-cli
echo.
echo Bridge stopped. Press any key to close this window.
pause >nul
```

`C:\Users\13359\.lark-channel\config.json` 的 `profiles.codex.preferences` 应保持：

```json
{
  "messageReply": "text",
  "messageReplyMigrated": true
}
```

原因：`markdown` 模式会走飞书消息卡片 streaming，本机出现过 `cardid is invalid`，导致 Codex 已经处理完但回复发不回飞书。纯文本模式先保证可用。

## 故障表现

飞书里给 Codex 发消息没有可见回复。可能有两类：

1. 消息根本没进 bridge。
2. 消息进来了，Codex 也跑完了，但回发飞书失败。

这次实际两个问题都遇到了：

- 旧进程 registry 显示还活着，但真实 PID 已不存在或日志不再更新，属于“假活”。
- 重启后消息能进来，但回发失败：`cardid is invalid`。

## 快速检查

先看 bridge 是否真的在跑：

```powershell
lark-channel-bridge ps
```

再核对系统进程里的真实命令行：

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'lark-channel|lark-cli|codex|node' } |
  Select-Object ProcessId,Name,CreationDate,CommandLine |
  Format-List
```

如果 `lark-channel-bridge ps` 里的 PID 在系统进程里不存在，或者日志长时间不更新，就是假活。

查看最新 bridge 日志：

```powershell
$log = Get-ChildItem -LiteralPath 'C:\Users\13359\.lark-channel\profiles\codex\logs' -Filter 'bridge-*.jsonl' -File |
  Sort-Object LastWriteTime -Descending |
  Select-Object -First 1
Get-Content -LiteralPath $log.FullName -Tail 80 -Encoding UTF8
```

关键字段：

- 有 `phase":"intake"` / `event":"enter"`：飞书消息已经进来了。
- 有 `phase":"agent"` / `event":"spawn"`：Codex 已经被拉起。
- 有 `phase":"run"` / `event":"completed"`：Codex 已完成。
- 有 `phase":"stream"` / `event":"fail"`：通常是回发飞书失败。

## 已知错误和处理

### 1. `appSecret ... secrets-getter.cmd is world-writable (mode 0666)`

现象：

```text
lark-cli configuration failed
failed to resolve appSecret ... secrets-getter.cmd is world-writable (mode 0666)
```

原因：Windows 上 Node `fs.stat` 看到 `.cmd` 文件权限为 `666`，lark-cli 的 exec provider 安全检查可能误判。`chmod` 在这里无效，测试过 `fs.chmodSync(..., 0o600)` 后仍然是 `666`。

处理：启动 bridge 时加：

```powershell
--skip-check-lark-cli
```

这不等于删除 secret。secret 仍在 bridge 自己的加密存储里：

```powershell
lark-channel-bridge secrets list --profile codex
```

应该能看到类似：

```text
app-cli_aabb364f1ff8dbd9
```

### 2. `cardid is invalid`

现象：

```text
Failed to create card content, ext=ErrCode: 11310; ErrMsg: cardid is invalid
```

日志里可能看到请求发了：

```text
msg_type: interactive
card_id: 7653518360769137639
```

原因：bridge 的 `markdown` 回复模式使用飞书消息卡片 streaming，但当前卡片 id 对这个 app 不可用或已失效。

处理：把 `profiles.codex.preferences` 改成纯文本：

```json
{
  "messageReply": "text",
  "messageReplyMigrated": true
}
```

注意：只写 `"messageReply": "text"` 不够。bridge 代码里旧 `text` 配置如果没有 `messageReplyMigrated: true`，会被当成 `markdown`。

## 干净重启流程

1. 停掉旧 bridge。

```powershell
lark-channel-bridge ps
lark-channel-bridge kill 1
```

如果 `kill` 报 `ESRCH`，说明 registry 里记录的进程已经不存在。再手动查系统进程并停掉实际的 Node/cmd：

```powershell
Get-CimInstance Win32_Process |
  Where-Object { $_.CommandLine -match 'lark-channel-bridge' } |
  Select-Object ProcessId,Name,CommandLine

Stop-Process -Id <PID> -Force
```

2. 确认配置。

```powershell
$cfg = Get-Content -LiteralPath 'C:\Users\13359\.lark-channel\config.json' -Raw -Encoding UTF8 | ConvertFrom-Json
$cfg.profiles.codex.preferences | ConvertTo-Json -Depth 10
```

应看到：

```json
{
  "messageReply": "text",
  "messageReplyMigrated": true
}
```

3. 启动。

```powershell
lark-channel-bridge run --profile codex --skip-check-lark-cli
```

看到下面这种输出表示已连上：

```text
已连接  bot: Codex (...f8dbd9)  agent: Codex CLI (codex)
正在监听消息。按 Ctrl+C 退出。
```

4. 发飞书测试消息。

如果日志出现 `intake -> agent spawn -> run completed`，但飞书没有回复，继续看是否有 `stream.fail`。若仍是 `cardid is invalid`，说明配置没有生效，重点复查 `messageReplyMigrated` 和是否重启了正确 profile。

## 运行状态维护

常用命令：

```powershell
lark-channel-bridge ps
lark-channel-bridge secrets list --profile codex
```

确认网络能访问飞书：

```powershell
Invoke-WebRequest -UseBasicParsing -Uri 'https://open.feishu.cn' -TimeoutSec 10
```

日志是 UTC 日期命名，本地 2026-06-21 凌晨可能仍写入 `bridge-20260620.jsonl`，不要只按本地日期找文件。

## 不要做

- 不要把 app secret 明文写进文档、日志或截图。
- 不要删除 `secrets.enc`，除非准备重新绑定飞书 app。
- 不要只看 `lark-channel-bridge ps` 就判断正常，要同时看真实进程和日志更新时间。
- 不要恢复默认 `lark-channel-bridge run`，否则下次可能又触发 lark-cli 权限预检问题。
- 不要随手改回 `messageReply: "markdown"`，除非已经确认飞书卡片 id 问题解决。

