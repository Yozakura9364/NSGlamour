(function () {
  "use strict";

  function createTemplateRenderProfiles(deps = {}) {
    const {
      loadFigmaTemplateBackground,
      loadHorizontalTemplateBackground,
      loadSilenceFashionBackground,
      loadDoublePicLeftMask,
      loadStoryTemplateLeftMask,
      renderFigmaCanvas,
      renderHorizontalTemplateCanvas,
      renderEcTemplateCanvas,
      renderDoublePicTemplateCanvas,
      renderStoryTemplateCanvas,
      renderRisingstonesTemplateCanvas,
      renderSilenceFashionTemplateCanvas,
    } = deps;

    const requiredDeps = {
      loadFigmaTemplateBackground,
      loadHorizontalTemplateBackground,
      loadSilenceFashionBackground,
      loadDoublePicLeftMask,
      loadStoryTemplateLeftMask,
      renderFigmaCanvas,
      renderHorizontalTemplateCanvas,
      renderEcTemplateCanvas,
      renderDoublePicTemplateCanvas,
      renderStoryTemplateCanvas,
      renderRisingstonesTemplateCanvas,
      renderSilenceFashionTemplateCanvas,
    };
    const missing = Object.entries(requiredDeps)
      .filter(([, value]) => typeof value !== "function")
      .map(([key]) => key);
    if (missing.length) {
      throw new Error(`createTemplateRenderProfiles missing dependencies: ${missing.join(", ")}`);
    }

    const TEMPLATE_RENDER_PROFILES = {
      eorzea: {
        defaultTopText: "幻化存档",
        loadAssets: () => [loadFigmaTemplateBackground()],
        renderCanvas: renderFigmaCanvas,
      },
      horizontal: {
        defaultTopText: "EORZEA FASHION",
        legacyTopText: "TITLE",
        loadAssets: () => [loadHorizontalTemplateBackground()],
        renderCanvas: renderHorizontalTemplateCanvas,
      },
      ec: {
        defaultTopText: "EORZEA COLLECTION",
        legacyTopText: "Nightingale - No Title",
        forceIcons: true,
        renderCanvas: renderEcTemplateCanvas,
      },
      "double-pic": {
        defaultTopText: "幻化存档",
        loadAssets: () => [loadDoublePicLeftMask()],
        renderCanvas: renderDoublePicTemplateCanvas,
      },
      story: {
        defaultTopText: "幻化存档",
        loadAssets: () => [loadStoryTemplateLeftMask()],
        renderCanvas: renderStoryTemplateCanvas,
      },
      risingstones: {
        defaultTopText: "幻化存档",
        forceIcons: true,
        renderCanvas: renderRisingstonesTemplateCanvas,
      },
      "silence-fashion": {
        defaultTopText: "FIRSTLOOK",
        forceIcons: true,
        loadAssets: () => [loadSilenceFashionBackground()],
        renderCanvas: renderSilenceFashionTemplateCanvas,
      },
      default: {
        defaultTopText: "幻化存档",
        renderCanvas: renderFigmaCanvas,
      },
    };

    return TEMPLATE_RENDER_PROFILES;
  }

  window.NSGlamourTemplateRenderers = {
    createTemplateRenderProfiles,
  };
})();
