# API 与数据约定

## Flask 路由

页面：

- `GET /`
- `GET /template`
- `GET /equipinfo`

API：

- `GET /api/health`
- `GET /api/ui-localization`
- `POST /api/import-glamour-link`
- `POST /api/equipinfo/parse-text`
- `POST /api/risingstones-browser/open-login`
- `GET /font/<path:filename>`
- `GET /template-preview/<path:filename>`
- `GET /api/icon/<int:icon_id>`
- `GET /api/stains`
- `GET /api/search-items`
- `POST /api/parse-chara`

修改 API 前必须同时检查前端调用方和测试。

## 统一装备数据

后端解析和前端页面主要围绕 `resolved_equipment` 工作。装备 entry 常见字段：

- `slot`
- `slot_label`
- `slot_names`
- `slot_display`
- `lookup_key`
- `model`
- `dye_id`
- `dye_id_2`
- `candidate_count`
- `candidates`

候选装备常见字段：

- `key`
- `key_label`
- `name`
- `names`
- `icon`
- `slot_label`
- `equip_slot_category`
- `model_main`
- `dye_count`
- `dye_display`
- `dye_display_by_locale`
- `dye_entries`
- `is_emperor`

不要随意改字段名或删除字段。前端模板、装备信息页、测试和导出都可能依赖这些字段。

## 染剂数据

染剂逻辑必须保留：

- 染剂 ID。
- 多语言名称。
- 色值和 RGB。
- 分组信息。
- 空染色。
- 不可染色。
- 双染色槽。
- 饰品/眼镜/时尚配饰不展示普通装备染色的特殊规则。

改染剂逻辑时优先检查：

- `scripts/resolve_chara.py`
- `scripts/app.py`
- `static/common.js`
- `static/template-dye-policy.js`
- `static/template.js`
- `static/equipinfo.js`
- 相关测试文件。

## 映射数据

正式映射由 `scripts/build_item_mapping.py` 构建，输出到 `data/item_model_mapping.json`。

不要用临时硬编码替代映射构建流程。确需补规则时，应优先补构建逻辑或解析逻辑。

修改映射后运行：

```powershell
python scripts/build_item_mapping.py
```

或：

```powershell
update_mapping.bat
```

## 外部导入

`/api/import-glamour-link` 支持石之家和 Eorzea Collection。

注意：

- 外部网页结构可能变化。
- 石之家部分能力可能依赖后台浏览器和登录态。
- 生产石之家导入当前优先调用独立 Windows reader；reader 内部通过 Edge Cookie 直连 `apiff14risingstones` API，页内 `fetch(...)` 只保留为后备路径。
- 配置 `NSGLAMOUR_RS_READER_REQUIRED=1` 时 reader 失败必须直接报错，不能回退到旧生产服务器上的浏览器。
- 解析失败要返回可理解的错误。
- 不能把外部输入直接信任为内部数据。

石之家后台浏览器、登录态刷新和部署约束的长期说明见：

- `docs/ai/RISINGSTONES_BACKGROUND_BROWSER.md`

## 公开部署安全

- `NSGLAMOUR_BASE_PATH=/glamour` 时前端路径必须仍然正确。
- `.chara` 上传大小受 `NSGLAMOUR_MAX_CHARA_UPLOAD_MB` 控制。
- `NSGLAMOUR_ENABLE_CHARA_IMPORT=0` 可禁用浏览器 `.chara` 上传。
- `NSGLAMOUR_ALLOW_SERVER_FILE_PICKER=1` 只适合可信本地环境。
- 石之家后台浏览器能力不应在未评估安全边界时公开暴露。

