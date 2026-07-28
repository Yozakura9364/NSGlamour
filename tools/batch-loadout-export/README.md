# 配装批量导出

供本机个人批处理使用，不属于 NSGlamour 公网页面或部署产物。

## 数据来源

工具直接读取项目根目录的 `data/item_model_mapping.json`。不再需要单独维护
`item对照表.xlsx`；执行 `update_mapping.bat` 更新 NSGlamour 数据后，本工具会在下次运行时自动使用新映射。

## 安装

在项目根目录执行：

```powershell
python -m pip install -r tools/batch-loadout-export/requirements.txt
```

## 使用

双击 `run.bat`，选择待处理的 `.xlsx` 文件。工具读取活动工作表：

- 第一行视为原表头，不参与导出。
- 第二行起读取前三列：原始标识、中文装备、中文染剂。
- 完全空白的行会跳过。
- 结果写入输入文件同目录的 `导出结果.xlsx`。

也可以从命令行运行：

```powershell
python tools/batch-loadout-export/batch_loadout_export.py "D:\path\配装.xlsx" --no-dialog
```

输出维持旧工具的八列结构：原始三列、日文装备/染剂、英文装备/染剂、日英混合装备。
未匹配内容保留原文，并在完成信息中汇总；工具不会修改输入文件。
