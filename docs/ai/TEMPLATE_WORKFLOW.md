# 模板工作流

## 模板系统定位

`/template` 是模板填充和 PNG 导出工具，不是自由设计器。模板应有固定输出尺寸、图片槽、文字区域、装备规则和染剂规则。

## 新增或修改模板的步骤

1. 阅读现有模板定义和渲染器：
   - `static/template-definitions.js`
   - `static/template.js`
   - `static/template-renderers.js`
   - 对应 `static/template-renderer-*.js`
2. 阅读页面结构：
   - `templates/template.html`
   - `static/app.css`
3. 如有 PSD/SVG 参考，先提取画布尺寸、图片区域、文字区域、行高、字体、颜色和遮罩。
4. 运行时素材放入 `static/templates/`。
5. 在模板定义中增加或调整：
   - `id`
   - `name`
   - `shortName`
   - `previewUrl`
   - `sourceSize`
   - `renderMode`
   - `controls`
   - `equipmentFormat`
   - `imageSlots`
6. 在渲染器中实现视觉绘制。
7. 更新版本查询串。
8. 验证导入数据、上传图片、裁剪、预览、导出。

## 现有模板

- `eorzea`：Eorzea Magazine。
- `horizontal`：横版艾欧泽亚杂志。
- `ec`：Eorzea Collection 风格。
- `story`：Double Pic。
- `risingstones`：石之家风格。
- `silence-fashion`：Silence Fashion。

## 图片规则

- 主图槽通常为 `main`。
- 头像槽目前有 `risingstones-avatar`、`silence-fashion-avatar`。
- 图片拖拽、上传、裁剪、跨模板携带和 IndexedDB 持久化都在 `/template` 中交织，改动前必须查完整链路。
- 图片预览和导出不是同一尺寸，预览由 CSS 和 preview canvas 缩放，导出由 `static/template.js` 控制真实像素。

## 装备和染剂规则

- 每个模板可定义不同的 `equipmentFormat`。
- 模板可以选择不同染剂模式，例如文本、chips、EC chips、Risingstones chips 等。
- 饰品、眼镜、时尚配饰一般不按普通装备显示染剂。
- `ignoreEmperor`、双手武器占副手、空染色、不可染色都可能影响最终行数和显示。
- 模板之间不要共享视觉特殊规则，除非它确实是全局规则。

## 校准建议

- 先用 SVG/PSD 确定大致布局。
- 再用真实幻化数据检查 5/6/7/8 行、长装备名、双染剂、无染色、不可染色。
- 修改 canvas 字体、坐标、行高、mask、图片槽时，应实际导出 PNG 观察。

