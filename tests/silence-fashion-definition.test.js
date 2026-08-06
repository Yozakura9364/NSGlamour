const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");

const source = fs.readFileSync("static/template-definitions.js", "utf8");
const context = { window: {} };
vm.runInNewContext(source, context);

const rect = { x: 0, y: 0, width: 1, height: 1 };
const { TEMPLATE_DEFINITIONS, TEMPLATE_SELECT_ORDER } =
  context.window.NSGlamourTemplateDefinitions.createTemplateDefinitions({
    appPath: (path) => path,
    DEFAULT_LOCALE: "zh",
    TEMPLATE_LOCALE_ORDER: ["zh", "tc"],
    EC_TEMPLATE_LOCALE_ORDER: ["en", "zh", "tc", "ja", "ko", "fr", "de"],
    HORIZONTAL_TEMPLATE_LOCALE_ORDER: ["zh", "tc", "en", "ja", "ko", "fr", "de"],
    FIGMA_SOURCE_SIZE: 3840,
    FIGMA_TEMPLATE_BACKGROUND_URL: "",
    FIGMA_IMAGE_REGION: rect,
    DEFAULT_IMAGE_SLOT_ID: "main",
    HORIZONTAL_TEMPLATE_SOURCE_WIDTH: 4846,
    HORIZONTAL_TEMPLATE_SOURCE_HEIGHT: 3635,
    HORIZONTAL_TEMPLATE_BACKGROUND_URL: "",
    HORIZONTAL_TEMPLATE_MAX_ROWS: 8,
    HORIZONTAL_TEMPLATE_IMAGE_SLOTS: [{ id: "horizontal-left", region: rect }],
    EC_TEMPLATE_SOURCE_SIZE: 3840,
    EC_TEMPLATE_IMAGE_REGION: rect,
    EC_TEMPLATE_LAYOUTS: { compact: { maxRows: 14 } },
    DOUBLE_PIC_TEMPLATE_PREVIEW_URL: "",
    STORY_TEMPLATE_SOURCE_SIZE: 2968,
    DOUBLE_PIC_SOURCE_WIDTH: 2968,
    DOUBLE_PIC_SOURCE_HEIGHT: 3958,
    STORY_TEMPLATE_IMAGE_SLOTS: [{ id: "story-left", region: rect }],
    RISINGSTONES_TEMPLATE_PREVIEW_URL: "",
    RISINGSTONES_TEMPLATE: { sourceSize: 3840, equipment: { maxRows: 10 }, imageRegion: rect, avatarRegion: rect },
    RISINGSTONES_AVATAR_SLOT_ID: "risingstones-avatar",
    SILENCE_FASHION_TEMPLATE: {
      sourceSize: 3000,
      bilingual: { maxRows: 6 },
      imageRegion: { x: 171, y: 126, width: 1545, height: 2748 },
      avatarRegion: { x: 2431, y: 176, width: 324, height: 324 },
    },
    SILENCE_FASHION_AVATAR_SLOT_ID: "silence-fashion-avatar",
  });

const template = TEMPLATE_DEFINITIONS["silence-fashion"];
assert.ok(template, "silence-fashion template should exist");
assert.equal(template.supportsBilingual, true);
assert.deepEqual(Array.from(template.localeOrder), ["zh", "tc", "en", "ja", "ko", "fr", "de"]);
assert.equal(template.controls.characterName, false);
assert.equal(template.controls.ecSubtitle, true);
assert.equal(template.imageSlots.length, 2);
assert.ok(TEMPLATE_SELECT_ORDER.includes("silence-fashion"));
assert.equal(TEMPLATE_DEFINITIONS.horizontal.supportsBilingual, true);
assert.equal(TEMPLATE_DEFINITIONS.ec.supportsBilingual, true);
assert.equal(TEMPLATE_DEFINITIONS.risingstones.supportsBilingual, true);
assert.equal(TEMPLATE_DEFINITIONS.eorzea.supportsBilingual, undefined);
assert.equal(TEMPLATE_DEFINITIONS.story.supportsBilingual, undefined);
