# 前端约定

## 基本原则

- 当前前端是原生 JavaScript，不是 Angular、React 或 Vue。
- 页面由 Flask Jinja 模板加载脚本，脚本通过全局对象协作。
- 改动前先阅读相关 `templates/*.html`、对应 `static/*.js` 和 `static/app.css`。
- 保持中文紧凑 UI 与琥珀色强调风格。
- 不要把小 UI 修复扩大成架构迁移。

## 脚本加载关系

`/template` 主要加载：

- `static/common.js`
- `static/store.js`
- `static/ui-language.js`
- `static/template-dye-policy.js`
- `static/template-definitions.js`
- `static/template-renderers.js`
- 各 `static/template-renderer-*.js`
- `static/template-image-store.js`
- `static/template.js`

`/equipinfo` 主要加载：

- `static/common.js`
- `static/store.js`
- `static/ui-language.js`
- `static/equipinfo.js`

修改这些文件后，需要同步更新 `templates/template.html` 或 `templates/equipinfo.html` 中对应版本查询串。

## 全局对象

- `window.NSGlamourCommon`：共享常量、路径、本地化、染剂、最近记录、草稿等工具。
- `window.NSGlamourStore`：共享状态层。
- `window.NSGlamourUiLanguage`：UI 文案本地化。
- `window.NSGlamourTemplateDefinitions`：模板定义工厂。
- `window.NSGlamourTemplateRenderers` 与 `window.NSGlamour*TemplateRenderer`：模板渲染器。
- `window.NSGlamourTemplateImageStore`：IndexedDB 图片持久化。

## 本地状态

常见键名：

- `nsglamour.theme`
- `nsglamour.cardDraft.v2`
- `nsglamour.recentLoadouts`
- `nsglamour.uiLanguage`
- `nsglamour.uiLanguage.manual`
- `nsglamour.copyTemplate`
- `nsglamour.copyFormat`
- `nsglamour.templateWorkspaceSettings`
- `nsglamour.ignoreEmperor`
- `nsglamour.templateImageSessionBackup.v2`
- `nsglamour.store.*`

修改状态同步时要同时考虑：

- 当前页面内状态。
- 同源其他页面的 `storage` 事件。
- `/template` 与 `/equipinfo` 之间的最近记录和草稿互通。
- IndexedDB 图片和 localStorage 设置的分工。

## 本地化

- 前台文案由 `static/ui-language.js` 和 `data/ui-localization.json` 管理。
- 新增 UI 文案时优先考虑是否需要本地化。
- 不要在已有多语言区域硬编码仅英文文案。
- 动态生成 DOM 后，必要时调用 `window.NSGlamourUiLanguage?.refresh?.(...)`。

## 样式

- 共享样式集中在 `static/app.css`。
- 页面结构以紧凑表单、按钮、分段控件、面板和 canvas 预览为主。
- 改全局 class 前必须检查两个页面是否共用。
- 不要随意引入全新视觉体系。

## 拖拽与上传

- `/template` 的图片上传在 canvas 上传层处理，支持多图片槽、裁剪和拖拽。
- `/equipinfo` 的 `.chara` 拖放入口隐藏在链接输入区域。
- 拖拽修复要检查浏览器默认打开文件的问题，通常需要在正确层级 `preventDefault()`。
- 上传文件都视为不可信输入。

