# 模块地图

## 页面模块

### `/template` 模板工作台

- 后端入口：`scripts/app.py` `template_workspace()`
- 页面模板：`templates/template.html`
- 主逻辑：`static/template.js`
- 模板定义：`static/template-definitions.js`
- 渲染器：
  - `static/template-renderers.js`
  - `static/template-renderer-eorzea.js`
  - `static/template-renderer-horizontal.js`
  - `static/template-renderer-story.js`
  - `static/template-renderer-ec.js`
  - `static/template-renderer-risingstones.js`
  - `static/template-renderer-silence-fashion.js`
- 图片持久化：`static/template-image-store.js`
- 详情文档：`docs/ai/MODULES/template-workspace.md`

主要功能：

- 选择模板。
- 从石之家幻化详情链接导入装备数据。
- 编辑装备候选、染剂、语言、标题、角色名、服务器/名字等模板字段。
- 上传、拖拽、裁剪和持久化图片。
- canvas 预览与 PNG 导出。
- 与 `/equipinfo` 共享最近记录、草稿和装备数据。

### `/equipinfo` 装备信息页

- 后端入口：`scripts/app.py` `equipinfo_workspace()`
- 页面模板：`templates/equipinfo.html`
- 主逻辑：`static/equipinfo.js`
- 详情文档：`docs/ai/MODULES/equipinfo-workspace.md`

主要功能：

- 通过网页链接导入石之家数据。
- 通过文本识别装备与染剂。
- 隐藏 `.chara` 拖放导入。
- 编辑装备候选与染剂。
- 生成多格式复制文案和自定义模板文案。
- 保存最近记录并与 `/template` 同步。
- 生成只读装备快照；成功后自动保存当前配置和链接，相同公开内容复用既有快照 ID。

## 后端 API 模块

### 导入与解析

- `POST /api/parse-chara`：解析 `.chara` 上传文件。
- `POST /api/import-glamour-link`：解析石之家幻化详情链接；拒绝 Eorzea Collection 和其他域名。
- `POST /api/equipinfo/parse-text`：解析用户粘贴的装备文本。
- `POST /api/equipinfo/snapshots`：创建或复用只读装备快照。
- `GET /api/equipinfo/snapshots/<snapshot_id>`：读取只读装备快照。
- `POST /api/risingstones-browser/open-login`：打开石之家后台浏览器登录页。

### 查询与资源

- `GET /api/search-items`：装备搜索。
- `GET /api/stains`：染剂列表。
- `GET /api/icon/<int:icon_id>`：图标代理。
- `GET /api/ui-localization`：UI 本地化数据。
- `GET /template-preview/<path:filename>`：模板预览图。
- `GET /font/<path:filename>`：字体文件。
- `GET /api/health`：健康检查。

## 共享前端模块

- `static/common.js`：路径、主题、染剂、最近记录、草稿、通用 DOM 小工具。
- `static/store.js`：统一状态层，封装装备、模板同步、图片、设置、语言和最近记录。
- `static/ui-language.js`：前台 UI 文案本地化。
- `static/app.css`：共享视觉样式。

## 数据构建模块

- `scripts/build_item_mapping.py`：从 datamining CSV 构建 `data/item_model_mapping.json`。
- `scripts/resolve_chara.py`：从 `.chara` 结构解析装备槽、模型、候选装备和染剂。
- `update_mapping.bat`：映射构建入口。

## 测试模块

- Node 测试主要覆盖模板和前端数据策略。
- Python 测试主要覆盖后端搜索等逻辑。
- 新增测试时优先贴近现有脚本风格，避免引入重型测试框架。

