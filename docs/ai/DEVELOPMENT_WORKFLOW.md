# 开发工作流程

## 任务分类

### 小范围明确修复

可以直接实现，但必须先读相关文件。示例：

- 单个按钮文案。
- 单个 CSS 对齐。
- 单个 JS 语法错误。
- 明确的本地化条目修正。

### 需要计划阶段的任务

必须先分析并说明计划，确认后再改：

- 完整功能。
- 跨文件改动。
- 删除代码。
- 重构。
- 模板渲染规则调整。
- 导入链路调整。
- API 数据结构调整。
- 上传、安全、部署路径相关修改。

计划阶段必须说明：

- 当前识别到的项目名称。
- 当前项目技术栈。
- 已读取的 `AGENTS.md` 和关键文件。
- 需求理解。
- 涉及文件。
- 具体步骤。
- 风险点。
- 验证方式。

## 修改原则

- 只改需求相关文件。
- 不格式化无关文件。
- 不顺手重构。
- 不引入新依赖，除非先说明并确认。
- 不删除无法证明无用的代码。
- 遇到用户或其他工具已有改动时，先识别并保护，不要覆盖。

## 删除前检查

删除代码前至少检查：

- JavaScript 引用。
- HTML 模板引用。
- CSS 类名使用。
- Flask 路由引用。
- 动态 import 或字符串调用。
- `localStorage` 键名。
- postMessage。
- `NSGlamourStore` 同步。
- 测试文件。
- 公开部署兼容风险。

无法确认无用时，只能标记为疑似无用。

## 验证清单

JavaScript 基础检查：

```powershell
node --check static\template.js
node --check static\equipinfo.js
node --check static\ui-language.js
```

共享文件按需检查：

```powershell
node --check static\common.js
node --check static\store.js
node --check static\template-definitions.js
```

本地服务健康检查：

```powershell
Invoke-WebRequest -UseBasicParsing http://127.0.0.1:8765/api/health
```

映射构建：

```powershell
python scripts/build_item_mapping.py
```

或：

```powershell
update_mapping.bat
```

## 完成总结

完成后说明：

- 修改了哪些文件。
- 为什么这样改。
- 是否影响现有功能。
- 运行了哪些验证命令。
- 是否还有残余风险。
- 如更新了 `AGENTS.md` 或 `docs/ai/`，说明新增或修改了哪些长期规则。

