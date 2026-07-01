# NSGlamour 项目上下文

## 项目概述

`NSGlamour` 是一个用于 FFXIV 幻化数据整理和图片模板生成的 Flask Web 应用。项目核心不是通用后台，而是围绕配装数据、染剂、模板排版和图片导出形成的轻量工具站。

当前主要页面：

- `/template`：模板工作台。导入装备数据，编辑装备和染剂，上传/裁剪图片，选择模板并导出 PNG。
- `/equipinfo`：装备信息页。通过网页链接、文本或隐藏 `.chara` 拖放导入装备数据，编辑候选装备和染剂，生成复制文案。
- `/`：重定向到 `/template`。

## 技术栈

- 后端：Flask、Werkzeug、gunicorn。
- 前端：原生 JavaScript、Jinja 模板、CSS、Canvas。
- 图片裁剪：Cropper.js。
- 图片持久化：`idb-keyval` + IndexedDB。
- 本地状态：`localStorage` + `NSGlamourStore`。
- 数据来源：FFXIV datamining CSV 生成的 `data/item_model_mapping.json`。

## 目录结构

- `scripts/`：Flask 服务、`.chara` 解析、映射生成、部署构建脚本。
- `templates/`：Jinja 页面模板，以及 PSD/SVG 参考源文件。
- `static/`：前端 JS、CSS、图标、运行时模板素材、第三方前端库。
- `data/`：生成后的映射数据、本地化数据、图标源等。
- `tests/`：Node/Python 测试脚本，主要覆盖模板染剂策略、同步、搜索、导入解析等。
- `docs/ai/`：AI 长期阅读的项目文档库。

## 启动和部署

本地启动通常使用：

```powershell
start_gui.bat
```

公开部署支持：

- `NSGLAMOUR_BASE_PATH=/glamour`
- `NSGLAMOUR_MAX_CHARA_UPLOAD_MB`
- `NSGLAMOUR_ENABLE_CHARA_IMPORT`
- `NSGLAMOUR_ENABLE_RISING_STONES`
- `NSGLAMOUR_ALLOW_SERVER_FILE_PICKER`
- `NSGLAMOUR_CHARACTERS_ROOT`

公开部署时不要暴露本地文件选择器，不要默认开启只适合本机使用的能力。

## 数据流概览

1. `.chara`、网页链接或文本进入后端解析。
2. 后端输出统一的 `resolved_equipment` 数据结构。
3. 前端将解析结果转为页面状态、草稿、最近记录和模板数据。
4. `/template` 使用模板定义和 renderer 将装备、染剂、图片绘制到 canvas。
5. `/equipinfo` 使用同一套装备结构生成装备栏和复制文案。

## 长期维护重点

- 保持 `/template` 与 `/equipinfo` 的装备数据结构一致。
- 保持模板视觉规则隔离，避免模板之间互相污染。
- 保持染剂解析、空染色、不可染色、多染色槽和多语言名称兼容。
- 保持 `/glamour` 子路径部署可用。
- 保持中文 UI、本地化、UTF-8 无 BOM。
- 改动后尽量补充或更新对应 `docs/ai/` 文档。

