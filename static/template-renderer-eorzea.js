(function () {
  "use strict";

  function createEorzeaTemplateRenderer(deps = {}) {
    const {
      DEFAULT_LOCALE,
      FIGMA_EQUIPMENT_LAYOUTS,
      FIGMA_ITEM_NAME_TRACKING,
      FIGMA_MASK_FILL,
      FIGMA_SOURCE_SIZE,
      FIGMA_TEXT_COLOR,
      FIGMA_TITLE_MASK,
      FIGMA_TITLE_TEXT,
      FIGMA_TITLE_TRACKING,
      FIGMA_EMPTY_DYE_NAME,
      TEMPLATE_DEFINITIONS,
      buildTemplateEquipmentRows,
      drawClippedTextInBox,
      drawImageContain,
      drawImageCover,
      drawTextWithTracking,
      figmaRect,
      figmaUnit,
      formatFigmaDyeLabel,
      getFigmaTemplateBackground,
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateImageSlot,
      getTemplateImageSlotDefinitions,
      getTemplateImageSlotRect,
      loadFigmaTemplateBackground,
      normalizeFigmaDyeFrameMode,
      normalizeFigmaDyeName,
      normalizeHexColor,
      state,
    } = deps;

    function maskEorzeaRect(ctx, metrics, rect) {
      const box = figmaRect(metrics, rect);
      ctx.fillStyle = FIGMA_MASK_FILL;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      return box;
    }

    function getReadableTextColor(hexColor) {
      const raw = String(hexColor || "").trim().replace(/^#/, "");
      const expanded = raw.length === 3
        ? raw.split("").map((char) => `${char}${char}`).join("")
        : raw;
      if (!/^[0-9a-f]{6}$/i.test(expanded)) {
        return "#ffffff";
      }
      const red = parseInt(expanded.slice(0, 2), 16);
      const green = parseInt(expanded.slice(2, 4), 16);
      const blue = parseInt(expanded.slice(4, 6), 16);
      const luminance = (red * 299 + green * 587 + blue * 114) / 1000;
      return luminance > 148 ? "#111111" : "#ffffff";
    }

    function drawEorzeaTitle(ctx, metrics) {
      const title = String(state.settings.topText || "").trim() || getTemplateDefaultTopText(TEMPLATE_DEFINITIONS.eorzea);
      maskEorzeaRect(ctx, metrics, FIGMA_TITLE_MASK);
      ctx.fillStyle = FIGMA_TEXT_COLOR;
      ctx.textAlign = "right";
      ctx.textBaseline = "middle";
      const titleSize = figmaUnit(metrics, FIGMA_TITLE_TEXT.maxSize);
      const titleTracking = titleSize * (FIGMA_TITLE_TRACKING / 1000);
      ctx.font = `500 ${titleSize}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
      drawTextWithTracking(ctx, title, figmaUnit(metrics, FIGMA_TITLE_TEXT.right), figmaUnit(metrics, FIGMA_TITLE_TEXT.baselineY), titleTracking);
    }

    function redrawEorzeaGuides(ctx, metrics) {
      ctx.fillStyle = FIGMA_TEXT_COLOR;
      ctx.fillRect(figmaUnit(metrics, 2148), 0, figmaUnit(metrics, 1538), figmaUnit(metrics, 16));
      ctx.strokeStyle = FIGMA_TEXT_COLOR;
      ctx.lineWidth = Math.max(1, figmaUnit(metrics, 2));
      ctx.beginPath();
      ctx.moveTo(figmaUnit(metrics, 2149), figmaUnit(metrics, 1058));
      ctx.lineTo(figmaUnit(metrics, 3685), figmaUnit(metrics, 1058));
      ctx.moveTo(figmaUnit(metrics, 2149), figmaUnit(metrics, 1571));
      ctx.lineTo(figmaUnit(metrics, 3685), figmaUnit(metrics, 1571));
      ctx.stroke();
      ctx.strokeStyle = "#c7c6c5";
      ctx.lineWidth = Math.max(1, figmaUnit(metrics, 3));
      ctx.beginPath();
      ctx.moveTo(figmaUnit(metrics, 2635.59), figmaUnit(metrics, 1791.57));
      ctx.lineTo(figmaUnit(metrics, 2149.41), figmaUnit(metrics, 3259.42));
      ctx.stroke();
    }

    function getEorzeaEquipmentLayout(count) {
      if (count >= 7) {
        return FIGMA_EQUIPMENT_LAYOUTS.compact;
      }
      if (count === 6) {
        return FIGMA_EQUIPMENT_LAYOUTS.sixRows;
      }
      return FIGMA_EQUIPMENT_LAYOUTS.roomy;
    }

    function drawEorzeaPill(ctx, metrics, x, y, dye, layout, locale = state.locale) {
      const width = figmaUnit(metrics, layout.dyeWidth);
      const height = figmaUnit(metrics, layout.dyeHeight);
      const radius = figmaUnit(metrics, layout.dyeRadius);
      const name = normalizeFigmaDyeName(dye.name);
      const isEmptyDye = dye.isEmpty || name === FIGMA_EMPTY_DYE_NAME;
      const dyeColor = isEmptyDye ? FIGMA_MASK_FILL : normalizeHexColor(dye.hex, FIGMA_TEXT_COLOR);
      ctx.fillStyle = dyeColor;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      ctx.strokeStyle = isEmptyDye ? "rgba(37, 37, 37, 0.58)" : "rgba(37, 37, 37, 0.22)";
      ctx.lineWidth = Math.max(1, figmaUnit(metrics, 2));
      ctx.stroke();
      ctx.fillStyle = isEmptyDye ? FIGMA_TEXT_COLOR : getReadableTextColor(dyeColor);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `500 ${figmaUnit(metrics, layout.dyeFontSize)}px 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      const textWidth = figmaUnit(metrics, layout.dyeTextWidth);
      drawClippedTextInBox(
        ctx,
        formatFigmaDyeLabel(name, isEmptyDye, locale),
        { x: x + (width - textWidth) / 2, y, width: textWidth, height },
        x + width / 2,
        y + height / 2,
      );
    }

    function drawEorzeaPsdDyeFrame(ctx, metrics, x, y, dye, index, layout, locale = state.locale) {
      const width = figmaUnit(metrics, layout.dyeWidth);
      const height = figmaUnit(metrics, layout.dyeHeight);
      const radius = figmaUnit(metrics, layout.dyeRadius);
      const textX = x + figmaUnit(metrics, layout.dyeTextXOffset);
      const textY = y + figmaUnit(metrics, layout.dyeTextYOffset);
      const textWidth = figmaUnit(metrics, layout.dyeTextWidth);
      const textCenterX = textX + textWidth / 2;
      const numberCenterX = x + figmaUnit(metrics, layout.dyeTextXOffset - 42);
      const numberCenterY = y + height / 2;
      const numberRadius = figmaUnit(metrics, 13.5);
      const borderWidth = Math.max(1, figmaUnit(metrics, 2));
      const name = normalizeFigmaDyeName(dye.name);
      const isEmptyDye = dye.isEmpty || name === FIGMA_EMPTY_DYE_NAME;

      ctx.fillStyle = FIGMA_MASK_FILL;
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, radius);
      ctx.fill();
      ctx.strokeStyle = "#d2d1cf";
      ctx.lineWidth = borderWidth;
      ctx.stroke();

      ctx.strokeStyle = "#d2d1cf";
      ctx.lineWidth = Math.max(1, figmaUnit(metrics, 1.5));
      ctx.beginPath();
      ctx.arc(numberCenterX, numberCenterY, numberRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.fillStyle = "#c7c6c5";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${figmaUnit(metrics, 24)}px 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(String(index + 1), numberCenterX, numberCenterY + figmaUnit(metrics, 1));

      ctx.fillStyle = FIGMA_TEXT_COLOR;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.font = `500 ${figmaUnit(metrics, layout.dyeFontSize)}px 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      drawClippedTextInBox(
        ctx,
        formatFigmaDyeLabel(name, isEmptyDye, locale),
        { x: textX, y: textY, width: textWidth, height: height - figmaUnit(metrics, layout.dyeTextYOffset) },
        textCenterX,
        textY,
      );
    }

    function drawEorzeaDyeFrame(ctx, metrics, x, y, dye, index, layout, locale = state.locale) {
      const mode = normalizeFigmaDyeFrameMode(state.settings.dyeFrameMode);
      if (mode === "color") {
        drawEorzeaPill(ctx, metrics, x, y, dye, layout, locale);
        return;
      }
      drawEorzeaPsdDyeFrame(ctx, metrics, x, y, dye, index, layout, locale);
    }

    function drawEorzeaEquipment(ctx, metrics) {
      const template = TEMPLATE_DEFINITIONS.eorzea;
      const locale = getSelectedTemplateLocales()[0] || state.locale || DEFAULT_LOCALE;
      const rows = buildTemplateEquipmentRows(template, locale);
      if (!rows.length) {
        return;
      }
      const layout = getEorzeaEquipmentLayout(rows.length);
      const rowY = layout.rowY;
      const nameSize = figmaUnit(metrics, layout.nameSize);
      const lineHeight = figmaUnit(metrics, layout.lineHeight);
      const nameRight = figmaUnit(metrics, layout.nameX + layout.nameWidth);
      const nameWidth = figmaUnit(metrics, layout.nameWidth);
      const nameTracking = ((layout.nameSize * metrics.totalWidth) / FIGMA_SOURCE_SIZE) * (FIGMA_ITEM_NAME_TRACKING / 1000);
      rows.forEach((row, index) => {
        const y = figmaUnit(metrics, rowY[index]);
        const name = row.itemName;
        ctx.fillStyle = FIGMA_MASK_FILL;
        ctx.fillRect(figmaUnit(metrics, layout.nameX), y, nameWidth, lineHeight);
        ctx.fillStyle = FIGMA_TEXT_COLOR;
        ctx.textAlign = "right";
        ctx.textBaseline = "top";
        ctx.font = `500 ${nameSize}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
        drawTextWithTracking(ctx, name, nameRight, y, nameTracking);
        const dyes = row.dyes;
        const dyeY = y + figmaUnit(metrics, layout.dyeYOffset);
        dyes.forEach((dye, dyeIndex) => {
          ctx.fillStyle = FIGMA_MASK_FILL;
          ctx.fillRect(
            figmaUnit(metrics, layout.dyeX[dyeIndex]),
            dyeY,
            figmaUnit(metrics, layout.dyeWidth),
            figmaUnit(metrics, layout.dyeHeight),
          );
          drawEorzeaDyeFrame(ctx, metrics, figmaUnit(metrics, layout.dyeX[dyeIndex]), dyeY, dye, dyeIndex, layout, locale);
        });
      });
    }

    function drawEorzeaImageSlots(ctx, metrics) {
      for (const slot of getTemplateImageSlotDefinitions()) {
        const imageBox = getTemplateImageSlotRect(metrics, slot.id);
        const imageState = getTemplateImageSlot(slot.id);
        if (slot.fit === "contain") {
          drawImageContain(ctx, imageState.image, imageBox.x, imageBox.y, imageBox.width, imageBox.height, { showPlaceholderText: false });
        } else {
          drawImageCover(ctx, imageState.image, imageBox.x, imageBox.y, imageBox.width, imageBox.height, { showPlaceholderText: false });
        }
      }
    }

    function renderEorzeaTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = "#f5f5f5";
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      const figmaTemplateBackground = getFigmaTemplateBackground();
      if (figmaTemplateBackground) {
        ctx.drawImage(figmaTemplateBackground, 0, 0, metrics.totalWidth, metrics.totalHeight);
      } else {
        loadFigmaTemplateBackground();
      }
      redrawEorzeaGuides(ctx, metrics);
      drawEorzeaTitle(ctx, metrics);
      drawEorzeaEquipment(ctx, metrics);
      drawEorzeaImageSlots(ctx, metrics);
    }

    return {
      renderEorzeaTemplateCanvas,
    };
  }

  window.NSGlamourEorzeaTemplateRenderer = {
    createEorzeaTemplateRenderer,
  };
})();
