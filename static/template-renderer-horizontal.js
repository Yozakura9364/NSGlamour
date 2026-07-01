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
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateDyeFormat,
      getTemplateEquipmentFormat,
      getTemplateDyeText,
      getTemplateImageSlot,
      getTemplateImageSlotDefinitions,
      getTemplateImageSlotRect,
      loadHorizontalTemplateBackground,
      state,
      getHorizontalTemplateBackground,
    } = deps;

    function getHorizontalDyeText(row, locale = state.locale) {
      return row?.dyeText ?? getTemplateDyeText(row, locale, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.horizontal));
    }

    function getHorizontalEquipmentRows(locale) {
      return buildTemplateEquipmentRows(TEMPLATE_DEFINITIONS.horizontal, locale)
        .map((row) => ({
          slot: row.slot,
          itemName: row.itemName,
          hasDyeLine: row.hasDyeLine,
          dyeText: getHorizontalDyeText(row, locale),
        }));
    }

    function getHorizontalRowAdvance(row, area = HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT) {
      return area.itemLineHeight + (row.hasDyeLine ? area.dyeLineHeight : 0) + area.groupGap;
    }

    function getHorizontalRowInkHeight(row, area = HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT) {
      return row.hasDyeLine
        ? area.itemLineHeight + area.dyeInkHeight
        : area.itemInkHeight;
    }

    function getHorizontalEquipmentHeight(rows, area = HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT) {
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

    function getHorizontalVisibleRows(rows, area = HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT) {
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
      const visibleRows = getHorizontalVisibleRows(rows);
      const equipmentHeight = getHorizontalEquipmentHeight(visibleRows);
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
      const area = HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT;
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
      const dyeSize = figmaUnit(metrics, area.dyeSize);
      const itemLineHeight = figmaUnitY(metrics, area.itemLineHeight);
      const dyeLineHeight = figmaUnitY(metrics, area.dyeLineHeight);
      const groupGap = figmaUnitY(metrics, area.groupGap);
      let cursorY = box.y + figmaUnitY(metrics, area.topPadding);
      for (const row of rows) {
        const rowInkHeight = row.hasDyeLine
          ? itemLineHeight + figmaUnitY(metrics, area.dyeInkHeight)
          : figmaUnitY(metrics, area.itemInkHeight);
        if (cursorY + rowInkHeight > box.y + box.height) {
          break;
        }
        const fittedItemSize = getHorizontalFittedFontSize(ctx, row.itemName, itemSize, box.width, itemFormat);
        ctx.font = makeHorizontalEquipmentFont(fittedItemSize);
        ctx.fillText(row.itemName, box.x, cursorY);
        if (row.hasDyeLine) {
          cursorY += itemLineHeight;
          ctx.font = makeHorizontalEquipmentFont(dyeSize);
          if (row.dyeText) {
            ctx.fillText(row.dyeText, box.x, cursorY);
          }
          cursorY += dyeLineHeight + groupGap;
        } else {
          cursorY += itemLineHeight + groupGap;
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
