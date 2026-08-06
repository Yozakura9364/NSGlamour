# `/template` 模板工作台

## 职责

`/template` 负责把装备数据、染剂数据和用户图片填入固定模板，最终导出 PNG。

## 关键文件

- `templates/template.html`
- `static/template.js`
- `static/template-definitions.js`
- `static/template-renderers.js`
- `static/template-renderer-eorzea.js`
- `static/template-renderer-horizontal.js`
- `static/template-renderer-story.js`
- `static/template-renderer-ec.js`
- `static/template-renderer-risingstones.js`
- `static/template-renderer-silence-fashion.js`
- `static/template-image-store.js`
- `static/template-dye-policy.js`
- `static/common.js`
- `static/store.js`
- `static/app.css`

## 主要状态

- 当前模板 ID。
- 标题、角色名、服务器/名字、副标题等模板字段。
- 装备行和染剂。
- 语言和模板语言顺序。
- 图片槽、头像槽、裁剪状态。
- 最近记录。
- 草稿。
- 是否忽略皇帝套。

## 关键交互

- `switchTemplate(...)`：切换模板。
- `loadDraft(...)` / `applyDraft(...)`：加载和应用草稿。
- `importTemplateGlamourLink(...)`：从网页链接导入。
- `render(...)` / `renderCanvas(...)`：渲染预览。
- `downloadCanvas(...)`：导出 PNG。
- `handleImageFile(...)` / `openImageCropper(...)` / `applyImageCrop(...)`：图片处理。
- `syncTemplateToStore(...)`：同步模板数据到共享状态。

## 修改风险

- 图片上传层容易影响拖拽文件默认打开行为。
- 模板坐标修改可能只在预览看似正确，导出 PNG 不正确。
- 染剂规则修改可能影响所有模板。
- 共享草稿和最近记录改动会影响 `/equipinfo`。
- 头像槽和主图槽逻辑不同，修改时必须看 `imageSlots` 和 `dropRegion`。

## 验证建议

- 加载 `/template`。
- 导入真实石之家数据，并确认 Eorzea Collection 链接被拒绝。
- 切换多个模板。
- 上传主图和头像图。
- 调整裁剪。
- 导出 PNG。
- 检查长装备名、双染剂、无染色、不可染色、皇帝套、副手占用。

