(function () {
  "use strict";

  function createSilenceFashionTemplateRenderer(deps = {}) {
    const {
      DEFAULT_IMAGE_SLOT_ID,
      SILENCE_FASHION_AVATAR_SLOT_ID,
      SILENCE_FASHION_TEMPLATE,
      TEMPLATE_DEFINITIONS,
      buildTemplateEquipmentRows,
      drawImageCover,
      figmaRect,
      figmaUnit,
      figmaUnitY,
      getItemName,
      getSilenceFashionBackground,
      getSelectedTemplateLocales,
      getTemplateDefaultTopText,
      getTemplateDisplayDyeEntries,
      getTemplateDyeText,
      getTemplateImageSlot,
      state,
    } = deps;

    function isEnJaMode() {
      const locales = getSelectedTemplateLocales();
      return locales.includes("ja") && locales.includes("en");
    }

    function getSerifFamily(locale) {
      return locale === "ko"
        ? (SILENCE_FASHION_TEMPLATE.koSerifFamily || SILENCE_FASHION_TEMPLATE.serifFamily)
        : SILENCE_FASHION_TEMPLATE.serifFamily;
    }

    function getSilenceFashionRows() {
      const template = TEMPLATE_DEFINITIONS["silence-fashion"];
      const mode = isEnJaMode() ? "enJa" : "zh";
      const locale = isEnJaMode() ? "ja" : (getSelectedTemplateLocales()[0] || state.locale || "zh");
      return buildTemplateEquipmentRows(template, locale, { maxRows: SILENCE_FASHION_TEMPLATE[mode].maxRows });
    }

    function drawTextFit(ctx, metrics, text, x, y, width, options = {}) {
      const value = String(text || "").trim();
      if (!value) return;
      const maxSize = figmaUnit(metrics, options.size || 40);
      const minSize = figmaUnit(metrics, options.minSize || Math.max(20, (options.size || 40) - 12));
      const weight = options.weight || 400;
      const family = options.family || SILENCE_FASHION_TEMPLATE.serifFamily;
      let size = maxSize;
      while (size > minSize) {
        ctx.font = `${weight} ${size}px ${family}`;
        if (ctx.measureText(value).width <= width) break;
        size -= 1;
      }
      ctx.font = `${weight} ${size}px ${family}`;
      ctx.fillText(value, x, y);
    }

    function splitTokenByWidth(ctx, token, width) {
      const lines = [];
      let line = "";
      for (const char of Array.from(String(token || ""))) {
        const next = `${line}${char}`;
        if (line && ctx.measureText(next).width > width) {
          lines.push(line);
          line = char;
        } else {
          line = next;
        }
      }
      if (line) {
        lines.push(line);
      }
      return lines;
    }

    function wrapCanvasText(ctx, text, width) {
      const tokens = String(text || "").trim().match(/[A-Za-z0-9]+(?:['’-][A-Za-z0-9]+)*\s*|\S/g) || [];
      const lines = [];
      let line = "";
      for (const token of tokens) {
        const next = `${line}${token}`;
        if (line && ctx.measureText(next).width > width) {
          lines.push(line);
          line = token;
          if (ctx.measureText(line).width > width) {
            lines.push(...splitTokenByWidth(ctx, line, width));
            line = "";
          }
        } else {
          line = next;
        }
      }
      if (line) {
        lines.push(line);
      }
      return lines;
    }

    function getEquipmentBottomY(metrics, layout) {
      const templateBottom = Number(SILENCE_FASHION_TEMPLATE.equipmentBottom || SILENCE_FASHION_TEMPLATE.sourceSize);
      const layoutBottom = Number(layout.bottom || templateBottom);
      return figmaUnitY(metrics, Math.min(templateBottom, layoutBottom));
    }

    function getEquipmentTextWidth(metrics, x, fallbackWidth) {
      const right = Number(SILENCE_FASHION_TEMPLATE.equipmentRight || 0);
      return right > 0 ? Math.max(1, figmaUnit(metrics, right) - x) : fallbackWidth;
    }

    function drawWrappedText(ctx, metrics, text, x, y, width, options = {}) {
      const value = String(text || "").trim();
      if (!value) {
        return { nextY: y, clipped: false };
      }
      const size = figmaUnit(metrics, options.size || 40);
      const lineHeight = figmaUnitY(metrics, options.lineHeight || Math.round((options.size || 40) * 1.2));
      const weight = options.weight || 400;
      const family = options.family || SILENCE_FASHION_TEMPLATE.serifFamily;
      const bottomY = Number.isFinite(options.bottomY) ? options.bottomY : Infinity;
      ctx.font = `${weight} ${size}px ${family}`;
      let cursorY = y;
      for (const line of wrapCanvasText(ctx, value, width)) {
        if (cursorY + lineHeight > bottomY) {
          return { nextY: cursorY, clipped: true };
        }
        ctx.fillText(line, x, cursorY);
        cursorY += lineHeight;
      }
      return { nextY: cursorY, clipped: false };
    }

    function drawSilenceFashionBackground(ctx, metrics) {
      const background = getSilenceFashionBackground();
      if (background) {
        ctx.drawImage(background, 0, 0, metrics.totalWidth, metrics.totalHeight);
        return;
      }
      ctx.fillStyle = "#f8f8f6";
      ctx.fillRect(0, 0, metrics.totalWidth, metrics.totalHeight);
    }

    function getCharacterText() {
      const configured = String(state.settings.characterName || "").trim();
      if (configured) {
        return configured;
      }
      return "";
    }

    function drawSilenceFashionText(ctx, metrics) {
      const t = SILENCE_FASHION_TEMPLATE;
      const family = getSerifFamily(isEnJaMode() ? "ja" : (getSelectedTemplateLocales()[0] || state.locale || "zh"));
      ctx.fillStyle = t.textColor;
      ctx.textAlign = "left";
      ctx.textBaseline = "top";
      const character = getCharacterText();
      if (character) {
        drawTextFit(ctx, metrics, character, figmaUnit(metrics, t.character.x), figmaUnitY(metrics, t.character.y), figmaUnit(metrics, t.character.width), {
          size: t.character.size,
          minSize: t.character.minSize,
          weight: t.character.weight,
          family,
        });
      }

      const title = state.settings.topText.trim() || getTemplateDefaultTopText(TEMPLATE_DEFINITIONS["silence-fashion"]);
      drawTextFit(ctx, metrics, title, figmaUnit(metrics, t.title.x), figmaUnitY(metrics, t.title.y), figmaUnit(metrics, t.title.width), {
        size: t.title.size,
        minSize: t.title.minSize,
        weight: t.title.weight,
        family,
      });
    }

    function drawSilenceFashionImages(ctx, metrics) {
      const mainBox = figmaRect(metrics, SILENCE_FASHION_TEMPLATE.imageRegion);
      drawImageCover(ctx, getTemplateImageSlot(DEFAULT_IMAGE_SLOT_ID).image, mainBox.x, mainBox.y, mainBox.width, mainBox.height, {
        showPlaceholderText: false,
        placeholderFillStyle: "#f3f3f3",
      });

      const avatarBox = figmaRect(metrics, SILENCE_FASHION_TEMPLATE.avatarRegion);
      const avatar = getTemplateImageSlot(SILENCE_FASHION_AVATAR_SLOT_ID).image;
      if (avatar) {
        drawImageCover(ctx, avatar, avatarBox.x, avatarBox.y, avatarBox.width, avatarBox.height, {
          showPlaceholderText: false,
          showPlaceholderFill: false,
        });
      }
    }

    function drawZhEquipment(ctx, metrics, rows) {
      const layout = SILENCE_FASHION_TEMPLATE.zh;
      const locale = getSelectedTemplateLocales()[0] || state.locale || "zh";
      const family = getSerifFamily(locale);
      const itemX = figmaUnit(metrics, layout.itemX);
      const dyeX = figmaUnit(metrics, layout.dyeX);
      const itemWidth = getEquipmentTextWidth(metrics, itemX, figmaUnit(metrics, layout.width));
      const dyeWidth = getEquipmentTextWidth(metrics, dyeX, figmaUnit(metrics, layout.width));
      let y = figmaUnitY(metrics, layout.y);
      const bottomY = getEquipmentBottomY(metrics, layout);
      ctx.fillStyle = SILENCE_FASHION_TEMPLATE.textColor;
      ctx.textBaseline = "top";
      for (const row of rows) {
        if (y >= bottomY) break;
        const itemResult = drawWrappedText(ctx, metrics, row.itemName, itemX, y, itemWidth, {
          size: layout.itemSize,
          lineHeight: layout.itemLineHeight,
          weight: layout.weight,
          family,
          bottomY,
        });
        if (itemResult.clipped) break;
        const dyeText = getTemplateDyeText(row.rawRow || row, locale, TEMPLATE_DEFINITIONS["silence-fashion"].equipmentFormat.dye);
        let contentBottom = itemResult.nextY;
        if (dyeText) {
          const dyeResult = drawWrappedText(ctx, metrics, dyeText, dyeX, Math.max(itemResult.nextY, y + figmaUnitY(metrics, layout.dyeYOffset)), dyeWidth, {
            size: layout.dyeSize,
            lineHeight: layout.dyeLineHeight,
            weight: layout.weight,
            family,
            bottomY,
          });
          if (dyeResult.clipped) break;
          contentBottom = dyeResult.nextY;
        }
        y = Math.max(y + figmaUnitY(metrics, layout.rowStep), contentBottom + figmaUnitY(metrics, layout.groupGap || 0));
      }
    }

    function drawEnJaEquipment(ctx, metrics, rows) {
      const layout = SILENCE_FASHION_TEMPLATE.enJa;
      const family = getSerifFamily("ja");
      const itemX = figmaUnit(metrics, layout.itemX);
      const dyeX = figmaUnit(metrics, layout.dyeX);
      const itemWidth = getEquipmentTextWidth(metrics, itemX, figmaUnit(metrics, layout.width));
      const dyeWidth = getEquipmentTextWidth(metrics, dyeX, figmaUnit(metrics, layout.width));
      let y = figmaUnitY(metrics, layout.y);
      const bottomY = getEquipmentBottomY(metrics, layout);
      const lineGap = figmaUnitY(metrics, layout.lineGap || 0);
      ctx.fillStyle = SILENCE_FASHION_TEMPLATE.textColor;
      ctx.textBaseline = "top";
      for (const row of rows) {
        if (y >= bottomY) break;
        const raw = row.rawRow || row;
        const jaResult = drawWrappedText(ctx, metrics, getItemName(raw.item, "ja"), itemX, y, itemWidth, {
          size: layout.jaSize,
          lineHeight: layout.jaLineHeight,
          weight: layout.weight,
          family,
          bottomY,
        });
        if (jaResult.clipped) break;
        const enResult = drawWrappedText(ctx, metrics, getItemName(raw.item, "en"), itemX, jaResult.nextY + lineGap, itemWidth, {
          size: layout.enSize,
          lineHeight: layout.enLineHeight,
          weight: layout.weight,
          family,
          bottomY,
        });
        if (enResult.clipped) break;
        const dyeText = getTemplateDisplayDyeEntries(raw, "en", TEMPLATE_DEFINITIONS["silence-fashion"].equipmentFormat.dye)
          .map((dye) => dye.name)
          .join(" / ");
        let contentBottom = enResult.nextY;
        if (dyeText) {
          const dyeResult = drawWrappedText(ctx, metrics, dyeText, dyeX, enResult.nextY + lineGap, dyeWidth, {
            size: layout.dyeSize,
            lineHeight: layout.dyeLineHeight,
            weight: layout.weight,
            family,
            bottomY,
          });
          if (dyeResult.clipped) break;
          contentBottom = dyeResult.nextY;
        }
        y = Math.max(y + figmaUnitY(metrics, layout.rowStep), contentBottom + figmaUnitY(metrics, layout.groupGap || 0));
      }
    }

    function renderSilenceFashionTemplateCanvas(ctx, metrics) {
      ctx.clearRect(0, 0, metrics.totalWidth, metrics.totalHeight);
      drawSilenceFashionBackground(ctx, metrics);
      drawSilenceFashionImages(ctx, metrics);
      drawSilenceFashionText(ctx, metrics);
      const rows = getSilenceFashionRows();
      if (isEnJaMode()) {
        drawEnJaEquipment(ctx, metrics, rows);
      } else {
        drawZhEquipment(ctx, metrics, rows);
      }
    }

    return {
      renderSilenceFashionTemplateCanvas,
    };
  }

  window.NSGlamourSilenceFashionTemplateRenderer = {
    createSilenceFashionTemplateRenderer,
  };
})();
