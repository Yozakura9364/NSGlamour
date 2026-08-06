(function () {
  "use strict";

  function createEcTemplateRenderer(deps = {}) {
    const {
      ACCESSORY_SLOTS,
      COPYRIGHT_END_YEAR,
      DEFAULT_IMAGE_SLOT_ID,
      DEFAULT_LOCALE,
      EC_ITEM_RARITY_COLORS,
      EC_TEMPLATE_COLORS,
      EC_TEMPLATE_COPYRIGHT,
      EC_TEMPLATE_CORNER_MARKS,
      EC_TEMPLATE_EQUIPMENT_HEADER,
      EC_TEMPLATE_LAYOUTS,
      EC_TEMPLATE_SUBTITLE,
      EC_TEMPLATE_TITLE,
      FIGMA_EMPTY_DYE_NAME,
      TEMPLATE_DEFINITIONS,
      buildIconUrl,
      buildTemplateEquipmentRows,
      drawEcFittedItemName,
      drawImageCover,
      drawTextWithTracking,
      figmaRect,
      figmaUnit,
      fillRoundedRect,
      formatEcSubtitleParts,
      getEcDyeLabel,
      getEcSubtitlePartsFromSettings,
      getItemName,
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateDisplayDyeEntries,
      getTemplateDisplayDyeEntriesForOutput,
      getTemplateDyeFormat,
      getTemplateImageSlot,
      getTemplateImageSlotDefinition,
      getTemplateImageSlotRect,
      iconImageCache,
      makeRoundedRectPath,
      measureTextWithTracking,
      normalizeEcSubtitlePart,
      normalizeEcSubtitleSymbol,
      normalizeFigmaDyeName,
      normalizeHexColor,
      isTemplateBilingualMode,
      state,
    } = deps;

    function drawEcCornerMark(ctx, metrics, mark, rotate = false) {
      const box = figmaRect(metrics, { x: mark.x, y: mark.y, width: mark.size, height: mark.size });
      const radius = figmaUnit(metrics, 17);
      const centerX = box.x + box.width / 2;
      const centerY = box.y + box.height / 2;
      ctx.save();
      ctx.translate(centerX, centerY);
      if (rotate) {
        ctx.rotate(Math.PI);
      }
      ctx.translate(-centerX, -centerY);
      ctx.fillStyle = EC_TEMPLATE_COLORS.accent;
      fillRoundedRect(ctx, box.x, box.y, box.width, box.height, radius);
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(centerX, box.y + figmaUnit(metrics, 18));
      ctx.lineTo(box.x + box.width - figmaUnit(metrics, 18), centerY);
      ctx.lineTo(centerX, box.y + box.height - figmaUnit(metrics, 18));
      ctx.lineTo(box.x + figmaUnit(metrics, 18), centerY);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = EC_TEMPLATE_COLORS.accent;
      ctx.beginPath();
      ctx.moveTo(centerX, box.y + figmaUnit(metrics, 30));
      ctx.lineTo(centerX + figmaUnit(metrics, 24), centerY);
      ctx.lineTo(centerX, box.y + box.height - figmaUnit(metrics, 30));
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    function drawEcFrame(ctx, metrics) {
      const lineHeight = Math.max(1, figmaUnit(metrics, 8));
      const bottomMark = EC_TEMPLATE_CORNER_MARKS[1];
      const bottomLineY = figmaUnit(metrics, bottomMark.y + bottomMark.size / 2) - lineHeight / 2;
      ctx.fillStyle = EC_TEMPLATE_COLORS.background;
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      ctx.fillStyle = EC_TEMPLATE_COLORS.accent;
      ctx.fillRect(0, figmaUnit(metrics, 91), metrics.totalWidth, lineHeight);
      ctx.fillRect(0, bottomLineY, metrics.totalWidth, lineHeight);
      drawEcCornerMark(ctx, metrics, EC_TEMPLATE_CORNER_MARKS[0], false);
      drawEcCornerMark(ctx, metrics, EC_TEMPLATE_CORNER_MARKS[1], true);
    }

    function drawEcMainImage(ctx, metrics) {
      const slot = getTemplateImageSlotDefinition(DEFAULT_IMAGE_SLOT_ID);
      const imageBox = getTemplateImageSlotRect(metrics, slot.id);
      const image = getTemplateImageSlot(slot.id).image;
      if (!image) {
        ctx.fillStyle = EC_TEMPLATE_COLORS.placeholder;
        ctx.fillRect(imageBox.x, imageBox.y, imageBox.width, imageBox.height);
        return;
      }
      drawImageCover(
        ctx,
        image,
        imageBox.x,
        imageBox.y,
        imageBox.width,
        imageBox.height,
        { showPlaceholderFill: false, showPlaceholderText: false },
      );
    }

    function getEcTitleText() {
      return String(state.settings.topText || "").trim() || getTemplateDefaultTopText(TEMPLATE_DEFINITIONS.ec);
    }

    function drawEcCenteredFittedText(ctx, metrics, text, area, options) {
      const box = figmaRect(metrics, area);
      const maxSize = figmaUnit(metrics, options.maxSize || area.maxSize || 80);
      const minSize = figmaUnit(metrics, options.minSize || area.minSize || 24);
      const tracking = Number(options.tracking || 0);
      const fontFamily = options.fontFamily;
      const weight = options.weight || 400;
      let size = maxSize;
      let trackingSize = 0;
      while (size >= minSize) {
        ctx.font = `${weight} ${size}px ${fontFamily}`;
        trackingSize = size * (tracking / 1000);
        if (measureTextWithTracking(ctx, text, trackingSize) <= box.width) {
          break;
        }
        size -= 1;
      }
      ctx.fillStyle = options.color;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      const measuredWidth = measureTextWithTracking(ctx, text, trackingSize);
      drawTextWithTracking(
        ctx,
        text,
        box.x + Math.max(0, (box.width - measuredWidth) / 2),
        box.y + box.height / 2,
        trackingSize,
        box.width,
      );
    }

    function drawEcSubtitle(ctx, metrics) {
      const parts = getEcSubtitlePartsFromSettings();
      const left = normalizeEcSubtitlePart(parts?.left);
      const symbol = normalizeEcSubtitleSymbol(parts?.symbol);
      const right = normalizeEcSubtitlePart(parts?.right);
      const shouldDrawSplit = Boolean(left && symbol && right && !parts?.full);
      if (!shouldDrawSplit) {
        const text = formatEcSubtitleParts(parts);
        if (!text) {
          return;
        }
        drawEcCenteredFittedText(ctx, metrics, text, EC_TEMPLATE_SUBTITLE, {
          fontFamily: "'Source Sans 3', 'Microsoft YaHei', sans-serif",
          weight: 400,
          color: EC_TEMPLATE_COLORS.text,
          maxSize: EC_TEMPLATE_SUBTITLE.maxSize,
          minSize: EC_TEMPLATE_SUBTITLE.minSize,
          tracking: 0,
        });
        return;
      }

      const box = figmaRect(metrics, EC_TEMPLATE_SUBTITLE);
      const maxSize = figmaUnit(metrics, EC_TEMPLATE_SUBTITLE.maxSize);
      const minSize = figmaUnit(metrics, EC_TEMPLATE_SUBTITLE.minSize);
      let size = maxSize;
      let measuredLeft = 0;
      let measuredSymbol = 0;
      let measuredRight = 0;
      let gap = 0;
      let totalWidth = 0;
      do {
        ctx.font = `400 ${size}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
        measuredLeft = ctx.measureText(left).width;
        measuredRight = ctx.measureText(right).width;
        ctx.font = `400 ${size}px 'NS Cambria', Cambria, serif`;
        measuredSymbol = ctx.measureText(symbol).width;
        gap = Math.round(size * 0.32);
        totalWidth = measuredLeft + measuredSymbol + measuredRight + gap * 2;
        size -= 1;
      } while (size >= minSize && totalWidth > box.width);

      const centerY = box.y + box.height / 2;
      let cursorX = box.x + Math.max(0, (box.width - totalWidth) / 2);
      ctx.fillStyle = EC_TEMPLATE_COLORS.text;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${size + 1}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(left, cursorX, centerY);
      cursorX += measuredLeft + gap;

      ctx.font = `400 ${size + 1}px 'NS Cambria', Cambria, serif`;
      ctx.fillText(symbol, cursorX, centerY);
      cursorX += measuredSymbol + gap;

      ctx.fillStyle = EC_TEMPLATE_COLORS.text;
      ctx.font = `400 ${size + 1}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(right, cursorX, centerY);
    }

    function drawEcHeader(ctx, metrics) {
      drawEcCenteredFittedText(ctx, metrics, getEcTitleText(), EC_TEMPLATE_TITLE, {
        fontFamily: "'Josefin Sans', sans-serif",
        weight: 400,
        color: EC_TEMPLATE_COLORS.accent,
        maxSize: EC_TEMPLATE_TITLE.maxSize,
        minSize: EC_TEMPLATE_TITLE.minSize,
        tracking: EC_TEMPLATE_TITLE.tracking,
      });
      drawEcSubtitle(ctx, metrics);

      const labelBox = figmaRect(metrics, EC_TEMPLATE_EQUIPMENT_HEADER.label);
      ctx.fillStyle = EC_TEMPLATE_COLORS.accent;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      ctx.font = `700 ${figmaUnit(metrics, EC_TEMPLATE_EQUIPMENT_HEADER.labelSize)}px 'Source Sans 3', sans-serif`;
      ctx.fillText("EQUIPMENT", labelBox.x, labelBox.y, labelBox.width);

      const lineBox = figmaRect(metrics, EC_TEMPLATE_EQUIPMENT_HEADER.line);
      const lineGap = figmaUnit(metrics, EC_TEMPLATE_EQUIPMENT_HEADER.labelLineGap);
      const dynamicLineX = Math.max(lineBox.x, labelBox.x + ctx.measureText("EQUIPMENT").width + lineGap);
      const dynamicLineWidth = Math.max(0, lineBox.x + lineBox.width - dynamicLineX);
      ctx.fillStyle = EC_TEMPLATE_COLORS.line;
      fillRoundedRect(ctx, dynamicLineX, lineBox.y, dynamicLineWidth, Math.max(1, lineBox.height), lineBox.height / 2);
    }

    function drawEcIcon(ctx, metrics, row, layout, rowY) {
      const iconX = figmaUnit(metrics, layout.iconX);
      const iconY = figmaUnit(metrics, rowY + layout.iconYOffset);
      const iconSize = figmaUnit(metrics, layout.iconSize);
      const iconRadius = figmaUnit(metrics, layout.iconRadius);
      const iconImage = iconImageCache.get(buildIconUrl(row.item?.icon));

      ctx.save();
      makeRoundedRectPath(ctx, iconX, iconY, iconSize, iconSize, iconRadius);
      ctx.clip();
      ctx.fillStyle = "#1f1f1f";
      ctx.fillRect(iconX, iconY, iconSize, iconSize);
      if (iconImage && !(iconImage instanceof Promise)) {
        drawImageCover(ctx, iconImage, iconX, iconY, iconSize, iconSize, { showPlaceholderText: false });
      } else {
        ctx.fillStyle = "#343434";
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
      }
      ctx.restore();
    }

    function getEcVisibleDyeEntries(row, locale = state.locale) {
      const raw = row?.rawRow || row;
      return isTemplateBilingualMode()
        ? getTemplateDisplayDyeEntriesForOutput(raw, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.ec))
        : row?.dyes ?? getTemplateDisplayDyeEntries(raw, locale, getTemplateDyeFormat(TEMPLATE_DEFINITIONS.ec));
    }

    function getEcVariantLabel(row) {
      return String(row?.item?.ec_variant_label || "").trim();
    }

    function makeEcVariantEntry(row) {
      const label = getEcVariantLabel(row);
      return label ? { name: label, hex: "#a6adb4", isEmpty: false, isEcVariant: true } : null;
    }

    function getEcItemNameColor(row) {
      const rarity = Number(row?.item?.rarity || 1);
      return EC_ITEM_RARITY_COLORS[rarity] || EC_ITEM_RARITY_COLORS[1];
    }

    function getEcItemNameCenterY(rowBox, metrics, rowY, dyes, layout) {
      if (!dyes.length) {
        return rowBox.y + rowBox.height / 2;
      }
      const rowCenterY = rowY + layout.rowHeight / 2;
      const dyeCenterY = rowY + layout.dyeYOffset + layout.dyeHeight / 2;
      return figmaUnit(metrics, (rowCenterY * 2) - dyeCenterY);
    }

    function drawEcDyeChip(ctx, metrics, rowY, dye, dyeIndex, layout, locale, options = {}) {
      const spec = layout.dyes[dyeIndex];
      if (!spec) {
        return null;
      }
      const label = getEcDyeLabel(dye, locale);
      const isEmptyDye = dye.isEmpty || normalizeFigmaDyeName(dye.name) === FIGMA_EMPTY_DYE_NAME;
      const centerY = Number.isFinite(options.centerY) ? options.centerY : null;
      const y = figmaUnit(metrics, centerY != null ? centerY - layout.dyeHeight / 2 : rowY + layout.dyeYOffset);
      const height = figmaUnit(metrics, layout.dyeHeight);
      const dotSize = figmaUnit(metrics, layout.dyeDotSize);
      const fontSize = figmaUnit(metrics, options.fontSize || layout.dyeFontSize);
      const fontWeight = Number(options.fontWeight || 400);
      const leftPadding = figmaUnit(metrics, layout.dyeTextXOffset);
      const rightPadding = figmaUnit(metrics, layout.dyeTextRightPadding || 34);
      const minWidth = Math.max(leftPadding + rightPadding, figmaUnit(metrics, layout.dyeDotXOffset) + dotSize + rightPadding);
      const gap = figmaUnit(metrics, layout.dyeGap || 34);
      const baseX = figmaUnit(metrics, spec.x);
      const previousRight = Number(options.previousRight || 0);
      const x = previousRight ? previousRight + gap : baseX;
      const dotX = x + figmaUnit(metrics, layout.dyeDotXOffset);
      const dotY = y + (height - dotSize) / 2;
      const textX = x + leftPadding;

      ctx.font = `${fontWeight} ${fontSize}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      const measuredWidth = Math.max(minWidth, ctx.measureText(label).width + leftPadding + rightPadding);
      const width = options.maxWidth ? Math.min(measuredWidth, options.maxWidth) : measuredWidth;

      ctx.fillStyle = EC_TEMPLATE_COLORS.rowDeep;
      fillRoundedRect(ctx, x, y, width, height, figmaUnit(metrics, layout.dyeRadius));

      ctx.fillStyle = isEmptyDye ? "#596069" : normalizeHexColor(dye.hex, "#89b8dc");
      ctx.beginPath();
      ctx.arc(dotX + dotSize / 2, dotY + dotSize / 2, dotSize / 2, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = options.textColor || EC_TEMPLATE_COLORS.textDim;
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      ctx.fillText(label, textX, y + height / 2, Math.max(1, width - leftPadding - rightPadding));
      return { x, y, width, height, right: x + width };
    }

    function drawEcEquipmentRow(ctx, metrics, row, index, layout, locale) {
      const rowY = layout.rowY[index];
      const rowBox = figmaRect(metrics, {
        x: layout.rowX,
        y: rowY,
        width: layout.rowWidth,
        height: layout.rowHeight,
      });
      ctx.fillStyle = EC_TEMPLATE_COLORS.row;
      fillRoundedRect(ctx, rowBox.x, rowBox.y, rowBox.width, rowBox.height, figmaUnit(metrics, layout.rowRadius));
      drawEcIcon(ctx, metrics, row, layout, rowY);

      const ecVariant = row.slot === "Glasses" ? makeEcVariantEntry(row) : null;
      const dyes = ecVariant
        ? [ecVariant]
        : ACCESSORY_SLOTS.has(row.slot)
          ? []
          : getEcVisibleDyeEntries(row, locale);
      const itemLocales = getSelectedTemplateLocales();
      const itemNames = itemLocales
        .map((itemLocale) => getItemName(row.item, itemLocale))
        .filter((name, nameIndex, names) => name && names.indexOf(name) === nameIndex);
      const itemName = itemNames[0] || row.itemName || getItemName(row.item, locale);
      const nameX = figmaUnit(metrics, layout.nameX);
      const nameWidth = figmaUnit(metrics, layout.nameWidth);
      ctx.fillStyle = getEcItemNameColor(row);
      ctx.textAlign = "left";
      ctx.textBaseline = "middle";
      let bilingualDyeCenterY = null;
      if (isTemplateBilingualMode() && itemNames.length > 1) {
        const nameLayout = {
          ...layout,
          nameSize: Math.max(Math.round(layout.dyeFontSize * 1.2), Math.round(layout.nameSize * 0.9)),
          nameMinSize: Math.max(layout.dyeFontSize, layout.nameMinSize),
        };
        const iconCenterY = rowY + layout.iconYOffset + layout.iconSize / 2;
        const lineStep = layout.iconSize * 0.36;
        const primaryCenterY = dyes.length
          ? iconCenterY - lineStep
          : iconCenterY - lineStep / 2;
        const secondaryCenterY = dyes.length
          ? iconCenterY
          : iconCenterY + lineStep / 2;
        bilingualDyeCenterY = dyes.length ? iconCenterY + lineStep : null;
        drawEcFittedItemName(ctx, metrics, itemName, nameX, figmaUnit(metrics, primaryCenterY), nameWidth, nameLayout);
        drawEcFittedItemName(ctx, metrics, itemNames[1], nameX, figmaUnit(metrics, secondaryCenterY), nameWidth, nameLayout);
      } else {
        const nameCenterY = getEcItemNameCenterY(rowBox, metrics, rowY, dyes, layout);
        drawEcFittedItemName(ctx, metrics, itemName, nameX, nameCenterY, nameWidth, layout);
      }
      let dyeRight = 0;
      const dyeGap = figmaUnit(metrics, layout.dyeGap || 34);
      const dyeStartX = figmaUnit(metrics, layout.dyes[0]?.x || layout.nameX);
      const dyeMaxRight = figmaUnit(metrics, layout.rowX + layout.rowWidth - 24);
      const maxChipWidth = isTemplateBilingualMode() && dyes.length
        ? Math.max(1, (dyeMaxRight - dyeStartX - dyeGap * (dyes.length - 1)) / dyes.length)
        : null;
      dyes.forEach((dye, dyeIndex) => {
        const chip = drawEcDyeChip(ctx, metrics, rowY, dye, dyeIndex, layout, locale, {
          previousRight: dyeRight,
          maxWidth: maxChipWidth,
          centerY: bilingualDyeCenterY,
          fontSize: bilingualDyeCenterY != null ? Math.round(layout.dyeFontSize * 1.1) : null,
          fontWeight: bilingualDyeCenterY != null ? 500 : null,
          textColor: bilingualDyeCenterY != null ? EC_TEMPLATE_COLORS.text : null,
        });
        dyeRight = chip?.right || dyeRight;
      });
    }

    function getEcEquipmentLayout(rowCount) {
      if (rowCount > EC_TEMPLATE_LAYOUTS.dense.maxRows) {
        return EC_TEMPLATE_LAYOUTS.compact;
      }
      if (rowCount > EC_TEMPLATE_LAYOUTS.normal.maxRows) {
        return EC_TEMPLATE_LAYOUTS.dense;
      }
      return EC_TEMPLATE_LAYOUTS.normal;
    }

    function getEcBilingualEquipmentLayout(layout, rowCount) {
      if (rowCount <= 1 || layout.rowY.length <= 1) {
        return layout;
      }
      const firstY = layout.rowY[0];
      const baseStep = layout.rowY[1] - firstY;
      const availableBottom = layout.rowY[layout.rowY.length - 1] + layout.rowHeight;
      const maxStep = (availableBottom - firstY - layout.rowHeight) / (rowCount - 1);
      const rowStep = Math.min(baseStep + 28, maxStep);
      return {
        ...layout,
        rowY: Array.from({ length: rowCount }, (_, index) => firstY + index * rowStep),
      };
    }

    function drawEcEquipment(ctx, metrics) {
      const locale = getSelectedTemplateLocales()[0] || state.locale || DEFAULT_LOCALE;
      const allRows = buildTemplateEquipmentRows(TEMPLATE_DEFINITIONS.ec, locale);
      const baseLayout = getEcEquipmentLayout(allRows.length);
      const rows = allRows.slice(0, baseLayout.maxRows);
      const layout = isTemplateBilingualMode()
        ? getEcBilingualEquipmentLayout(baseLayout, rows.length)
        : baseLayout;
      if (!rows.length) {
        return;
      }
      rows.forEach((row, index) => {
        drawEcEquipmentRow(ctx, metrics, row, index, layout, locale);
      });
    }

    function drawEcCopyright(ctx, metrics) {
      const box = figmaRect(metrics, EC_TEMPLATE_COPYRIGHT);
      const copyrightLines = [
        `Eorzea Collection © 2016-${COPYRIGHT_END_YEAR}.`,
        `FINAL FANTASY XIV © 2010-${COPYRIGHT_END_YEAR} SQUARE ENIX CO., LTD. All Rights Reserved.`,
      ];
      ctx.fillStyle = EC_TEMPLATE_COLORS.accent;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.font = `400 ${figmaUnit(metrics, EC_TEMPLATE_COPYRIGHT.titleSize)}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(copyrightLines[0], box.x + box.width / 2, box.y + figmaUnit(metrics, EC_TEMPLATE_COPYRIGHT.lineY[0]), box.width);
      ctx.font = `400 ${figmaUnit(metrics, EC_TEMPLATE_COPYRIGHT.textSize)}px 'Source Sans 3', 'Microsoft YaHei', sans-serif`;
      ctx.fillText(copyrightLines[1], box.x + box.width / 2, box.y + figmaUnit(metrics, EC_TEMPLATE_COPYRIGHT.lineY[1]), box.width);
    }

    function renderEcTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      drawEcFrame(ctx, metrics);
      drawEcMainImage(ctx, metrics);
      drawEcHeader(ctx, metrics);
      drawEcEquipment(ctx, metrics);
      drawEcCopyright(ctx, metrics);
    }

    return {
      renderEcTemplateCanvas,
    };
  }

  window.NSGlamourEcTemplateRenderer = {
    createEcTemplateRenderer,
  };
})();
