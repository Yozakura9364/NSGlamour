# NSGlamour AGENTS

## 项目身份

- 项目名称：`NSGlamour`
- 项目类型：Flask + 原生前端 JavaScript 的 FFXIV 幻化工具。
- 核心页面：`/template` 模板生成页、`/equipinfo` 装备信息页；`/` 重定向到 `/template`。
- 核心能力：`.chara` 解析、装备/染剂映射、石之家与 Eorzea Collection 导入、模板渲染、图片裁剪、PNG 导出、装备文案生成。

## 开工前必须阅读

1. 根目录 `AGENTS.md`
2. `docs/ai/PROJECT_CONTEXT.md`
3. `docs/ai/MODULE_MAP.md`
4. `docs/ai/FRONTEND_CONVENTIONS.md`
5. `docs/ai/API_AND_DATA_CONVENTIONS.md`
6. 涉及模板渲染时读：`docs/ai/TEMPLATE_WORKFLOW.md`
7. 涉及具体页面时读：`docs/ai/MODULES/template-workspace.md` 或 `docs/ai/MODULES/equipinfo-workspace.md`
8. 涉及工作流程、计划阶段、验证和文档维护时读：`docs/ai/DEVELOPMENT_WORKFLOW.md`
9. 通用公共提示词在：`docs/ai/公共提示词.md`

## 编码要求

- 强制要求：项目中所有文本文件必须使用 UTF-8（无 BOM）保存。
- 禁止使用 ANSI、GBK、UTF-8 with BOM 或其他可能导致中文乱码的编码。
- 在 PowerShell 中读取中文文件必须显式使用 UTF-8，例如 `Get-Content -Encoding UTF8`。
- 在 Windows PowerShell 5.1 中不要用默认 `Set-Content`、`Out-File`、`>`、`>>` 写入或追加中文文件。
- 手动编辑代码时优先使用 `apply_patch`。

## 通用开发原则

- 优先保持现有 Flask 路由、原生 JavaScript、Jinja 模板、CSS 和数据结构习惯。
- 回答、文档、提示词、注释和说明性文本默认使用中文；只有技术专有名词、代码标识符、文件名、路径、命令、API 名称和第三方库/产品名可以保留英文。
- 只做与需求直接相关的最小改动，不做顺手式重构。
- 不要把其他项目的 Angular、NestJS、React、Vue 或 Vite 规则套用到本项目。
- 不要引入新依赖，除非先说明原因、影响、替代方案，并得到确认。
- 修改上传、解析、外部链接导入、后台浏览器、部署路径时，必须说明安全边界和公开部署风险。
- 上传或粘贴的数据都视为不可信输入。

## 重要文件

- `scripts/app.py`：Flask 路由、上传限制、基础路径、导入 API、搜索 API、图标代理、石之家浏览器辅助。
- `scripts/resolve_chara.py`：`.chara` 解析与 `resolved_equipment` 数据结构生成。
- `scripts/build_item_mapping.py`：从 datamining CSV 生成 `data/item_model_mapping.json`。
- `templates/template.html` 与 `static/template.js`：模板工作台、图片槽、装备编辑、导入、裁剪、PNG 导出。
- `templates/equipinfo.html` 与 `static/equipinfo.js`：装备信息页、链接/文字/隐藏 `.chara` 导入、文案模板、历史记录。
- `static/common.js`：共享路径、主题、本地化、染剂、最近记录、草稿工具。
- `static/store.js`：`NSGlamourStore` 共享状态层。
- `static/template-definitions.js` 与 `static/template-renderer-*.js`：模板定义和各模板渲染器。
- `static/template-image-store.js`：模板图片 IndexedDB 持久化。
- `static/ui-language.js` 与 `data/ui-localization.json`：前台 UI 本地化。
- `static/app.css`：共享样式。

## 前端规则

- 当前项目是原生 JavaScript + Flask 模板，不是 Angular、React 或 Vue。
- 保持紧凑中文 UI 和现有琥珀色强调风格。
- 不要在已有本地化 UI 中硬编码仅英文标签。
- 公开 `/glamour` 部署需要通过 `appPath(...)` 或现有辅助方法生成前端路径，不要硬编码根路径。
- 修改 `static/template.js`、`static/equipinfo.js`、`static/ui-language.js`、`static/app.css` 或渲染器后，需要同步更新相关模板里的静态资源版本查询串。
- `localStorage`、`NSGlamourStore`、最近记录、草稿同步和图片持久化是核心链路，修改前必须查清键名和跨页面同步方式。
- 移动端布局要保持可用，紧凑控件文字不能溢出。

## 模板规则

- `/template` 是固定模板填充器，不是自由卡片设计器。
- 模板视觉规则应尽量隔离在模板定义和对应渲染器中，避免一个模板的特殊逻辑影响其他模板。
- PSD/SVG 导出文件只作为参考；运行时资源放在 `static/templates/`。
- 修改装备行、染剂行、头像/图片槽、导出 PNG 前，必须确认预览尺寸和导出尺寸分别由哪里控制。
- 新增或修改模板后，至少验证真实装备数据、图片上传/裁剪、预览和导出。

## 数据和 API 规则

- 不要随意改变 API 返回字段，尤其是 `resolved_equipment`、`candidates`、`dye_entries`、`names`、`model_main`。
- 染剂逻辑必须保留多语言名称、染剂 ID、颜色、空染色、不可染色、多染色槽兼容处理。
- 装备、染剂、图标、模型码相关逻辑优先参考 `data/item_model_mapping.json`、`scripts/resolve_chara.py`、`scripts/build_item_mapping.py`。
- 不要手写临时映射替代正式构建流程。

## 验证

- 修改 JavaScript 后至少运行：

```powershell
node --check static\template.js
node --check static\equipinfo.js
node --check static\ui-language.js
```

- 如果改动涉及共享文件或渲染器，也检查对应 JS 文件，例如：

```powershell
node --check static\common.js
node --check static\store.js
node --check static\template-definitions.js
node --check static\template-renderer-risingstones.js
```

- 如果本地服务正在运行，检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/api/health
```

- 修改映射数据时，使用 `update_mapping.bat` 或 `python scripts/build_item_mapping.py`，并确认 `data/item_model_mapping.json` 变化符合预期。
- 涉及 UI、拖拽、图片上传、canvas 导出时，优先用浏览器或 Playwright 做实际验证。

## AGENTS.md 维护规则

- `AGENTS.md` 是项目级长期入口规则，不是一次性需求记录。
- 详细说明优先写入 `docs/ai/`，不要把 `AGENTS.md` 写成超长流水账。
- 只有长期有效、对后续开发有帮助的规则，才适合进入 `AGENTS.md`。
- 不要把临时 bug、单次 UI 偏好、个人猜测写入 `AGENTS.md`。
- 更新 `AGENTS.md` 后，必须在总结中说明新增或修改了什么规则。

## 已知坑

- `NSHome` 不是本项目；本项目根目录通常是 `H:\NightingaleSilenceWeb\NSGlamour`。
- `rg` 搜索 `data/item_model_mapping.json` 可能输出巨大内容，除非明确需要映射数据，否则优先限定在 `scripts`、`static`、`templates`。
- 饰品、眼镜、时尚配饰与普通装备的染色展示规则不同。
- 主手/副手候选、双手武器占副手、皇帝套过滤、空染色都容易影响跨页面显示。
- 石之家页面和接口可能变化，相关解析和后台浏览器功能要保持保守。
