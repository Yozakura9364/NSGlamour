(function () {
  "use strict";

  function createRisingstonesTemplateRenderer(deps = {}) {
    const {
      ACCESSORY_SLOTS,
      DEFAULT_IMAGE_SLOT_ID,
      DEFAULT_LOCALE,
      FIGMA_EMPTY_DYE_NAME,
      RISINGSTONES_AVATAR_SLOT_ID,
      RISINGSTONES_TEMPLATE,
      TEMPLATE_DEFINITIONS,
      buildIconUrl,
      buildTemplateEquipmentRows,
      drawClippedTextInBox,
      drawEcFittedItemName,
      drawImageCover,
      figmaRect,
      figmaUnit,
      figmaUnitY,
      fillRoundedRect,
      formatEcSubtitleParts,
      getEcDyeLabel,
      getEcSubtitlePartsFromSettings,
      getItemName,
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateDisplayDyeEntries,
      getTemplateDyeFormat,
      getTemplateImageSlot,
      iconImageCache,
      makeRoundedRectPath,
      normalizeFigmaDyeName,
      normalizeHexColor,
      state,
      strokeRoundedRect,
    } = deps;

    function getRisingstonesTitleText() {
      return state.settings.topText.trim() || getTemplateDefaultTopText(TEMPLATE_DEFINITIONS.risingstones);
    }

    function getRisingstonesAuthorText() {
      return formatEcSubtitleParts(getEcSubtitlePartsFromSettings());
    }

    function getRisingstonesSourceText() {
      return RISINGSTONES_TEMPLATE.sourceText || "最终幻想14 - FINAL FANTASY XIV";
    }

    function getRisingstonesMetaValues() {
      const raceGender = [state.sourceMeta?.race, state.sourceMeta?.gender].filter(Boolean).join("-");
      return {
        race: raceGender,
        job: "",
        id: state.sourceMeta?.sourceId || "",
      };
    }

    function drawRisingstonesImage(ctx, metrics) {
      const layout = RISINGSTONES_TEMPLATE;
      const box = figmaRect(metrics, layout.imageRegion);
      const radius = figmaUnit(metrics, layout.imageRadius);
      const image = getTemplateImageSlot(DEFAULT_IMAGE_SLOT_ID).image;
      const strokeWidth = figmaUnit(metrics, layout.imageStrokeWidth || 0);
      ctx.save();
      makeRoundedRectPath(ctx, box.x, box.y, box.width, box.height, radius);
      ctx.clip();
      ctx.fillStyle = layout.imagePlaceholder;
      ctx.fillRect(box.x, box.y, box.width, box.height);
      if (image) {
        drawImageCover(ctx, image, box.x, box.y, box.width, box.height, {
          showPlaceholderFill: false,
          showPlaceholderText: false,
        });
      }
      ctx.restore();
      if (strokeWidth > 0) {
        ctx.save();
        const inset = strokeWidth / 2;
        ctx.strokeStyle = layout.borderColor || layout.accent;
        ctx.lineWidth = strokeWidth;
        makeRoundedRectPath(
          ctx,
          box.x + inset,
          box.y + inset,
          Math.max(0, box.width - strokeWidth),
          Math.max(0, box.height - strokeWidth),
          Math.max(0, radius - inset),
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawRisingstonesBackgroundStroke(ctx, metrics) {
      const layout = RISINGSTONES_TEMPLATE;
      const strokeWidth = figmaUnit(metrics, layout.backgroundStrokeWidth || 0);
      if (strokeWidth <= 0) {
        return;
      }
      ctx.save();
      const inset = strokeWidth / 2;
      ctx.strokeStyle = layout.borderColor || layout.accent;
      ctx.lineWidth = strokeWidth;
      strokeRoundedRect(
        ctx,
        inset,
        inset,
        Math.max(0, metrics.totalWidth - strokeWidth),
        Math.max(0, metrics.totalHeight - strokeWidth),
        0,
      );
      ctx.restore();
    }

    function drawRisingstonesFittedText(ctx, metrics, text, area, options = {}) {
      const box = figmaRect(metrics, area);
      const clipBleedX = figmaUnit(metrics, options.clipBleedX || 0);
      const clipBleedY = figmaUnitY(metrics, options.clipBleedY || 0);
      const fitWidth = box.width + clipBleedX * 2;
      const clipBox = {
        x: box.x - clipBleedX,
        y: box.y - clipBleedY,
        width: box.width + clipBleedX * 2,
        height: box.height + clipBleedY * 2,
      };
      const value = String(text || "").trim();
      if (!value) {
        return;
      }
      const maxSize = figmaUnit(metrics, options.maxSize || area.maxSize || 60);
      const minSize = figmaUnit(metrics, options.minSize || area.minSize || 24);
      const weight = Number(options.weight || 700);
      const family = options.fontFamily || "'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif";
      let size = maxSize;
      while (size > minSize) {
        ctx.font = `${weight} ${size}px ${family}`;
        if (ctx.measureText(value).width <= fitWidth) {
          break;
        }
        size -= 1;
      }
      ctx.save();
      ctx.fillStyle = options.color || RISINGSTONES_TEMPLATE.textColor;
      ctx.textAlign = options.align || "left";
      ctx.textBaseline = options.baseline || "middle";
      ctx.font = `${weight} ${size}px ${family}`;
      const drawX = options.align === "center" ? box.x + box.width / 2 : box.x;
      const drawY = options.baseline === "top" ? box.y : box.y + box.height / 2;
      drawClippedTextInBox(ctx, value, clipBox, drawX, drawY);
      ctx.restore();
    }

    function drawRisingstonesHeader(ctx, metrics) {
      const layout = RISINGSTONES_TEMPLATE;
      drawRisingstonesAvatar(ctx, metrics);
      drawRisingstonesFittedText(ctx, metrics, getRisingstonesTitleText(), layout.title, {
        maxSize: layout.title.maxSize,
        minSize: layout.title.minSize,
        weight: 700,
        clipBleedX: 120,
        clipBleedY: 42,
      });
      drawRisingstonesFittedText(ctx, metrics, getRisingstonesAuthorText(), layout.author, {
        maxSize: layout.author.maxSize,
        minSize: layout.author.minSize,
        weight: 700,
        clipBleedX: 32,
        clipBleedY: 28,
      });
      drawRisingstonesFittedText(ctx, metrics, getRisingstonesSourceText(), layout.source, {
        maxSize: layout.source.maxSize,
        minSize: layout.source.minSize,
        weight: 700,
        clipBleedX: 48,
        clipBleedY: 28,
      });
      if (layout.showMeta) {
        const values = getRisingstonesMetaValues();
        (layout.meta || []).forEach((meta) => {
          drawRisingstonesFittedText(ctx, metrics, values[meta.key], meta, {
            maxSize: 60,
            minSize: 28,
            weight: 700,
            align: meta.key === "id" ? "left" : "center",
          });
        });
      }
    }

    function drawRisingstonesAvatar(ctx, metrics) {
      const layout = RISINGSTONES_TEMPLATE;
      const box = figmaRect(metrics, layout.avatarRegion);
      const radius = figmaUnit(metrics, layout.avatarRadius || 0);
      const strokeWidth = figmaUnit(metrics, layout.avatarStrokeWidth || 0);
      const image = getTemplateImageSlot(RISINGSTONES_AVATAR_SLOT_ID).image;

      ctx.save();
      makeRoundedRectPath(ctx, box.x, box.y, box.width, box.height, radius);
      ctx.clip();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(box.x, box.y, box.width, box.height);
      if (image) {
        drawImageCover(ctx, image, box.x, box.y, box.width, box.height, {
          showPlaceholderFill: false,
          showPlaceholderText: false,
        });
      }
      ctx.restore();

      if (strokeWidth > 0) {
        ctx.save();
        const inset = strokeWidth / 2;
        ctx.strokeStyle = layout.borderColor || layout.accent;
        ctx.lineWidth = strokeWidth;
        makeRoundedRectPath(
          ctx,
          box.x + inset,
          box.y + inset,
          Math.max(0, box.width - strokeWidth),
          Math.max(0, box.height - strokeWidth),
          Math.max(0, radius - inset),
        );
        ctx.stroke();
        ctx.restore();
      }
    }

    function getRisingstonesScaledValue(layout, key, scale = 1) {
      return Number(layout[key] || 0) * scale;
    }

    function getRisingstonesEquipmentScale(rowCount, layout) {
      if (rowCount <= 0) {
        return 1;
      }
      const naturalBottom = layout.rowStartY + (rowCount - 1) * layout.rowStep + layout.rowHeight;
      const maxBottom = Number(layout.rowBottom || (RISINGSTONES_TEMPLATE.imageRegion.y + RISINGSTONES_TEMPLATE.imageRegion.height));
      if (naturalBottom <= maxBottom) {
        return 1;
      }
      const availableHeight = Math.max(1, maxBottom - layout.rowStartY);
      const naturalHeight = (rowCount - 1) * layout.rowStep + layout.rowHeight;
      return Math.max(0.42, Math.min(1, availableHeight / naturalHeight));
    }

    function getRisingstonesRowY(index, layout, scale) {
      return layout.rowStartY + index * layout.rowStep * scale;
    }

    function getRisingstonesIconCenterY(rowY, layout, scale) {
      return rowY + getRisingstonesScaledValue(layout, "iconYOffset", scale) + getRisingstonesScaledValue(layout, "iconSize", scale) / 2;
    }

    function getRisingstonesTextInkCenterBaseline(ctx, text, boxCenterY) {
      const metrics = ctx.measureText(text || "Ag");
      const ascent = Number(metrics.actualBoundingBoxAscent || 0);
      const descent = Number(metrics.actualBoundingBoxDescent || 0);
      if (ascent || descent) {
        return boxCenterY + (ascent - descent) / 2;
      }
      return boxCenterY;
    }

    function drawRisingstonesIcon(ctx, metrics, row, rowY, layout, scale = 1) {
      const iconX = figmaUnit(metrics, layout.iconX);
      const iconY = figmaUnit(metrics, rowY + getRisingstonesScaledValue(layout, "iconYOffset", scale));
      const iconSize = figmaUnit(metrics, getRisingstonesScaledValue(layout, "iconSize", scale));
      const iconRadius = figmaUnit(metrics, getRisingstonesScaledValue(layout, "iconRadius", scale));
      const iconImage = iconImageCache.get(buildIconUrl(row.item?.icon));

      ctx.save();
      makeRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius);
      ctx.clip();
      ctx.fillStyle = "#eeeeee";
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      if (iconImage && !(iconImage instanceof Promise)) {
        drawImageCover(ctx, iconImage, iconX, iconY, iconSize, iconSize, { showPlaceholderText: false });
      }
      ctx.restore();
    }

    function drawRisingstonesDyeChip(ctx, metrics, rowY, dye, dyeIndex, layout, locale, scale = 1, dyeY = null) {
      const spec = layout.dyes[dyeIndex];
      if (!spec) {
        return;
      }
      const x = figmaUnit(metrics, spec.x);
      const y = figmaUnit(metrics, dyeY ?? (rowY + getRisingstonesScaledValue(layout, "dyeYOffset", scale)));
      const minWidth = figmaUnit(metrics, Number(spec.minWidth || 0) * scale);
      const height = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeHeight", scale));
      const textY = figmaUnit(metrics, rowY + getRisingstonesScaledValue(layout, "dyeTextYOffset", scale));
      const textHeight = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeTextHeight", scale) || getRisingstonesScaledValue(layout, "dyeHeight", scale));
      const dotSize = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeDotSize", scale));
      const dotX = x + figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeDotXOffset", scale));
      const dotY = y + (height - dotSize) / 2;
      const textX = x + figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeTextXOffset", scale));
      const textWidth = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeTextWidth", scale));
      const name = normalizeFigmaDyeName(dye.name);
      const isEmptyDye = dye.isEmpty || name === FIGMA_EMPTY_DYE_NAME;
      const label = getEcDyeLabel(dye, locale);

      ctx.fillStyle = isEmptyDye ? "#d4d4d4" : normalizeHexColor(dye.hex, "#98cce0");
      fillRoundedRect(ctx, dotX, dotY, dotSize, dotSize, figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeDotRadius", scale)));
      const dotStrokeWidth = Math.max(1, figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeDotStrokeWidth", scale)));
      if (dotStrokeWidth > 0) {
        ctx.save();
        const inset = dotStrokeWidth / 2;
        ctx.strokeStyle = RISINGSTONES_TEMPLATE.borderColor || RISINGSTONES_TEMPLATE.accent;
        ctx.lineWidth = dotStrokeWidth;
        makeRoundedRectPath(
          ctx,
          dotX + inset,
          dotY + inset,
          Math.max(0, dotSize - dotStrokeWidth),
          Math.max(0, dotSize - dotStrokeWidth),
          Math.max(0, figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeDotRadius", scale)) - inset),
        );
        ctx.stroke();
        ctx.restore();
      }

      let fontSize = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeFontSize", scale));
      const minSize = figmaUnit(metrics, getRisingstonesScaledValue(layout, "dyeMinFontSize", scale));
      while (fontSize > minSize) {
        ctx.font = `300 ${fontSize}px 'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
        if (ctx.measureText(label).width <= textWidth) {
          break;
        }
        fontSize -= 1;
      }
      ctx.fillStyle = RISINGSTONES_TEMPLATE.dyeText;
      ctx.textAlign = "center";
      ctx.textBaseline = "alphabetic";
      ctx.font = `300 ${fontSize}px 'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      drawClippedTextInBox(
        ctx,
        label,
        { x: textX, y: textY, width: textWidth, height: textHeight },
        textX + textWidth / 2,
        getRisingstonesTextInkCenterBaseline(ctx, label, textY + textHeight / 2),
      );
    }

    function drawRisingstonesEquipment(ctx, metrics) {
      const template = TEMPLATE_DEFINITIONS.risingstones;
      const locale = getSelectedTemplateLocales()[0] || state.locale || DEFAULT_LOCALE;
      const layout = RISINGSTONES_TEMPLATE.equipment;
      const rows = buildTemplateEquipmentRows(template, locale).slice(0, layout.maxRows);
      const equipmentScale = getRisingstonesEquipmentScale(rows.length, layout);
      rows.forEach((row, index) => {
        const rowY = getRisingstonesRowY(index, layout, equipmentScale);
        drawRisingstonesIcon(ctx, metrics, row, rowY, layout, equipmentScale);

        const dyes = ACCESSORY_SLOTS.has(row.slot) ? [] : getTemplateDisplayDyeEntries(row, locale, getTemplateDyeFormat(template));
        const iconCenterY = getRisingstonesIconCenterY(rowY, layout, equipmentScale);
        const nameCenterY = dyes.length
          ? rowY + getRisingstonesScaledValue(layout, "nameYOffset", equipmentScale) + getRisingstonesScaledValue(layout, "nameHeight", equipmentScale) / 2
          : iconCenterY;
        const dyeY = rowY + getRisingstonesScaledValue(layout, "dyeYOffset", equipmentScale);

        const nameX = figmaUnit(metrics, layout.nameX);
        const nameY = figmaUnit(metrics, nameCenterY);
        const nameWidth = figmaUnit(metrics, layout.nameWidth);
        ctx.fillStyle = RISINGSTONES_TEMPLATE.textColor;
        ctx.textAlign = "left";
        drawEcFittedItemName(ctx, metrics, row.itemName ?? getItemName(row.item, locale), nameX, nameY, nameWidth, {
          ...layout,
          nameSize: getRisingstonesScaledValue(layout, "nameSize", equipmentScale),
          nameMinSize: getRisingstonesScaledValue(layout, "nameMinSize", equipmentScale),
          inkCenter: true,
        });

        dyes.slice(0, 2).forEach((dye, dyeIndex) => {
          drawRisingstonesDyeChip(ctx, metrics, rowY, dye, dyeIndex, layout, locale, equipmentScale, dyeY);
        });
      });
    }

    function drawRisingstonesCopyright(ctx, metrics) {
      const box = figmaRect(metrics, RISINGSTONES_TEMPLATE.copyright);
      ctx.save();
      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `700 ${figmaUnit(metrics, 34)}px 'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(RISINGSTONES_TEMPLATE.copyright.lines[0], box.x + box.width / 2, box.y + figmaUnit(metrics, 30), box.width);
      ctx.font = `700 ${figmaUnit(metrics, 32)}px 'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(RISINGSTONES_TEMPLATE.copyright.lines[1], box.x + box.width / 2, box.y + figmaUnit(metrics, 76), box.width);
      ctx.restore();
    }

    function renderRisingstonesTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = RISINGSTONES_TEMPLATE.background;
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      drawRisingstonesBackgroundStroke(ctx, metrics);
      drawRisingstonesImage(ctx, metrics);
      drawRisingstonesHeader(ctx, metrics);
      drawRisingstonesEquipment(ctx, metrics);
      drawRisingstonesCopyright(ctx, metrics);
    }

    return {
      renderRisingstonesTemplateCanvas,
    };
  }

  window.NSGlamourRisingstonesTemplateRenderer = {
    createRisingstonesTemplateRenderer,
  };
})();
