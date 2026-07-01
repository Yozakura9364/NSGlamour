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

- 网页链接：石之家或 Eorzea Collection。
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
- 最近记录 key 与 `/template` 共用。
- 自定义文案 token 改动容易让说明和实际行为脱节。

## 验证建议

- 粘贴文本识别。
- 导入石之家链接。
- 导入 Eorzea Collection 链接。
- 拖放 `.chara`。
- 搜索替换装备。
- 修改染剂。
- 切换语言。
- 保存配置和恢复最近记录。
- 检查所有文案格式和自定义模板输出。

