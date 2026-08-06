(function () {
  "use strict";

  function createHorizontalTemplateRenderer(deps = {}) {
    const {
      DEFAULT_LOCALE,
      HORIZONTAL_TEMPLATE_CONTENT_GROUP,
      HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT,
      HORIZONTAL_TEMPLATE_LINE_COLORS,
      HORIZONTAL_TEMPLATE_TEXT_COLOR,
      HORIZONTAL_TEMPLATE_TITLE,
      HORIZONTAL_TEMPLATE_TITLE_LINE,
      TEMPLATE_DEFINITIONS,
      buildTemplateEquipmentRows,
      drawImageCover,
      figmaRect,
      figmaUnit,
      figmaUnitY,
      getItemName,
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateDyeFormat,
      getTemplateEquipmentFormat,
      getTemplateDyeText,
      getTemplateDyeTextForOutput,
      getTemplateImageSlot,
      getTemplateImageSlotDefinitions,
      getTemplateImageSlotRect,
      loadHorizontalTemplateBackground,
      isTemplateBilingualMode,
      state,
      getHorizontalTemplateBackground,
    } = deps;

    function getHorizontalDyeText(row, locale = state.locale) {
      const raw = row?.rawRow || row;
      return isTemplateBilingualMode()
        ? getTemplateDyeTextForOutput(raw, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.horizontal))
        : row?.dyeText ?? getTemplateDyeText(raw, locale, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.horizontal));
    }

    function getHorizontalEquipmentRows(locale) {
      const itemLocales = getSelectedTemplateLocales();
      return buildTemplateEquipmentRows(TEMPLATE_DEFINITIONS.horizontal, locale)
        .map((row) => ({
          slot: row.slot,
          itemNames: itemLocales
            .map((itemLocale) => getItemName(row.item, itemLocale))
            .filter((name, index, names) => name && names.indexOf(name) === index),
          hasDyeLine: row.hasDyeLine,
          dyeText: getHorizontalDyeText(row, locale),
        }));
    }

    function getHorizontalEquipmentArea() {
      if (!isTemplateBilingualMode()) {
        return HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT;
      }
      return {
        ...HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT,
        itemSize: 68,
        secondaryItemSize: 58,
        itemLineHeight: 72,
        secondaryItemLineHeight: 64,
        itemInkHeight: 58,
        dyeSize: 44,
        dyeLineHeight: 54,
        dyeInkHeight: 38,
        groupGap: 46,
      };
    }

    function getHorizontalRowAdvance(row, area = getHorizontalEquipmentArea()) {
      return area.itemLineHeight
        + (row.itemNames.length > 1 ? area.secondaryItemLineHeight : 0)
        + (row.hasDyeLine ? area.dyeLineHeight : 0)
        + area.groupGap;
    }

    function getHorizontalRowInkHeight(row, area = getHorizontalEquipmentArea()) {
      return row.hasDyeLine
        ? area.itemLineHeight + (row.itemNames.length > 1 ? area.secondaryItemLineHeight : 0) + area.dyeInkHeight
        : area.itemInkHeight + (row.itemNames.length > 1 ? area.secondaryItemLineHeight : 0);
    }

    function getHorizontalEquipmentHeight(rows, area = getHorizontalEquipmentArea()) {
      if (!rows.length) {
        return area.topPadding + area.itemLineHeight;
      }
      return rows.reduce((height, row, index) => {
        if (index === rows.length - 1) {
          return height + getHorizontalRowInkHeight(row, area);
        }
        return height + getHorizontalRowAdvance(row, area);
      }, area.topPadding);
    }

    function getHorizontalVisibleRows(rows, area = getHorizontalEquipmentArea()) {
      if (!rows.length) {
        return [];
      }
      const visibleRows = [];
      let cursorY = area.topPadding;
      for (const row of rows) {
        if (cursorY + getHorizontalRowInkHeight(row, area) > area.height) {
          break;
        }
        visibleRows.push(row);
        cursorY += getHorizontalRowAdvance(row, area);
      }
      return visibleRows;
    }

    function getHorizontalContentLayout(rows) {
      const area = getHorizontalEquipmentArea();
      const visibleRows = getHorizontalVisibleRows(rows, area);
      const equipmentHeight = getHorizontalEquipmentHeight(visibleRows, area);
      const groupHeight = HORIZONTAL_TEMPLATE_CONTENT_GROUP.titleToEquipment + equipmentHeight;
      const groupBoundsHeight = HORIZONTAL_TEMPLATE_CONTENT_GROUP.bottom - HORIZONTAL_TEMPLATE_CONTENT_GROUP.top;
      const groupTop = HORIZONTAL_TEMPLATE_CONTENT_GROUP.top + Math.max(0, (groupBoundsHeight - groupHeight) / 2);
      return {
        groupTop,
        groupHeight,
        visibleRows,
        titleY: groupTop,
        lineY: groupTop + HORIZONTAL_TEMPLATE_CONTENT_GROUP.titleToLine,
        equipmentY: groupTop + HORIZONTAL_TEMPLATE_CONTENT_GROUP.titleToEquipment,
      };
    }

    function getHorizontalTitleText() {
      return state.settings.topText.trim() || getTemplateDefaultTopText(TEMPLATE_DEFINITIONS.horizontal);
    }

    function drawHorizontalTitle(ctx, metrics, layout) {
      const titleBox = figmaRect(metrics, {
        ...HORIZONTAL_TEMPLATE_TITLE,
        y: layout.titleY,
      });
      const lineWidth = figmaUnit(metrics, HORIZONTAL_TEMPLATE_TITLE_LINE.width);
      const clipBleedTop = figmaUnitY(metrics, HORIZONTAL_TEMPLATE_TITLE.clipBleedTop);
      const clipBleedBottom = figmaUnitY(metrics, HORIZONTAL_TEMPLATE_TITLE.clipBleedBottom);
      ctx.save();
      ctx.beginPath();
      ctx.rect(titleBox.x, titleBox.y - clipBleedTop, lineWidth, titleBox.height + clipBleedTop + clipBleedBottom);
      ctx.clip();
      ctx.fillStyle = HORIZONTAL_TEMPLATE_TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `900 ${figmaUnit(metrics, HORIZONTAL_TEMPLATE_TITLE.size)}px 'HarmonyOS Sans SC', 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(getHorizontalTitleText(), titleBox.x, titleBox.y);
      ctx.restore();
    }

    function drawHorizontalTitleLine(ctx, metrics, layout) {
      const lineBox = figmaRect(metrics, {
        ...HORIZONTAL_TEMPLATE_TITLE_LINE,
        y: layout.lineY,
      });
      ctx.save();
      const lineHeight = Math.max(1, Math.floor(lineBox.height / HORIZONTAL_TEMPLATE_LINE_COLORS.length));
      HORIZONTAL_TEMPLATE_LINE_COLORS.forEach((color, index) => {
        ctx.fillStyle = color;
        const y = lineBox.y + index * lineHeight;
        const height = index === HORIZONTAL_TEMPLATE_LINE_COLORS.length - 1
          ? Math.max(1, lineBox.y + lineBox.height - y)
          : lineHeight;
        ctx.fillRect(lineBox.x, y, lineBox.width, height);
      });
      ctx.restore();
    }

    function makeHorizontalEquipmentFont(size) {
      return `300 ${size}px 'Source Sans 3', 'HarmonyOS Sans SC', 'Microsoft YaHei', sans-serif`;
    }

    function getHorizontalFittedFontSize(ctx, text, baseSize, maxWidth, itemFormat = {}) {
      ctx.font = makeHorizontalEquipmentFont(baseSize);
      if (!itemFormat.shrinkOnOverflow || ctx.measureText(text).width <= maxWidth) {
        return baseSize;
      }
      const minScale = Math.max(0.4, Math.min(Number(itemFormat.minScale || 0.72), 1));
      const minSize = Math.max(1, baseSize * minScale);
      let size = baseSize - 1;
      while (size > minSize) {
        ctx.font = makeHorizontalEquipmentFont(size);
        if (ctx.measureText(text).width <= maxWidth) {
          return size;
        }
        size -= 1;
      }
      return minSize;
    }

    function drawHorizontalEquipmentText(ctx, metrics, layout, rows) {
      const area = getHorizontalEquipmentArea();
      const itemFormat = getTemplateEquipmentFormat(TEMPLATE_DEFINITIONS.horizontal).itemName || {};
      const box = figmaRect(metrics, {
        ...area,
        y: layout.equipmentY,
      });
      ctx.save();
      ctx.beginPath();
      ctx.rect(box.x, box.y, box.width, box.height);
      ctx.clip();
      ctx.fillStyle = HORIZONTAL_TEMPLATE_TEXT_COLOR;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";

      if (!rows.length) {
        ctx.restore();
        return;
      }

      const itemSize = figmaUnit(metrics, area.itemSize);
      const secondaryItemSize = figmaUnit(metrics, area.secondaryItemSize || area.itemSize);
      const dyeSize = figmaUnit(metrics, area.dyeSize);
      const itemLineHeight = figmaUnitY(metrics, area.itemLineHeight);
      const secondaryItemLineHeight = figmaUnitY(metrics, area.secondaryItemLineHeight || 0);
      const dyeLineHeight = figmaUnitY(metrics, area.dyeLineHeight);
      const groupGap = figmaUnitY(metrics, area.groupGap);
      let cursorY = box.y + figmaUnitY(metrics, area.topPadding);
      for (const row of rows) {
        const secondaryInkHeight = row.itemNames.length > 1 ? secondaryItemLineHeight : 0;
        const rowInkHeight = row.hasDyeLine
          ? itemLineHeight + secondaryInkHeight + figmaUnitY(metrics, area.dyeInkHeight)
          : figmaUnitY(metrics, area.itemInkHeight) + secondaryInkHeight;
        if (cursorY + rowInkHeight > box.y + box.height) {
          break;
        }
        row.itemNames.forEach((itemName, itemIndex) => {
          const baseSize = itemIndex === 0 ? itemSize : secondaryItemSize;
          const fittedItemSize = getHorizontalFittedFontSize(ctx, itemName, baseSize, box.width, itemFormat);
          ctx.font = makeHorizontalEquipmentFont(fittedItemSize);
          ctx.fillText(itemName, box.x, cursorY);
          cursorY += itemIndex === 0 ? itemLineHeight : secondaryItemLineHeight;
        });
        if (row.hasDyeLine) {
          ctx.font = makeHorizontalEquipmentFont(dyeSize);
          if (row.dyeText) {
            ctx.fillText(row.dyeText, box.x, cursorY);
          }
          cursorY += dyeLineHeight + groupGap;
        } else {
          cursorY += groupGap;
        }
      }
      ctx.restore();
    }

    function drawHorizontalImageSlots(ctx, metrics) {
      for (const slot of getTemplateImageSlotDefinitions()) {
        const imageBox = getTemplateImageSlotRect(metrics, slot.id);
        const imageState = getTemplateImageSlot(slot.id);
        drawImageCover(ctx, imageState.image, imageBox.x, imageBox.y, imageBox.width, imageBox.height, {
          showPlaceholderText: false,
          placeholderFillStyle: "#ffffff",
        });
      }
    }

    function renderHorizontalTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      const horizontalTemplateBackground = getHorizontalTemplateBackground();
      if (horizontalTemplateBackground) {
        ctx.drawImage(horizontalTemplateBackground, 0, 0, metrics.totalWidth, metrics.totalHeight);
      } else {
        loadHorizontalTemplateBackground();
      }
      drawHorizontalImageSlots(ctx, metrics);
      const locale = getSelectedTemplateLocales()[0] || state.locale || DEFAULT_LOCALE;
      const rows = getHorizontalEquipmentRows(locale);
      const layout = getHorizontalContentLayout(rows);
      drawHorizontalTitleLine(ctx, metrics, layout);
      drawHorizontalTitle(ctx, metrics, layout);
      drawHorizontalEquipmentText(ctx, metrics, layout, layout.visibleRows);
    }

    return {
      renderHorizontalTemplateCanvas,
    };
  }

  window.NSGlamourHorizontalTemplateRenderer = {
    createHorizontalTemplateRenderer,
  };
})();
