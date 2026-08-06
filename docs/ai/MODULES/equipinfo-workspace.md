# `/equipinfo` 装备信息页

## 职责

`/equipinfo` 负责从链接、文本或 `.chara` 中得到装备数据，提供装备候选和染剂编辑，并生成复制文案。

## 关键文件

- `templates/equipinfo.html`
- `static/equipinfo.js`
- `static/common.js`
- `static/store.js`
- `static/ui-language.js`
- `static/app.css`
- `scripts/app.py`
- `scripts/resolve_chara.py`

## 输入方式

- 网页链接：仅石之家幻化详情链接。
- 文本信息：用户粘贴装备名、部位、染剂。
- 隐藏 `.chara` 拖放：在链接输入区域处理。

## 主要状态

- 当前解析后的 `parsed`。
- 当前语言。
- 装备候选。
- 染剂条目。
- 最近记录。
- 文案格式。
- 自定义文案模板。

## 关键交互

- `importLink(...)`：网页链接导入。
- `parseText(...)`：文本识别。
- `acceptPayload(...)`：接收并应用解析结果。
- `renderSlotGrid(...)`：渲染装备栏。
- `searchItems(...)`：搜索替换装备。
- `renderCopyText(...)`：生成复制文案。
- `renderTemplate(...)`：渲染自定义文案模板。
- `initFromSharedEquipment(...)`：从共享状态初始化。

## 自定义文案注意事项

当前自定义文案功能已经支持多种 token、条件和循环。修改时必须先确认目标范围：

- 如果用户要求回到“第一版”，应简化到单个 textarea、恢复默认按钮、基础占位符和 `{{#items}}...{{/items}}`。
- 如果用户明确要扩展，再考虑更多 token、条件、染剂循环。
- 不要执行用户模板中的 JavaScript。

## 修改风险

- `resolved_equipment` 字段变动会同时影响 `/template`。
- 文本识别和链接导入来源不同，但最终应汇入同一装备结构。
- `.chara` 拖放修复要避免浏览器默认打开本地文件。
- 最近记录键名与 `/template` 共用。
- 自定义文案 token 改动容易让说明和实际行为脱节。

## 验证建议

- 粘贴文本识别。
- 导入石之家链接。
- 输入 Eorzea Collection 或其他域名时确认接口拒绝，且不会发起外部抓取。
- 拖放 `.chara`。
- 搜索替换装备。
- 修改染剂。
- 切换语言。
- 保存配置和恢复最近记录。
- 生成快照后确认当前配置自动进入最近记录并保存链接。
- 对同一配置连续生成两次，确认第二次直接复用本地快照 ID；清除本地记录后确认服务端仍返回同一 ID。
- 检查所有文案格式和自定义模板输出。

## 只读快照

- 公开分享地址统一为 `https://n9s.site/g/<snapshot_id>?lang=<locale>`，由站点反向代理到轻量查看器；旧 `/equipinfo/<snapshot_id>` 路径继续兼容，不挂载导入、搜索、替换、删除、保存或模板编辑控件。
- 快照工具栏固定为布局、装备名语言和昼夜主题三个图标按钮；语言选择继续写入链接的 `?lang=` 参数，主题沿用全站 `nsglamour.theme`。
- 布局默认使用紧凑模式，只显示快照中的已有装备；宽松模式按既定顺序显示全部 14 个部位，未填写部位保留空行，桌面端均分两列、移动端单列。
- 用户选择的快照布局保存在本机 `nsglamour.snapshotLayout`，不写入快照内容或分享链接；未保存过布局偏好的浏览器默认使用紧凑模式。
- 有物品的装备行支持桌面端右键和移动端长按，菜单以固定站名打开最终幻想14中文维基、Lodestone、Garland Data 与韩国官方指南；菜单使用像素字体、无阴影和 `1px` 黑色边框。
- 默认 SQLite：`.runtime/equipment-snapshots.sqlite3`；生产可用 `NSGLAMOUR_SNAPSHOT_DB_PATH` 指向持久目录。
- 生成成功后沿用当前来源名自动写入 `nsglamour.recentLoadouts`，记录 `snapshotId`、`snapshotUrl` 和 `snapshotKey`。
- 本地相同 `snapshotKey` 直接复用；本地记录缺失时继续依赖后端内容哈希去重。

