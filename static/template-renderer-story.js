(function () {
  "use strict";

  function createStoryTemplateRenderer(deps = {}) {
    const {
      DEFAULT_LOCALE,
      DOUBLE_PIC_COPYRIGHT_RECT,
      DOUBLE_PIC_COPYRIGHT_TEXT,
      DOUBLE_PIC_COPYRIGHT_TEXT_STYLE,
      STORY_TEMPLATE_BACKGROUND_COLOR,
      STORY_TEMPLATE_CIRCLE_FRAME,
      STORY_TEMPLATE_EQUIPMENT_TEXT,
      STORY_TEMPLATE_FONT_FAMILY,
      STORY_TEMPLATE_FONT_WEIGHT,
      STORY_TEMPLATE_FRAME_BLACK,
      STORY_TEMPLATE_FRAME_WHITE,
      STORY_TEMPLATE_SWATCH_FRAME,
      STORY_TEMPLATE_SWATCH_RECTS,
      STORY_TEMPLATE_WATERMARK_RECT,
      STORY_TEMPLATE_WATERMARK_TEXT,
      STORY_TEMPLATE_WATERMARK_TEXT_STYLE,
      TEMPLATE_DEFINITIONS,
      buildTemplateEquipmentRows,
      drawImageCover,
      drawMaskedImageCover,
      figmaRect,
      figmaUnit,
      getDoublePicLeftMask,
      getItemName,
      getSelectedTemplateLocales,
      getStoryTemplateLeftMask,
      getTemplateDyeFormat,
      getTemplateDyeText,
      getTemplateImageSlot,
      getTemplateImageSlotDefinition,
      getTemplateImageSlotRect,
      loadDoublePicLeftMask,
      loadStoryTemplateLeftMask,
      normalizeStorySwatchColors,
      state,
    } = deps;

    function makeArcRoundedRectPath(ctx, x, y, width, height, radius) {
      const normalizedRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
      ctx.beginPath();
      ctx.moveTo(x + normalizedRadius, y);
      ctx.lineTo(x + width - normalizedRadius, y);
      ctx.arcTo(x + width, y, x + width, y + normalizedRadius, normalizedRadius);
      ctx.lineTo(x + width, y + height - normalizedRadius);
      ctx.arcTo(x + width, y + height, x + width - normalizedRadius, y + height, normalizedRadius);
      ctx.lineTo(x + normalizedRadius, y + height);
      ctx.arcTo(x, y + height, x, y + height - normalizedRadius, normalizedRadius);
      ctx.lineTo(x, y + normalizedRadius);
      ctx.arcTo(x, y, x + normalizedRadius, y, normalizedRadius);
      ctx.closePath();
    }

    function fillArcRoundedRect(ctx, x, y, width, height, radius) {
      makeArcRoundedRectPath(ctx, x, y, width, height, radius);
      ctx.fill();
    }

    function drawStoryCircleImage(ctx, metrics, image, box) {
      const blackWidth = figmaUnit(metrics, STORY_TEMPLATE_CIRCLE_FRAME.blackWidth);
      const whiteWidth = figmaUnit(metrics, STORY_TEMPLATE_CIRCLE_FRAME.whiteWidth);
      const imageRadius = Math.min(box.width, box.height) / 2;
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      const whiteRadius = imageRadius + whiteWidth;
      const outerRadius = whiteRadius + blackWidth;

      ctx.save();
      ctx.fillStyle = STORY_TEMPLATE_FRAME_BLACK;
      ctx.beginPath();
      ctx.arc(centerX, centerY, outerRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = STORY_TEMPLATE_FRAME_WHITE;
      ctx.beginPath();
      ctx.arc(centerX, centerY, whiteRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(centerX, centerY, imageRadius, 0, Math.PI * 2);
      ctx.clip();
      drawImageCover(
        ctx,
        image,
        centerX - imageRadius,
        centerY - imageRadius,
        imageRadius * 2,
        imageRadius * 2,
        { showPlaceholderText: false, placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR },
      );
      ctx.restore();
    }

    function getStoryDyeText(row, locale) {
      return row?.dyeText ?? getTemplateDyeText(row, locale, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.story));
    }

    function makeStoryEquipmentLine(row, locale) {
      const itemName = row?.itemName ?? getItemName(row.item, locale).trim();
      if (!itemName) {
        return "";
      }
      const dyeText = getStoryDyeText(row, locale);
      return dyeText ? `${itemName} ${dyeText}` : itemName;
    }

    function getStoryEquipmentTypography(ctx, metrics) {
      const area = STORY_TEMPLATE_EQUIPMENT_TEXT;
      const maxSize = figmaUnit(metrics, area.maxFontSize);
      const lineHeightRatio = Number(area.lineHeightRatio || 1.58);
      return {
        size: maxSize,
        lineHeight: Math.round(maxSize * lineHeightRatio),
      };
    }

    function getStoryTemplateFont(size) {
      return `${STORY_TEMPLATE_FONT_WEIGHT} ${size}px ${STORY_TEMPLATE_FONT_FAMILY}`;
    }

    function colorWithAlpha(color, alpha) {
      const normalizedAlpha = Math.max(0, Math.min(1, Number.isFinite(Number(alpha)) ? Number(alpha) : 1));
      const hex = String(color || "").trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
      if (!hex) {
        return color || `rgba(0, 0, 0, ${normalizedAlpha})`;
      }
      const value = hex[1].length === 3
        ? hex[1].split("").map((char) => `${char}${char}`).join("")
        : hex[1];
      const red = parseInt(value.slice(0, 2), 16);
      const green = parseInt(value.slice(2, 4), 16);
      const blue = parseInt(value.slice(4, 6), 16);
      return `rgba(${red}, ${green}, ${blue}, ${normalizedAlpha})`;
    }

    function getStoryTextPalette() {
      return state.settings.storyTextColorMode === "black"
        ? { text: "#111111", glow: "#ffffff" }
        : { text: "#ffffff", glow: "#000000" };
    }

    function drawStoryEquipmentTextShape(ctx, lines, layout, color) {
      ctx.save();
      ctx.font = layout.font;
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.lineCap = "round";
      ctx.lineWidth = layout.underlineWidth;
      ctx.fillStyle = color;
      ctx.strokeStyle = color;
      lines.forEach((line, index) => {
        const text = String(line || "");
        const lineY = layout.startY + index * layout.lineHeight;
        const measuredWidth = ctx.measureText(text).width;
        const underlineY = lineY + layout.underlineOffset;
        ctx.fillText(text, layout.centerX, lineY);
        ctx.beginPath();
        ctx.moveTo(layout.centerX - measuredWidth / 2, underlineY);
        ctx.lineTo(layout.centerX + measuredWidth / 2, underlineY);
        ctx.stroke();
      });
      ctx.restore();
    }

    function createStorySpreadMaskCanvas(maskCanvas, spreadRadius) {
      if (!maskCanvas || spreadRadius <= 0) {
        return maskCanvas;
      }
      const spreadCanvas = document.createElement("canvas");
      spreadCanvas.width = maskCanvas.width;
      spreadCanvas.height = maskCanvas.height;
      const spreadCtx = spreadCanvas.getContext("2d");
      const radius = Math.ceil(spreadRadius);
      const radiusSquared = spreadRadius * spreadRadius;
      for (let y = -radius; y <= radius; y += 1) {
        for (let x = -radius; x <= radius; x += 1) {
          if (x * x + y * y <= radiusSquared) {
            spreadCtx.drawImage(maskCanvas, x, y);
          }
        }
      }
      return spreadCanvas;
    }

    function drawStoryMaskOuterGlow(ctx, metrics, maskCanvas, x, y, area = STORY_TEMPLATE_EQUIPMENT_TEXT, glowColor = null) {
      const opacity = Number(area.outerGlowOpacity ?? 0.36);
      const glowSize = figmaUnit(metrics, area.outerGlowSize || 24);
      if (!maskCanvas || opacity <= 0 || glowSize <= 0) {
        return;
      }

      const spreadRadius = Math.max(0, glowSize * Number(area.outerGlowSpread || 0));
      const spreadCanvas = createStorySpreadMaskCanvas(maskCanvas, spreadRadius);
      const shadowOffset = Math.ceil(metrics.totalWidth + spreadCanvas.width + glowSize * 4 + 16);

      ctx.save();
      ctx.shadowColor = colorWithAlpha(glowColor || area.outerGlowColor || "#000000", opacity);
      ctx.shadowBlur = glowSize;
      ctx.shadowOffsetX = shadowOffset;
      ctx.shadowOffsetY = 0;
      ctx.drawImage(spreadCanvas, x - shadowOffset, y);
      ctx.restore();
    }

    function drawStoryEquipmentOuterGlow(ctx, metrics, lines, layout, textBlockHeight, area, glowColor) {
      if (!lines.length) {
        return;
      }

      const glowSize = figmaUnit(metrics, area.outerGlowSize || 24);
      const spreadRadius = Math.max(0, glowSize * Number(area.outerGlowSpread || 0));
      const maxTextWidth = lines.reduce((maxWidth, line) => Math.max(maxWidth, ctx.measureText(String(line || "")).width), 1);
      const padding = Math.ceil(glowSize * 2.5 + spreadRadius * 3 + layout.underlineWidth * 2);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = Math.max(1, Math.ceil(maxTextWidth + padding * 2));
      maskCanvas.height = Math.max(1, Math.ceil(textBlockHeight + padding * 2));
      const maskCtx = maskCanvas.getContext("2d");
      drawStoryEquipmentTextShape(maskCtx, lines, {
        ...layout,
        centerX: maskCanvas.width / 2,
        startY: padding,
      }, "#000000");

      const drawX = layout.centerX - maskCanvas.width / 2;
      const drawY = layout.startY - padding;
      drawStoryMaskOuterGlow(ctx, metrics, maskCanvas, drawX, drawY, area, glowColor);
    }

    function drawStoryEquipmentText(ctx, metrics) {
      const locale = getSelectedTemplateLocales()[0] || state.locale || DEFAULT_LOCALE;
      const lines = buildTemplateEquipmentRows(TEMPLATE_DEFINITIONS.story, locale)
        .map((row) => makeStoryEquipmentLine(row, locale))
        .filter(Boolean);
      if (!lines.length) {
        return;
      }

      const area = STORY_TEMPLATE_EQUIPMENT_TEXT;
      const centerX = figmaUnit(metrics, area.x);
      const bottomY = figmaUnit(metrics, area.y + area.height);
      const typography = getStoryEquipmentTypography(ctx, metrics);
      const underlineWidth = Math.max(1, figmaUnit(metrics, area.underlineWidth || 4));
      const underlineOffset = Math.round(typography.size * Number(area.underlineOffsetRatio || 1.23));
      const maxHeight = figmaUnit(metrics, area.height);
      const maxLines = Math.max(1, Math.floor((maxHeight - underlineOffset - underlineWidth) / typography.lineHeight) + 1);
      const visibleLines = lines.slice(0, maxLines);
      const textBlockHeight = typography.lineHeight * Math.max(0, visibleLines.length - 1) + underlineOffset + underlineWidth;
      const startY = bottomY - textBlockHeight;
      const layout = {
        font: getStoryTemplateFont(typography.size),
        centerX,
        startY,
        lineHeight: typography.lineHeight,
        underlineOffset,
        underlineWidth,
      };
      const palette = getStoryTextPalette();

      ctx.save();
      ctx.font = layout.font;
      drawStoryEquipmentOuterGlow(ctx, metrics, visibleLines, layout, textBlockHeight, area, palette.glow);
      drawStoryEquipmentTextShape(ctx, visibleLines, layout, palette.text);
      ctx.restore();
    }

    function getStoryWatermarkFontSize(ctx, metrics, box) {
      const maxSize = figmaUnit(metrics, STORY_TEMPLATE_WATERMARK_TEXT_STYLE.maxFontSize);
      const minSize = figmaUnit(metrics, STORY_TEMPLATE_WATERMARK_TEXT_STYLE.minFontSize);
      let size = maxSize;
      do {
        ctx.font = getStoryTemplateFont(size);
        if (ctx.measureText(STORY_TEMPLATE_WATERMARK_TEXT).width <= box.width) {
          return size;
        }
        size -= 1;
      } while (size >= minSize);
      return minSize;
    }

    function drawStoryWatermarkTextShape(ctx, box, font, color) {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      ctx.fillText(STORY_TEMPLATE_WATERMARK_TEXT, box.x + box.width / 2, box.y + box.height / 2);
      ctx.restore();
    }

    function drawCenteredTextShape(ctx, text, box, font, color, maxWidth = null) {
      ctx.save();
      ctx.font = font;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = color;
      if (Number.isFinite(maxWidth) && maxWidth > 0) {
        ctx.fillText(text, box.x + box.width / 2, box.y + box.height / 2, maxWidth);
      } else {
        ctx.fillText(text, box.x + box.width / 2, box.y + box.height / 2);
      }
      ctx.restore();
    }

    function drawStorySwatches(ctx, metrics) {
      const colors = normalizeStorySwatchColors(state.settings.storySwatchColors);
      ctx.save();
      STORY_TEMPLATE_SWATCH_RECTS.forEach((rect, index) => {
        const colorBox = figmaRect(metrics, rect);
        const blackWidth = figmaUnit(metrics, STORY_TEMPLATE_SWATCH_FRAME.blackWidth);
        const whiteWidth = figmaUnit(metrics, STORY_TEMPLATE_SWATCH_FRAME.whiteWidth);
        const outerRadius = figmaUnit(metrics, STORY_TEMPLATE_SWATCH_FRAME.radius);
        const whiteBox = {
          x: colorBox.x - whiteWidth,
          y: colorBox.y - whiteWidth,
          width: colorBox.width + whiteWidth * 2,
          height: colorBox.height + whiteWidth * 2,
        };
        const outerBox = {
          x: whiteBox.x - blackWidth,
          y: whiteBox.y - blackWidth,
          width: whiteBox.width + blackWidth * 2,
          height: whiteBox.height + blackWidth * 2,
        };
        const color = colors[index];
        ctx.fillStyle = STORY_TEMPLATE_FRAME_BLACK;
        fillArcRoundedRect(ctx, outerBox.x, outerBox.y, outerBox.width, outerBox.height, outerRadius);
        ctx.fillStyle = STORY_TEMPLATE_FRAME_WHITE;
        fillArcRoundedRect(ctx, whiteBox.x, whiteBox.y, whiteBox.width, whiteBox.height, Math.max(0, outerRadius - blackWidth));
        if (color) {
          ctx.fillStyle = color;
          fillArcRoundedRect(
            ctx,
            colorBox.x,
            colorBox.y,
            colorBox.width,
            colorBox.height,
            figmaUnit(metrics, STORY_TEMPLATE_SWATCH_FRAME.colorRadius),
          );
        }
      });
      ctx.restore();
    }

    function drawStoryWatermark(ctx, metrics) {
      const palette = getStoryTextPalette();
      const box = figmaRect(metrics, STORY_TEMPLATE_WATERMARK_RECT);
      const fontSize = getStoryWatermarkFontSize(ctx, metrics, box);
      const font = getStoryTemplateFont(fontSize);
      const glowSize = figmaUnit(metrics, STORY_TEMPLATE_EQUIPMENT_TEXT.outerGlowSize || 24);
      const spreadRadius = Math.max(0, glowSize * Number(STORY_TEMPLATE_EQUIPMENT_TEXT.outerGlowSpread || 0));
      const padding = Math.ceil(glowSize * 2.5 + spreadRadius * 3);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = Math.max(1, Math.ceil(box.width + padding * 2));
      maskCanvas.height = Math.max(1, Math.ceil(box.height + padding * 2));
      const maskCtx = maskCanvas.getContext("2d");
      drawStoryWatermarkTextShape(maskCtx, {
        x: padding,
        y: padding,
        width: box.width,
        height: box.height,
      }, font, "#000000");

      drawStoryMaskOuterGlow(ctx, metrics, maskCanvas, box.x - padding, box.y - padding, STORY_TEMPLATE_EQUIPMENT_TEXT, palette.glow);
      drawStoryWatermarkTextShape(ctx, box, font, palette.text);
    }

    function renderStoryTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = STORY_TEMPLATE_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);

      const rightSlot = getTemplateImageSlotDefinition("story-right");
      const rightBox = getTemplateImageSlotRect(metrics, rightSlot.id);
      drawImageCover(ctx, getTemplateImageSlot(rightSlot.id).image, rightBox.x, rightBox.y, rightBox.width, rightBox.height, {
        showPlaceholderText: false,
        placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR,
      });

      const leftSlot = getTemplateImageSlotDefinition("story-left");
      const leftBox = getTemplateImageSlotRect(metrics, leftSlot.id);
      const leftMaskBox = leftSlot.maskRegion ? figmaRect(metrics, leftSlot.maskRegion) : leftBox;
      const storyTemplateLeftMask = getStoryTemplateLeftMask();
      if (storyTemplateLeftMask) {
        drawMaskedImageCover(
          ctx,
          getTemplateImageSlot(leftSlot.id).image,
          storyTemplateLeftMask,
          leftBox.x,
          leftBox.y,
          leftBox.width,
          leftBox.height,
          leftMaskBox,
          { placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR },
        );
      } else {
        loadStoryTemplateLeftMask();
        drawImageCover(ctx, getTemplateImageSlot(leftSlot.id).image, leftBox.x, leftBox.y, leftBox.width, leftBox.height, {
          showPlaceholderText: false,
          placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR,
        });
      }

      const circleSlot = getTemplateImageSlotDefinition("story-circle");
      const circleBox = getTemplateImageSlotRect(metrics, circleSlot.id);
      drawStoryCircleImage(ctx, metrics, getTemplateImageSlot(circleSlot.id).image, circleBox);
      drawStoryWatermark(ctx, metrics);
      drawStorySwatches(ctx, metrics);
      drawStoryEquipmentText(ctx, metrics);
    }

    function drawDoublePicCopyright(ctx, metrics) {
      const palette = getStoryTextPalette();
      const box = figmaRect(metrics, DOUBLE_PIC_COPYRIGHT_RECT);
      const maxSize = figmaUnit(metrics, DOUBLE_PIC_COPYRIGHT_TEXT_STYLE.maxFontSize);
      const minSize = figmaUnit(metrics, DOUBLE_PIC_COPYRIGHT_TEXT_STYLE.minFontSize);
      let fontSize = maxSize;
      do {
        ctx.font = getStoryTemplateFont(fontSize);
        if (ctx.measureText(DOUBLE_PIC_COPYRIGHT_TEXT).width <= box.width) {
          break;
        }
        fontSize -= 1;
      } while (fontSize >= minSize);
      const font = getStoryTemplateFont(Math.max(fontSize, minSize));
      const glowSize = figmaUnit(metrics, STORY_TEMPLATE_EQUIPMENT_TEXT.outerGlowSize || 24);
      const spreadRadius = Math.max(0, glowSize * Number(STORY_TEMPLATE_EQUIPMENT_TEXT.outerGlowSpread || 0));
      const padding = Math.ceil(glowSize * 2.5 + spreadRadius * 3);
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = Math.max(1, Math.ceil(box.width + padding * 2));
      maskCanvas.height = Math.max(1, Math.ceil(box.height + padding * 2));
      const maskCtx = maskCanvas.getContext("2d");
      drawCenteredTextShape(maskCtx, DOUBLE_PIC_COPYRIGHT_TEXT, {
        x: padding,
        y: padding,
        width: box.width,
        height: box.height,
      }, font, "#000000", box.width);

      drawStoryMaskOuterGlow(ctx, metrics, maskCanvas, box.x - padding, box.y - padding, STORY_TEMPLATE_EQUIPMENT_TEXT, palette.glow);
      drawCenteredTextShape(ctx, DOUBLE_PIC_COPYRIGHT_TEXT, box, font, palette.text, box.width);
    }

    function renderDoublePicTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = STORY_TEMPLATE_BACKGROUND_COLOR;
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);

      const rightSlot = getTemplateImageSlotDefinition("story-right");
      const rightBox = getTemplateImageSlotRect(metrics, rightSlot.id);
      drawImageCover(ctx, getTemplateImageSlot(rightSlot.id).image, rightBox.x, rightBox.y, rightBox.width, rightBox.height, {
        showPlaceholderText: false,
        placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR,
      });

      const leftSlot = getTemplateImageSlotDefinition("story-left");
      const leftBox = getTemplateImageSlotRect(metrics, leftSlot.id);
      const doublePicLeftMask = getDoublePicLeftMask();
      if (doublePicLeftMask) {
        drawMaskedImageCover(
          ctx,
          getTemplateImageSlot(leftSlot.id).image,
          doublePicLeftMask,
          leftBox.x,
          leftBox.y,
          leftBox.width,
          leftBox.height,
          leftBox,
          { placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR },
        );
      } else {
        loadDoublePicLeftMask();
        drawImageCover(ctx, getTemplateImageSlot(leftSlot.id).image, leftBox.x, leftBox.y, leftBox.width, leftBox.height, {
          showPlaceholderText: false,
          placeholderFillStyle: STORY_TEMPLATE_BACKGROUND_COLOR,
        });
      }

      drawStoryEquipmentText(ctx, metrics);
      drawDoublePicCopyright(ctx, metrics);
    }

    return {
      renderDoublePicTemplateCanvas,
      renderStoryTemplateCanvas,
    };
  }

  window.NSGlamourStoryTemplateRenderer = {
    createStoryTemplateRenderer,
  };
})();
