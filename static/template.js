const templateSourceName = document.getElementById("templateSourceName");
const templateEditor = document.getElementById("templateEditor");
const templateEditorRowTemplate = document.getElementById("templateEditorRowTemplate");
const templateStatus = document.getElementById("templateStatus");
const templateLanguageControls = document.getElementById("templateLanguageControls");
const templateLanguageSettings = document.getElementById("templateLanguageSettings");
const templateClearDraftButton = document.getElementById("templateClearDraftButton");
const templateImageInput = document.getElementById("templateImageInput");
const templateCanvas = document.getElementById("templateCanvas");
const templateCanvasShell = document.getElementById("templateCanvasShell");
const templateCanvasUploadLayer = document.getElementById("templateCanvasUploadLayer");
const templateExportCanvas = document.createElement("canvas");
const templateDownloadButton = document.getElementById("templateDownloadButton");
const templateLoadingOverlay = document.getElementById("templateLoadingOverlay");
const templateAuthor = document.getElementById("templateAuthor");
const templateSelectorOpenButton = document.getElementById("templateSelectorOpenButton");
const templateSelectorOverlay = document.getElementById("templateSelectorOverlay");
const templateSelectorCloseButton = document.getElementById("templateSelectorCloseButton");
const templateSelectorFilterControls = document.getElementById("templateSelectorFilterControls");
const templateSelectorControls = document.getElementById("templateSelectorControls");
const templateTopTextInput = document.getElementById("templateTopTextInput");
const templateEcSubtitleLeftInput = document.getElementById("templateEcSubtitleLeftInput");
const templateEcSubtitleSymbolInput = document.getElementById("templateEcSubtitleSymbolInput");
const templateEcSubtitleRightInput = document.getElementById("templateEcSubtitleRightInput");
const templateCharacterNameInput = document.getElementById("templateCharacterNameInput");
const templateDyeFrameControls = document.getElementById("templateDyeFrameControls");
const storySwatchControls = document.getElementById("storySwatchControls");
const templateCropOverlay = document.getElementById("templateCropOverlay");
const templateCropImage = document.getElementById("templateCropImage");
const templateCropZoomRange = document.getElementById("templateCropZoomRange");
const templateCropZoomInput = document.getElementById("templateCropZoomInput");
const templateCropResetButton = document.getElementById("templateCropResetButton");
const templateCropApplyButton = document.getElementById("templateCropApplyButton");
const templateCropCancelButton = document.getElementById("templateCropCancelButton");
const templateImportLinkButton = document.getElementById("templateImportLinkButton");
const templateImportOverlay = document.getElementById("templateImportOverlay");
const templateImportForm = document.getElementById("templateImportForm");
const templateImportUrlInput = document.getElementById("templateImportUrlInput");
const templateImportCloseButton = document.getElementById("templateImportCloseButton");
const templateImportSubmitButton = document.getElementById("templateImportSubmitButton");
const templateImportHint = document.getElementById("templateImportHint");
const templateRecentButton = document.getElementById("templateRecentButton");
const templateRecentPanel = document.getElementById("templateRecentPanel");
const templateRecentList = document.getElementById("templateRecentList");
const templateClearRecentButton = document.getElementById("templateClearRecentButton");
const themeToggleBtn = document.getElementById("themeToggleBtn");
const themeToggleIcon = document.getElementById("themeToggleIcon");

const APP_BASE_PATH = getAppBasePath();
const THEME_KEY = NSGlamourCommon.C.THEME_KEY;
const THEME_MESSAGE_TYPE = NSGlamourCommon.C.THEME_MESSAGE_TYPE;
const CARD_DRAFT_KEY = NSGlamourCommon.C.CARD_DRAFT_KEY;
const RECENT_CACHE_KEY = NSGlamourCommon.C.RECENT_CACHE_KEY;
const RECENT_CACHE_LIMIT = NSGlamourCommon.C.RECENT_CACHE_LIMIT;
const IGNORE_EMPEROR_KEY = "nsglamour.ignoreEmperor";
const TEMPLATE_SETTINGS_KEY = "nsglamour.templateWorkspaceSettings";
const TEMPLATE_IMAGE_SESSION_KEY = "nsglamour.templateImageSessionBackup.v2";
const TEMPLATE_IMAGE_LEGACY_SESSION_KEY = "nsglamour.templateImageSessionBackup.v1";
const DEFAULT_LOCALE = NSGlamourCommon.C.DEFAULT_LOCALE;
const ITEM_SEARCH_DEBOUNCE_MS = 120;
const LOCALE_ORDER = ["zh", "ja", "en", "ko", "tc", "fr", "de"];
const TEMPLATE_LOCALE_ORDER = ["zh", "tc"];
const EC_TEMPLATE_LOCALE_ORDER = ["en", "zh", "tc", "ja", "ko", "fr", "de"];
const HORIZONTAL_TEMPLATE_LOCALE_ORDER = ["zh", "tc", "en", "ja", "ko", "fr", "de"];
const TEMPLATE_LANGUAGE_MODE = "single";
const LOCALE_LABELS = { zh: "chs", en: "en", ja: "ja", ko: "ko", tc: "tc", fr: "fr", de: "de" };
const UI_LANGUAGE_TO_TEMPLATE_LOCALE = {
  "zh-CN": "zh",
  "zh-TW": "tc",
  en: "en",
  ja: "ja",
  ko: "ko",
  fr: "fr",
  de: "de",
};
const TEMPLATE_SELECTOR_FILTER_ALL = "all";
const TEMPLATE_AUTHOR_PREFIX = "模板作者：";
const ACCESSORY_SLOTS = NSGlamourCommon.C.ACCESSORY_SLOTS;
const WEAPON_SLOTS = NSGlamourCommon.C.WEAPON_SLOTS;
const ARMOR_SLOTS = NSGlamourCommon.C.ARMOR_SLOTS;
const TEMPLATE_DYE_POLICY = window.NSGlamourTemplateDyePolicy;
const TEMPLATE_DESIGN_HEIGHT = 720;
const FIGMA_SOURCE_SIZE = 3840;
const TEMPLATE_OUTPUT_HEIGHT = FIGMA_SOURCE_SIZE;
const CROP_ASPECT_RATIO = 9 / 16;
const DEFAULT_IMAGE_SLOT_ID = "main";
const RISINGSTONES_AVATAR_SLOT_ID = "risingstones-avatar";
const SILENCE_FASHION_AVATAR_SLOT_ID = "silence-fashion-avatar";
const TEMPLATE_IMAGE_SLOT_ALIASES = {
  [RISINGSTONES_AVATAR_SLOT_ID]: [SILENCE_FASHION_AVATAR_SLOT_ID],
  [SILENCE_FASHION_AVATAR_SLOT_ID]: [RISINGSTONES_AVATAR_SLOT_ID],
};
const FIGMA_TEMPLATE_ASPECT = "1:1";
const FIGMA_TEMPLATE_BACKGROUND_URL = appPath("/static/templates/eorzea-magazine.png?v=20260620-1");
const TEMPLATE_AUTHOR_PREVIEW_FALLBACK_URL = FIGMA_TEMPLATE_BACKGROUND_URL;
const FIGMA_IMAGE_REGION = { x: -1, y: 0, width: 1893, height: 3840 };
const DOUBLE_PIC_TEMPLATE_PREVIEW_URL = appPath("/static/templates/double-pic-template.svg?v=20260623-1");
const RISINGSTONES_TEMPLATE_PREVIEW_URL = appPath("/static/templates/risingstones-template.svg?v=20260623-1");
const SILENCE_FASHION_BACKGROUND_URL = appPath("/static/templates/silence-fashion-background.png?v=20260628-1");
const HORIZONTAL_TEMPLATE_SOURCE_WIDTH = 4846;
const HORIZONTAL_TEMPLATE_SOURCE_HEIGHT = 3635;
const HORIZONTAL_TEMPLATE_BACKGROUND_URL = appPath("/static/templates/eorzea-horizontal-magazine-bg.png?v=20260623-2");
const HORIZONTAL_TEMPLATE_TEXT_COLOR = "#383838";
const HORIZONTAL_TEMPLATE_LINE_COLORS = ["#d4d4d2", "#cdcdcd"];
const HORIZONTAL_TEMPLATE_MAX_ROWS = 8;
const HORIZONTAL_TEMPLATE_IMAGE_SLOTS = [
  {
    id: "horizontal-left",
    label: "图片1",
    uploadText: "上传图片",
    helperText: "",
    region: { x: 1917, y: 198, width: 1337, height: 3240 },
    aspectRatio: 1337 / 3240,
  },
  {
    id: "horizontal-right",
    label: "图片2",
    uploadText: "上传图片",
    helperText: "",
    region: { x: 3312, y: 198, width: 1336, height: 3240 },
    aspectRatio: 1336 / 3240,
  },
];
const HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT = {
  x: 178,
  y: 1092,
  width: 1648,
  height: 2184,
  itemSize: 86,
  dyeSize: 56,
  itemLineHeight: 90,
  dyeLineHeight: 68,
  itemInkHeight: 70,
  dyeInkHeight: 44,
  topPadding: 22,
  groupGap: 80,
};
const HORIZONTAL_TEMPLATE_TITLE = {
  x: 163,
  y: 897,
  width: 311,
  height: 92,
  size: 100,
  lineHeight: 112,
  clipBleedTop: 18,
  clipBleedBottom: 24,
};
const HORIZONTAL_TEMPLATE_TITLE_LINE = {
  x: 162,
  y: 1040,
  width: 1629,
  height: 4,
};
const HORIZONTAL_TEMPLATE_CONTENT_GROUP = {
  top: 830,
  bottom: 3436,
  titleToLine: HORIZONTAL_TEMPLATE_TITLE_LINE.y - HORIZONTAL_TEMPLATE_TITLE.y,
  titleToEquipment: HORIZONTAL_TEMPLATE_EQUIPMENT_TEXT.y - HORIZONTAL_TEMPLATE_TITLE.y,
};
const DOUBLE_PIC_SOURCE_WIDTH = 2968;
const DOUBLE_PIC_SOURCE_HEIGHT = 3958;
const STORY_TEMPLATE_SOURCE_SIZE = DOUBLE_PIC_SOURCE_WIDTH;
const STORY_TEMPLATE_LEFT_MASK_URL = appPath("/static/templates/story-left-mask.png?v=20260619-1");
const DOUBLE_PIC_LEFT_MASK_URL = appPath("/static/templates/double-pic-left-mask.png?v=20260624-1");
const STORY_TEMPLATE_IMAGE_ASPECT = 9 / 16;
const STORY_TEMPLATE_IMAGE_REGION_WIDTH = 2392;
const STORY_TEMPLATE_IMAGE_REGION_HEIGHT = STORY_TEMPLATE_IMAGE_REGION_WIDTH / STORY_TEMPLATE_IMAGE_ASPECT;
const STORY_TEMPLATE_IMAGE_REGION_Y = (STORY_TEMPLATE_SOURCE_SIZE - STORY_TEMPLATE_IMAGE_REGION_HEIGHT) / 2;
const STORY_TEMPLATE_BACKGROUND_COLOR = "#fefefe";
const STORY_TEMPLATE_FRAME_BLACK = "#000000";
const STORY_TEMPLATE_FRAME_WHITE = "#f8f8f8";
const STORY_TEMPLATE_WATERMARK_RECT = { x: 1695, y: 70, width: 1003, height: 53 };
const STORY_TEMPLATE_FONT_WEIGHT = 900;
const STORY_TEMPLATE_FONT_FAMILY = "'Source Han Serif CN', 'Noto Serif CJK SC', 'Microsoft YaHei', serif";
const STORY_TEMPLATE_WATERMARK_TEXT = "©SQUARE ENIX | PHOTOED BY @谣不可汲";
const DOUBLE_PIC_COPYRIGHT_TEXT = "©SQUARE ENIX";
const DOUBLE_PIC_COPYRIGHT_RECT = { x: 1090, y: 3868, width: 758, height: 72 };
const DOUBLE_PIC_COPYRIGHT_TEXT_STYLE = {
  maxFontSize: 48,
  minFontSize: 36,
};
const STORY_TEMPLATE_WATERMARK_TEXT_STYLE = {
  maxFontSize: 52,
  minFontSize: 34,
};
const STORY_TEMPLATE_EQUIPMENT_TEXT = {
  x: 1469,
  y: 3115,
  width: 1098,
  height: 676,
  maxFontSize: 62,
  minFontSize: 34,
  lineHeightRatio: 1.54,
  underlineOffsetRatio: 1.13,
  underlineWidth: 4,
  outerGlowColor: "#000000",
  outerGlowOpacity: 0.62,
  outerGlowSpread: 0.19,
  outerGlowSize: 24,
  outerGlowRange: 0.5,
};
const STORY_TEMPLATE_SWATCH_RECTS = [
  { x: 1883, y: 2927, width: 149, height: 149 },
  { x: 2123, y: 2927, width: 149, height: 149 },
  { x: 2363, y: 2927, width: 149, height: 149 },
];
const STORY_TEMPLATE_CIRCLE_FRAME = {
  blackWidth: 14,
  whiteWidth: 29,
};
const STORY_TEMPLATE_SWATCH_FRAME = {
  blackWidth: 15,
  whiteWidth: 6,
  radius: 18,
  colorRadius: 3,
};
const STORY_TEMPLATE_DEFAULT_SWATCH_COLORS = ["#40417a", "#eeeeee", "#968169"];
const STORY_TEMPLATE_IMAGE_SLOTS = [
  {
    id: "story-left",
    label: "图片1",
    uploadText: "上传图片",
    helperText: "",
    region: { x: 0, y: 0, width: 1646, height: DOUBLE_PIC_SOURCE_HEIGHT },
    uploadRegion: { x: 0, y: 0, width: 1646, height: DOUBLE_PIC_SOURCE_HEIGHT },
    aspectRatio: 1646 / DOUBLE_PIC_SOURCE_HEIGHT,
  },
  {
    id: "story-right",
    label: "图片2",
    uploadText: "上传图片",
    helperText: "",
    region: { x: 1292, y: 0, width: 1676, height: DOUBLE_PIC_SOURCE_HEIGHT },
    uploadRegion: { x: 1292, y: 0, width: 1676, height: DOUBLE_PIC_SOURCE_HEIGHT },
    aspectRatio: 1676 / DOUBLE_PIC_SOURCE_HEIGHT,
  },
];
const EC_TEMPLATE_SOURCE_SIZE = 3840;
const EC_TEMPLATE_IMAGE_REGION = { x: 200, y: 672, width: 1683, height: 2821 };
const EC_TEMPLATE_COLORS = {
  background: "#202020",
  row: "#282828",
  rowDeep: "#242424",
  accent: "#fb4b4e",
  text: "#c7c1bd",
  textDim: "#77716d",
  line: "#303030",
  placeholder: "#ffffff",
};
const EC_ITEM_RARITY_COLORS = {
  1: "#e8e8e8",
  2: "#c4ffc8",
  3: "#5c93ff",
  4: "#b78aff",
  7: "#e08abd",
};
const EC_TEMPLATE_TITLE = {
  x: 1010,
  y: 298,
  width: 1830,
  height: 185,
  maxSize: 178,
  minSize: 86,
  tracking: -20,
};
const EC_TEMPLATE_SUBTITLE = {
  x: 1413,
  y: 522,
  width: 1028,
  height: 77,
  maxSize: 66,
  minSize: 34,
};
const EC_TEMPLATE_SUBTITLE_SYMBOLS = ["♦", "◆", "◇", "⧫"];
const COPYRIGHT_BASE_END_YEAR = 2026;
const COPYRIGHT_END_YEAR = Math.max(COPYRIGHT_BASE_END_YEAR, new Date().getFullYear());
const EC_TEMPLATE_EQUIPMENT_HEADER = {
  label: { x: 2022, y: 696, width: 320, height: 50 },
  labelSize: 44,
  labelLineGap: 34,
  line: { x: 2264, y: 714, width: 1364, height: 9 },
};
const EC_TEMPLATE_COPYRIGHT = {
  x: 1110,
  y: 3584,
  width: 1606,
  height: 93,
  titleSize: 40,
  textSize: 36,
  lineY: [23, 68],
};
const EC_TEMPLATE_CORNER_MARKS = [
  { x: 99, y: 45, size: 104 },
  { x: 3639, y: 3692, size: 104 },
];
const EC_TEMPLATE_EQUIPMENT_SLOTS = [
  "MainHand",
  "OffHand",
  "HeadGear",
  "Body",
  "Hands",
  "Legs",
  "Feet",
  "Ears",
  "Neck",
  "Wrists",
  "LeftRing",
  "RightRing",
  "Glasses",
  "FashionAccessory",
];
const EC_TEMPLATE_LAYOUTS = {
  normal: {
    maxRows: 6,
    rowY: [802, 1065, 1328, 1591, 1854, 2117],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 246,
    rowRadius: 34,
    iconX: 2036,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 16,
    nameX: 2288,
    nameWidth: 1320,
    nameHeight: 68,
    nameSize: 64,
    nameMinSize: 48,
    nameWeight: 700,
    dyeYOffset: 127,
    dyeHeight: 88,
    dyeRadius: 38,
    dyeFontSize: 41,
    dyeDotSize: 39,
    dyeDotXOffset: 36,
    dyeTextXOffset: 95,
    dyeTextYOffset: 21,
    dyeGap: 34,
    dyes: [
      { x: 2288, minWidth: 256 },
      { x: 2612, minWidth: 286 },
    ],
  },
  dense: {
    maxRows: 10,
    rowY: [780, 1016, 1252, 1488, 1724, 1960, 2196, 2432, 2668, 2904],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 216,
    rowRadius: 30,
    iconX: 2034,
    iconYOffset: 20,
    iconSize: 176,
    iconRadius: 14,
    nameX: 2255,
    nameWidth: 1360,
    nameHeight: 60,
    nameSize: 56,
    nameMinSize: 42,
    nameWeight: 700,
    dyeYOffset: 112,
    dyeHeight: 77,
    dyeRadius: 33,
    dyeFontSize: 36,
    dyeDotSize: 34,
    dyeDotXOffset: 32,
    dyeTextXOffset: 84,
    dyeTextYOffset: 18,
    dyeGap: 34,
    dyes: [
      { x: 2255, minWidth: 256 },
      { x: 2612, minWidth: 286 },
    ],
  },
  compact: {
    maxRows: 14,
    rowY: [760, 948, 1136, 1324, 1512, 1700, 1888, 2076, 2264, 2452, 2640, 2828, 3016, 3204],
    rowX: 2017,
    rowWidth: 1625,
    rowHeight: 185,
    rowRadius: 26,
    iconX: 2032,
    iconYOffset: 18,
    iconSize: 150,
    iconRadius: 13,
    nameX: 2219,
    nameWidth: 1390,
    nameHeight: 56,
    nameSize: 49,
    nameMinSize: 36,
    nameWeight: 700,
    dyeYOffset: 96,
    dyeHeight: 67,
    dyeRadius: 29,
    dyeFontSize: 31,
    dyeDotSize: 30,
    dyeDotXOffset: 28,
    dyeTextXOffset: 72,
    dyeTextYOffset: 16,
    dyeGap: 34,
    dyes: [
      { x: 2219, minWidth: 256 },
      { x: 2612, minWidth: 286 },
    ],
  },
};
const RISINGSTONES_TEMPLATE = {
  sourceSize: 3840,
  background: "#ffffff",
  backgroundStrokeWidth: 5,
  borderColor: "#555555",
  imageRegion: { x: 148, y: 243, width: 1915, height: 3402 },
  imageRadius: 44,
  imageStrokeWidth: 0,
  imagePlaceholder: "#a3a3a3",
  avatarRegion: { x: 3280, y: 323, width: 389, height: 390 },
  avatarRadius: 0,
  avatarStrokeWidth: 0,
  title: { x: 2129, y: 333, width: 1010, height: 144, maxSize: 150, minSize: 72 },
  author: { x: 2145, y: 552, width: 451, height: 61, maxSize: 60, minSize: 34 },
  source: { x: 2145, y: 641, width: 897, height: 57, maxSize: 60, minSize: 32 },
  showMeta: false,
  meta: [
    { x: 2164, y: 1739, width: 336, height: 57, key: "race" },
    { x: 2681, y: 1739, width: 179, height: 57, key: "job" },
    { x: 3038, y: 1745, width: 198, height: 47, key: "id" },
  ],
  equipment: {
    maxRows: 10,
    rowStartY: 831,
    rowStep: 297,
    rowBottom: 3535,
    rowX: 2113,
    rowWidth: 1568,
    rowHeight: 247,
    rowRadius: 40,
    iconX: 2132,
    iconYOffset: 23,
    iconSize: 200,
    iconRadius: 14,
    nameX: 2379,
    nameWidth: 700,
    nameYOffset: 44,
    nameHeight: 75,
    nameSize: 72,
    nameMinSize: 40,
    nameWeight: 500,
    fontFamily: "'HarmonyOS Sans SC', 'Source Han Sans CN', 'Microsoft YaHei', sans-serif",
    dyeYOffset: 135,
    dyeHeight: 72,
    dyeFontSize: 46,
    dyeMinFontSize: 28,
    dyeDotSize: 51,
    dyeDotRadius: 10,
    dyeDotStrokeWidth: 1,
    dyeDotXOffset: 12,
    dyeTextXOffset: 77,
    dyeTextYOffset: 149,
    dyeTextHeight: 43,
    dyeTextWidth: 133,
    dyes: [
      { x: 2374, minWidth: 287 },
      { x: 2691, minWidth: 287 },
    ],
  },
  textColor: "#2d2d2d",
  textDim: "#2d2d2d",
  accent: "#c3a769",
  dyeText: "#2d2d2d",
  copyright: {
    x: 2275,
    y: 3535,
    width: 1215,
    height: 110,
    lines: [
      "ff14risingstones - 石之家 X 光之收藏家",
      `© 2010-${COPYRIGHT_END_YEAR} SQUARE ENIX CO., LTD. All Rights Reserved.`,
    ],
  },
};
const SILENCE_FASHION_TEMPLATE = {
  sourceSize: 3000,
  textColor: "#161616",
  serifFamily: "'Source Han Serif CN', 'Noto Serif CJK KR', 'Noto Serif KR', Batang, 'Malgun Gothic', 'Songti SC', SimSun, serif",
  koSerifFamily: "'Source Han Serif KR Local', 'Source Han Serif KR', 'Noto Serif CJK KR', 'Noto Serif KR', Batang, 'Malgun Gothic', serif",
  equipmentBottom: 2650,
  equipmentRight: 2760,
  backgroundUrl: SILENCE_FASHION_BACKGROUND_URL,
  imageRegion: { x: 171, y: 126, width: 1545, height: 2748 },
  avatarRegion: { x: 2434, y: 179, width: 318, height: 318 },
  character: { x: 1773, y: 209, width: 640, size: 48, minSize: 28, weight: 400 },
  title: { x: 1778, y: 288, width: 760, size: 58, minSize: 32, weight: 500 },
  zh: {
    maxRows: 99,
    itemX: 1788,
    dyeX: 1788,
    width: 620,
    y: 725,
    bottom: 2650,
    rowStep: 160,
    itemSize: 60,
    dyeSize: 48,
    itemLineHeight: 72,
    dyeLineHeight: 58,
    groupGap: 42,
    weight: 600,
    dyeYOffset: 50,
  },
  enJa: {
    maxRows: 99,
    itemX: 1787,
    dyeX: 1785,
    width: 760,
    y: 726,
    bottom: 2650,
    rowStep: 245,
    jaSize: 45,
    enSize: 45,
    dyeSize: 36,
    jaLineHeight: 54,
    enLineHeight: 54,
    dyeLineHeight: 43,
    lineGap: 8,
    groupGap: 66,
    weight: 600,
  },
};
const {
  TEMPLATE_DEFINITIONS,
  TEMPLATE_SELECT_ORDER,
} = window.NSGlamourTemplateDefinitions.createTemplateDefinitions({
  appPath,
  DEFAULT_LOCALE,
  TEMPLATE_LOCALE_ORDER,
  EC_TEMPLATE_LOCALE_ORDER,
  HORIZONTAL_TEMPLATE_LOCALE_ORDER,
  FIGMA_SOURCE_SIZE,
  FIGMA_TEMPLATE_BACKGROUND_URL,
  FIGMA_IMAGE_REGION,
  DEFAULT_IMAGE_SLOT_ID,
  HORIZONTAL_TEMPLATE_SOURCE_WIDTH,
  HORIZONTAL_TEMPLATE_SOURCE_HEIGHT,
  HORIZONTAL_TEMPLATE_BACKGROUND_URL,
  HORIZONTAL_TEMPLATE_MAX_ROWS,
  HORIZONTAL_TEMPLATE_IMAGE_SLOTS,
  EC_TEMPLATE_SOURCE_SIZE,
  EC_TEMPLATE_IMAGE_REGION,
  EC_TEMPLATE_LAYOUTS,
  DOUBLE_PIC_TEMPLATE_PREVIEW_URL,
  STORY_TEMPLATE_SOURCE_SIZE,
  DOUBLE_PIC_SOURCE_WIDTH,
  DOUBLE_PIC_SOURCE_HEIGHT,
  STORY_TEMPLATE_IMAGE_SLOTS,
  RISINGSTONES_TEMPLATE_PREVIEW_URL,
  RISINGSTONES_TEMPLATE,
  RISINGSTONES_AVATAR_SLOT_ID,
  SILENCE_FASHION_TEMPLATE,
  SILENCE_FASHION_AVATAR_SLOT_ID,
});
const DEFAULT_TEMPLATE_ID = "eorzea";
const FIGMA_TITLE_MASK = { x: 3180, y: 838, width: 520, height: 145 };
const FIGMA_TITLE_TEXT = { right: 3690, baselineY: 908, width: 520, maxSize: 130, minSize: 72 };
const FIGMA_MASK_FILL = "#ffffff";
const FIGMA_TEXT_COLOR = "#252525";
const FIGMA_DYE_FRAME_MODES = new Set(["psd", "color"]);
const FIGMA_DEFAULT_DYE_FRAME_MODE = "psd";
const FIGMA_EMPTY_DYE_NAME = "无染色";
const FIGMA_EMPTY_DYE_LABEL_BY_LOCALE = {
  zh: "无染色",
  tc: "無染色",
  en: "No Color",
  ja: "染色なし",
  ko: "염색 안 함",
  fr: "Aucune",
  de: "Keine Farbe",
};
const FIGMA_UNDYEABLE_LABEL_BY_LOCALE = {
  zh: "不可染色",
  tc: "不可染色",
  en: "Undyeable",
  ja: "染色不可",
  ko: "염색 불가",
  fr: "Teinture impossible",
  de: "Nicht färbbar",
};
const FIGMA_EMPTY_DYE_LABELS = new Set([
  "无染色",
  "無染色",
  "没有染色",
  "沒有染色",
  "不可染色",
  "染色なし",
  "染色無し",
  "염색 없음",
  "염색 안 함",
  "Aucune",
  "Sans teinture",
  "Keine Farbe",
  "No Dye",
  "No Color",
  "No Colour",
  "Undyed",
  "Undyeable",
  "None",
]);
const FIGMA_EMPTY_DYE_LABELS_NORMALIZED = new Set(
  Array.from(FIGMA_EMPTY_DYE_LABELS, (label) => String(label).trim().toLowerCase()),
);
const FIGMA_TITLE_TRACKING = -177;
const FIGMA_ITEM_NAME_TRACKING = -50;
const FIGMA_EQUIPMENT_LAYOUTS = {
  roomy: {
    rowY: [1797, 2125, 2453, 2781, 3109],
    nameX: 2877,
    nameWidth: 810,
    nameSize: 74,
    lineHeight: 88,
    dyeX: [3009, 3359],
    dyeYOffset: 95,
    dyeWidth: 332,
    dyeHeight: 56,
    dyeRadius: 9,
    dyeTextWidth: 226,
    dyeTextXOffset: 69,
    dyeTextYOffset: 12,
    dyeFontSize: 32,
  },
  sixRows: {
    rowY: [1706, 2008, 2310, 2613, 2915, 3217],
    nameX: 2877,
    nameWidth: 810,
    nameSize: 74,
    lineHeight: 88,
    dyeX: [3009, 3359],
    dyeYOffset: 95,
    dyeWidth: 332,
    dyeHeight: 56,
    dyeRadius: 9,
    dyeTextWidth: 226,
    dyeTextXOffset: 69,
    dyeTextYOffset: 12,
    dyeFontSize: 32,
  },
  compact: {
    rowY: [1689, 1948, 2206, 2465, 2723, 2981, 3240],
    nameX: 2952,
    nameWidth: 731,
    nameSize: 67,
    lineHeight: 80,
    dyeX: [3071, 3387],
    dyeYOffset: 86,
    dyeWidth: 299,
    dyeHeight: 51,
    dyeRadius: 8,
    dyeTextWidth: 204,
    dyeTextXOffset: 63,
    dyeTextYOffset: 10,
    dyeFontSize: 32,
  },
};
const TEMPLATE_ASPECTS = {
  "1:1": { width: TEMPLATE_OUTPUT_HEIGHT, height: TEMPLATE_OUTPUT_HEIGHT },
};
let currentTemplateId = DEFAULT_TEMPLATE_ID;
let currentTemplateStateId = DEFAULT_TEMPLATE_ID;
// THEME_ICONS handled by NSGlamourCommon
const THEME_ICONS = {}; // kept for backward compat, unused
const SLOT_DEFINITIONS = NSGlamourCommon.C.SLOT_DEFINITIONS;

const state = {
  sourceName: "手动编辑",
  sourceMeta: {},
  sourceParsed: null, // original parsed payload from equipinfo for bidir sync
  locale: DEFAULT_LOCALE,
  rows: SLOT_DEFINITIONS.map((slot) => ({ slot: slot.key, item: null })),
  stainsByLocale: {},
  images: makeTemplateImageSlots(),
  settings: {
    templateId: DEFAULT_TEMPLATE_ID,
    topText: "幻化存档",
    characterName: "",
    bottomText: "NSGlamour",
    ecSubtitleText: "",
    ecSubtitleLeftText: "",
    ecSubtitleSymbolText: "♦",
    ecSubtitleRightText: "",
    ecSubtitleTouched: false,
    ecSubtitleAutoText: "",
    aspect: FIGMA_TEMPLATE_ASPECT,
    infoWidth: 0,
    padding: 28,
    nameSize: 24,
    dyeSize: 15,
    showIcons: true,
    dyeFrameMode: FIGMA_DEFAULT_DYE_FRAME_MODE,
    locales: [DEFAULT_LOCALE],
    textColor: "#1c2130",
    panelColor: "#ffffff",
    storySwatchColors: STORY_TEMPLATE_DEFAULT_SWATCH_COLORS.slice(),
  },
};

const DEFAULT_TEMPLATE_SETTINGS = {
  topText: "幻化存档",
  characterName: "",
  bottomText: "NSGlamour",
  ecSubtitleText: "",
  ecSubtitleLeftText: "",
  ecSubtitleSymbolText: "♦",
  ecSubtitleRightText: "",
  ecSubtitleTouched: false,
  ecSubtitleAutoText: "",
  aspect: FIGMA_TEMPLATE_ASPECT,
  infoWidth: 0,
  padding: 28,
  nameSize: 24,
  dyeSize: 15,
  showIcons: true,
  dyeFrameMode: FIGMA_DEFAULT_DYE_FRAME_MODE,
  locales: [DEFAULT_LOCALE],
  textColor: "#1c2130",
  panelColor: "#ffffff",
  storySwatchColors: STORY_TEMPLATE_DEFAULT_SWATCH_COLORS.slice(),
};

let isApplyingDraft = false;
let _storeIgnoreSync = false;
let lastTemplateStoreSyncSignature = "";
let templateSettingsById = {};
let templateImagesById = {};
const templateImageObjectUrls = new Map();
let hasStoredTemplateLocalePrefs = false;
let pendingCrop = null;
let pendingImageFileQueue = [];
let cropper = null;
let isSyncingCropZoomControl = false;
let activeImageSlotId = DEFAULT_IMAGE_SLOT_ID;
let highlightedImageDropSlotId = "";
let renderSequence = 0;
let loadingTaskSequence = 0;
let loadingVisibleAt = 0;
let loadingShowTimer = 0;
let loadingHideTimer = 0;
let templateSelectorFilter = TEMPLATE_SELECTOR_FILTER_ALL;
let templateInitialized = false;
const LOADING_OVERLAY_SHOW_DELAY_MS = 140;
const LOADING_OVERLAY_MIN_VISIBLE_MS = 260;
const LOADING_OVERLAY_FADE_MS = 180;
const boundCanvasUploadLayers = new WeakSet();
let isCanvasShellDropBound = false;
let isTemplateDocumentDropGuardBound = false;
const iconImageCache = new Map();
const luminanceMaskCanvasCache = new Map();
let figmaTemplateBackground = null;
let figmaTemplateBackgroundLoading = false;
let figmaTemplateBackgroundPromise = null;
let horizontalTemplateBackground = null;
let horizontalTemplateBackgroundLoading = false;
let horizontalTemplateBackgroundPromise = null;
let silenceFashionBackground = null;
let silenceFashionBackgroundLoading = false;
let silenceFashionBackgroundPromise = null;
let storyTemplateLeftMask = null;
let storyTemplateLeftMaskLoading = false;
let storyTemplateLeftMaskPromise = null;
let doublePicLeftMask = null;
let doublePicLeftMaskLoading = false;
let doublePicLeftMaskPromise = null;
const TEMPLATE_CANVAS_FONTS = [
  "700 38px 'HarmonyOS Sans SC'",
  "500 118px 'Source Han Sans CN'",
  "500 130px 'Source Han Serif CN'",
  "500 74px 'Source Han Serif CN'",
  "700 62px 'Source Han Serif CN'",
  "900 62px 'Source Han Serif CN'",
  "900 52px 'Source Han Serif CN'",
  "900 100px 'HarmonyOS Sans SC'",
  "400 95px 'Source Sans 3'",
  "300 95px 'Source Sans 3'",
  "400 95px 'HarmonyOS Sans SC'",
  "400 178px 'Josefin Sans'",
  "700 178px 'Josefin Sans'",
  "400 76px 'Source Sans 3'",
  "400 76px 'NS Cambria'",
  "600 41px 'Source Sans 3'",
  "500 72px 'HarmonyOS Sans SC'",
  "700 150px 'HarmonyOS Sans SC'",
  "300 38px 'HarmonyOS Sans SC'",
  "200 50px 'Source Han Serif CN'",
  "400 70px 'Source Han Serif CN'",
  "600 40px 'Source Han Serif CN'",
];
const SILENCE_FASHION_KO_CANVAS_FONTS = [
  "400 60px 'Source Han Serif KR Local'",
  "600 50px 'Source Han Serif KR Local'",
];
let templateFontsReady = !document.fonts;
let silenceFashionKoFontsLoading = false;
let templatePreviewResizeFrame = 0;
const templateFontsReadyPromise = document.fonts
  ? Promise.all(TEMPLATE_CANVAS_FONTS.map((font) => document.fonts.load(font)))
  .then(() => document.fonts.ready)
  .then(() => {
    templateFontsReady = true;
    renderCanvas();
  })
  .catch(() => {
    templateFontsReady = true;
  })
  : Promise.resolve();

function getAppBasePath() { return NSGlamourCommon.getAppBasePath(); }
function appPath(path) { return NSGlamourCommon.appPath(path); }

function applyTheme(theme, options = {}) { return NSGlamourCommon.applyTheme(theme, options); }
function loadTheme() { NSGlamourCommon.loadTheme(); }
function toggleTheme() { NSGlamourCommon.toggleTheme(); }
NSGlamourCommon.setupThemeListeners();

function resolveLocalized(map, locale = state.locale) { return NSGlamourCommon.resolveLocalized(map, locale); }
function localeToHtmlLang(locale = state.locale) { return NSGlamourCommon.localeToHtmlLang(locale); }

function getCurrentUiLanguage() {
  return window.NSGlamourUiLanguage?.get?.() || document.documentElement.lang || "zh-CN";
}

function getTemplateLocaleForUiLanguage(language = getCurrentUiLanguage()) {
  const normalized = window.NSGlamourUiLanguage?.normalize?.(language) || language;
  return UI_LANGUAGE_TO_TEMPLATE_LOCALE[normalized] || DEFAULT_LOCALE;
}

function getTemplateLocalizedText(source, locale = state.locale) {
  return window.NSGlamourUiLanguage?.translate?.(source, localeToHtmlLang(locale)) || source;
}

function getUiLocalizedText(source) {
  return window.NSGlamourUiLanguage?.translate?.(source) || source;
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(min, Math.min(number, max)) : fallback;
}

function normalizeHexColor(value, fallback) {
  const raw = String(value || "").trim();
  return /^#[0-9a-f]{6}$/i.test(raw) ? raw.toLowerCase() : fallback;
}

function normalizeOptionalHexColor(value) {
  const raw = String(value || "").trim();
  if (!raw) {
    return "";
  }
  const valueWithHash = raw.startsWith("#") ? raw : `#${raw}`;
  return /^#[0-9a-f]{6}$/i.test(valueWithHash) ? valueWithHash.toLowerCase() : "";
}

function normalizeStorySwatchColors(value) {
  const source = Array.isArray(value) ? value : STORY_TEMPLATE_DEFAULT_SWATCH_COLORS;
  return STORY_TEMPLATE_SWATCH_RECTS.map((_, index) => {
    const normalized = normalizeOptionalHexColor(source[index]);
    if (normalized || Array.isArray(value)) {
      return normalized;
    }
    return STORY_TEMPLATE_DEFAULT_SWATCH_COLORS[index] || "";
  });
}

function normalizeTemplateAspect(value) {
  return Object.prototype.hasOwnProperty.call(TEMPLATE_ASPECTS, value) ? value : FIGMA_TEMPLATE_ASPECT;
}

function normalizeFigmaDyeFrameMode(value) {
  const normalized = String(value || "").trim();
  return FIGMA_DYE_FRAME_MODES.has(normalized) ? normalized : FIGMA_DEFAULT_DYE_FRAME_MODE;
}

function normalizeTemplateId(value) {
  const id = String(value || "").trim();
  return Object.prototype.hasOwnProperty.call(TEMPLATE_DEFINITIONS, id) ? id : DEFAULT_TEMPLATE_ID;
}

function getCurrentTemplate() {
  currentTemplateId = normalizeTemplateId(currentTemplateId);
  return TEMPLATE_DEFINITIONS[currentTemplateId] || TEMPLATE_DEFINITIONS[DEFAULT_TEMPLATE_ID];
}

function getTemplateDefaultLocale(template = getCurrentTemplate()) {
  const locale = String(template?.defaultLocale || DEFAULT_LOCALE).trim();
  return LOCALE_ORDER.includes(locale) ? locale : DEFAULT_LOCALE;
}

function getTemplateLocaleOrder(template = getCurrentTemplate()) {
  const configured = Array.isArray(template?.localeOrder) ? template.localeOrder : TEMPLATE_LOCALE_ORDER;
  const normalized = configured.filter((locale) => LOCALE_ORDER.includes(locale));
  return normalized.length ? normalized : TEMPLATE_LOCALE_ORDER;
}

function normalizeTemplateLanguageOptionLocales(value, template = getCurrentTemplate()) {
  const allowed = new Set(getTemplateLocaleOrder(template));
  const locales = [];
  for (const locale of Array.isArray(value) ? value : [value]) {
    const normalized = String(locale || "").trim();
    if (allowed.has(normalized) && !locales.includes(normalized)) {
      locales.push(normalized);
    }
  }
  return locales;
}

function getTemplateLanguageOptions(template = getCurrentTemplate()) {
  if (!Array.isArray(template?.languageOptions)) {
    return [];
  }
  return template.languageOptions
    .map((option) => {
      const locales = normalizeTemplateLanguageOptionLocales(option?.locales, template);
      if (!locales.length) {
        return null;
      }
      return {
        id: String(option?.id || locales.join("-")).trim() || locales.join("-"),
        label: String(option?.label || locales.map((locale) => LOCALE_LABELS[locale] || locale).join("+")),
        locales,
      };
    })
    .filter(Boolean);
}

function areSameTemplateLocales(left, right) {
  return left.length === right.length && left.every((locale, index) => locale === right[index]);
}

function templateSupportsLocale(template, locale) {
  return getTemplateLocaleOrder(template).includes(locale);
}

function getTemplatesForUiLanguage(language = getCurrentUiLanguage()) {
  const locale = getTemplateLocaleForUiLanguage(language);
  return TEMPLATE_SELECT_ORDER
    .map((id) => TEMPLATE_DEFINITIONS[id])
    .filter(Boolean)
    .filter((template) => templateSupportsLocale(template, locale));
}

function getTemplateDefaultForUiLanguage(language = getCurrentUiLanguage()) {
  return getTemplatesForUiLanguage(language)[0] || TEMPLATE_DEFINITIONS[DEFAULT_TEMPLATE_ID];
}

function getTemplateEquipmentFormat(template = getCurrentTemplate()) {
  return template?.equipmentFormat || {};
}

function getTemplateDyeFormat(template = getCurrentTemplate()) {
  return getTemplateEquipmentFormat(template).dye || {};
}

function getLocaleForTemplateAndUiLanguage(template, language = getCurrentUiLanguage()) {
  const uiLocale = getTemplateLocaleForUiLanguage(language);
  return templateSupportsLocale(template, uiLocale) ? uiLocale : getTemplateDefaultLocale(template);
}

function getCurrentTemplateSourceSize() {
  return Number(getCurrentTemplate().sourceSize || FIGMA_SOURCE_SIZE);
}

function getCurrentTemplateSourceWidth() {
  return Number(getCurrentTemplate().sourceWidth || getCurrentTemplate().sourceSize || FIGMA_SOURCE_SIZE);
}

function getCurrentTemplateSourceHeight() {
  return Number(getCurrentTemplate().sourceHeight || getCurrentTemplate().sourceSize || getCurrentTemplateSourceWidth());
}

function getCurrentTemplateScale() {
  return getCurrentTemplateSourceHeight() / TEMPLATE_DESIGN_HEIGHT;
}

function getTemplateOutputSize(aspect = FIGMA_TEMPLATE_ASPECT) {
  const normalizedAspect = normalizeTemplateAspect(aspect);
  if (normalizedAspect === FIGMA_TEMPLATE_ASPECT) {
    return {
      width: getCurrentTemplateSourceWidth(),
      height: getCurrentTemplateSourceHeight(),
    };
  }
  return TEMPLATE_ASPECTS[normalizedAspect] || { width: TEMPLATE_OUTPUT_HEIGHT, height: TEMPLATE_OUTPUT_HEIGHT };
}

function isFigmaTemplateMode() {
  return normalizeTemplateAspect(state.settings.aspect) === FIGMA_TEMPLATE_ASPECT;
}

function getTemplateImageSlotDefinitions() {
  const slots = Array.isArray(getCurrentTemplate().imageSlots) ? getCurrentTemplate().imageSlots : [];
  const normalized = slots
    .map((slot, index) => {
      const id = String(slot?.id || (index === 0 ? DEFAULT_IMAGE_SLOT_ID : `image-${index + 1}`)).trim();
      if (!id) {
        return null;
      }
      return {
        id,
        label: String(slot.label || `图片 ${index + 1}`),
        uploadText: String(slot.uploadText || "上传图片"),
        helperText: String(slot.helperText || ""),
        region: slot.region || null,
        uploadRegion: slot.uploadRegion || null,
        dropRegion: slot.dropRegion || null,
        maskRegion: slot.maskRegion || null,
        aspectRatio: Number(slot.aspectRatio) > 0 ? Number(slot.aspectRatio) : null,
        fit: slot.fit === "contain" ? "contain" : "cover",
        cropRequired: slot.cropRequired !== false,
      };
    })
    .filter(Boolean);
  return normalized.length
    ? normalized
    : [{
      id: DEFAULT_IMAGE_SLOT_ID,
      label: "图片",
      uploadText: "上传图片",
      helperText: "",
      region: FIGMA_IMAGE_REGION,
      uploadRegion: null,
      dropRegion: null,
      maskRegion: null,
      aspectRatio: null,
      fit: "cover",
      cropRequired: true,
    }];
}

function getTemplateImageSlotDefinition(slotId = DEFAULT_IMAGE_SLOT_ID) {
  const slots = getTemplateImageSlotDefinitions();
  return slots.find((slot) => slot.id === slotId) || slots[0];
}

function makeTemplateImageSlots(existing = {}) {
  return getTemplateImageSlotDefinitions().reduce((images, slot) => {
    const current = existing && typeof existing === "object" ? existing[slot.id] : null;
    images[slot.id] = {
      image: current?.image || null,
      imageUrl: current?.imageUrl || "",
      imageName: current?.imageName || "",
      sourceUrl: current?.sourceUrl || "",
      sourceName: current?.sourceName || "",
      backupUrl: current?.backupUrl || "",
      backupOnly: Boolean(current?.backupOnly),
    };
    return images;
  }, {});
}

function getTemplateImageSlot(slotId = DEFAULT_IMAGE_SLOT_ID) {
  const slot = getTemplateImageSlotDefinition(slotId);
  if (!state.images || typeof state.images !== "object") {
    state.images = makeTemplateImageSlots();
  }
  if (!state.images[slot.id]) {
    state.images[slot.id] = {
      image: null,
      imageUrl: "",
      imageName: "",
      sourceUrl: "",
      sourceName: "",
      backupUrl: "",
      backupOnly: false,
    };
  }
  return state.images[slot.id];
}

async function setTemplateImageSlot(slotId, imageData) {
  const slot = getTemplateImageSlotDefinition(slotId);
  state.images = makeTemplateImageSlots(state.images);
  state.images[slot.id] = {
    image: imageData.image || null,
    imageUrl: imageData.imageUrl || "",
    imageName: imageData.imageName || "",
    sourceUrl: imageData.sourceUrl || "",
    sourceName: imageData.sourceName || "",
    backupUrl: imageData.backupUrl || "",
    backupOnly: Boolean(imageData.backupOnly),
  };
  forgetTemplateImageObjectUrl(getTemplateStateId(), slot.id);
  if (!state.images[slot.id].backupOnly) {
    writeTemplateImageSessionSlot(getTemplateStateId(), slot.id, state.images[slot.id]);
    await persistTemplateImageSlot(getTemplateStateId(), slot.id, state.images[slot.id]);
  }
  return state.images[slot.id];
}

function scaleTemplateUnit(value) {
  return Math.round(Number(value || 0) * getCurrentTemplateScale());
}

function getTemplateMetrics(aspect = state.settings.aspect) {
  const normalizedAspect = normalizeTemplateAspect(aspect);
  const output = getTemplateOutputSize(normalizedAspect);
  if (normalizedAspect === FIGMA_TEMPLATE_ASPECT) {
    const primaryImageRegion = getTemplateImageSlotDefinition(DEFAULT_IMAGE_SLOT_ID).region || FIGMA_IMAGE_REGION;
    const imageWidth = Math.round((output.width * primaryImageRegion.width) / getCurrentTemplateSourceWidth());
    return {
      aspect: normalizedAspect,
      totalWidth: output.width,
      totalHeight: output.height,
      headerHeight: 0,
      footerHeight: 0,
      contentHeight: output.height,
      imageWidth,
      imageHeight: output.height,
      imageY: 0,
      infoWidth: output.width - imageWidth,
    };
  }
  const headerHeight = state.settings.topText.trim() ? scaleTemplateUnit(70) : 0;
  const footerHeight = state.settings.bottomText.trim() ? scaleTemplateUnit(54) : 0;
  const contentHeight = Math.max(scaleTemplateUnit(240), output.height - headerHeight - footerHeight);
  const totalWidth = output.width;
  const totalHeight = output.height;
  const imageHeight = Math.min(output.height, contentHeight);
  const imageWidth = Math.min(Math.round(imageHeight * CROP_ASPECT_RATIO), totalWidth);
  const imageY = Math.round(headerHeight + Math.max(0, (contentHeight - imageHeight) / 2));
  const infoWidth = Math.max(0, totalWidth - imageWidth);
  return {
    aspect: normalizedAspect,
    totalWidth,
    totalHeight,
    headerHeight,
    footerHeight,
    contentHeight,
    imageWidth,
    imageHeight,
    imageY,
    infoWidth,
  };
}

function normalizeTemplateLocales(value, fallback = [getTemplateDefaultLocale()], template = getCurrentTemplate()) {
  const localeOrder = getTemplateLocaleOrder(template);
  const allowed = new Set(localeOrder);
  const out = [];
  const addLocales = (list) => {
    for (const locale of Array.isArray(list) ? list : [list]) {
      const normalized = String(locale || "").trim();
      if (allowed.has(normalized) && !out.includes(normalized)) {
        out.push(normalized);
      }
    }
  };

  addLocales(value);
  if (!out.length) {
    addLocales(fallback);
  }
  if (!out.length) {
    out.push(getTemplateDefaultLocale(template));
  }
  return out;
}

function getTemplateLanguageMode() {
  return TEMPLATE_LANGUAGE_MODE;
}

function isSingleTemplateLanguageMode() {
  return getTemplateLanguageMode() === "single";
}

function normalizeSelectedTemplateLocales(value, fallback = [getTemplateDefaultLocale()], template = getCurrentTemplate()) {
  const locales = normalizeTemplateLocales(value, fallback, template);
  return isSingleTemplateLanguageMode() && !getTemplateLanguageOptions(template).length
    ? [locales[0] || getTemplateDefaultLocale(template)]
    : locales;
}

function setStatus(message, isError = false) {
  templateStatus.textContent = getUiLocalizedText(message);
  templateStatus.classList.toggle("error", isError);
}

function localizeUiText(template, value = "") {
  const translated = getUiLocalizedText(template);
  const values = Array.isArray(value) ? value : [value];
  let valueIndex = 0;
  return translated.replace(/\{value\}/g, () => {
    const replacement = values[Math.min(valueIndex, values.length - 1)];
    valueIndex += 1;
    return String(replacement ?? "");
  });
}

async function fetchJson(path, options = {}) {
  const response = await fetch(appPath(path), { cache: "no-store", ...options });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || localizeUiText("请求失败：{value}", response.status));
  }
  return data;
}

function getGlamourLinkKind(rawUrl) {
  const normalizedUrl = normalizeGlamourLinkUrl(rawUrl);
  let url;
  try {
    url = new URL(normalizedUrl);
  } catch {
    return "";
  }
  if (url.hostname === "ffxiv.eorzeacollection.com") {
    return "ec";
  }
  if (url.hostname === "ff14risingstones.web.sdo.com") {
    return "risingstones";
  }
  return "";
}

function normalizeGlamourLinkUrl(rawUrl) {
  const text = String(rawUrl || "").trim();
  if (!text) {
    return "";
  }
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : `https://${text}`;
}

function openTemplateImportDialog() {
  if (!templateImportOverlay) {
    return;
  }
  setTemplateImportHint("请输入石之家或 Eorzea Collection 幻化链接");
  templateImportOverlay.classList.remove("hidden");
  templateImportOverlay.setAttribute("aria-hidden", "false");
  window.setTimeout(() => templateImportUrlInput?.focus(), 0);
}

function closeTemplateImportDialog() {
  if (!templateImportOverlay) {
    return;
  }
  templateImportOverlay.classList.add("hidden");
  templateImportOverlay.setAttribute("aria-hidden", "true");
}

function setTemplateImportHint(message, isError = false) {
  if (!templateImportHint) {
    return;
  }
  templateImportHint.textContent = message;
  templateImportHint.classList.toggle("error", isError);
}

function showTemplateLoadingOverlay() {
  if (!templateLoadingOverlay) {
    return;
  }
  window.clearTimeout(loadingHideTimer);
  templateLoadingOverlay.classList.remove("hidden", "is-hiding");
  templateLoadingOverlay.setAttribute("aria-hidden", "false");
  if (!loadingVisibleAt) {
    loadingVisibleAt = performance.now();
  }
}

function hideTemplateLoadingOverlay() {
  if (!templateLoadingOverlay) {
    return;
  }
  window.clearTimeout(loadingShowTimer);
  window.clearTimeout(loadingHideTimer);

  const elapsed = loadingVisibleAt ? performance.now() - loadingVisibleAt : LOADING_OVERLAY_MIN_VISIBLE_MS;
  const waitMs = Math.max(0, LOADING_OVERLAY_MIN_VISIBLE_MS - elapsed);
  loadingHideTimer = window.setTimeout(() => {
    templateLoadingOverlay.classList.add("is-hiding");
    loadingHideTimer = window.setTimeout(() => {
      templateLoadingOverlay.classList.add("hidden");
      templateLoadingOverlay.classList.remove("is-hiding");
      templateLoadingOverlay.setAttribute("aria-hidden", "true");
      loadingVisibleAt = 0;
    }, LOADING_OVERLAY_FADE_MS);
  }, waitMs);
}

function beginTemplateLoadingTask() {
  const taskId = ++loadingTaskSequence;
  window.clearTimeout(loadingShowTimer);
  window.clearTimeout(loadingHideTimer);
  loadingShowTimer = window.setTimeout(() => {
    if (taskId === loadingTaskSequence) {
      showTemplateLoadingOverlay();
    }
  }, LOADING_OVERLAY_SHOW_DELAY_MS);
  return taskId;
}

function finishTemplateLoadingTask(taskId) {
  if (taskId !== loadingTaskSequence) {
    return;
  }
  hideTemplateLoadingOverlay();
}

function makeRows() {
  return SLOT_DEFINITIONS.map((slot) => ({ slot: slot.key, item: null }));
}

function getFilledRows() {
  return state.rows.filter((row) => row.item);
}

function readIgnoreEmperor() {
  return localStorage.getItem(IGNORE_EMPEROR_KEY) === "1";
}

function getSlotGroupOrder(slotKey) {
  if (WEAPON_SLOTS.has(slotKey)) {
    return 0;
  }
  if (ARMOR_SLOTS.has(slotKey)) {
    return 1;
  }
  return 2;
}

function getSlotDefinitionIndex(slotKey) {
  const index = SLOT_DEFINITIONS.findIndex((slot) => slot.key === slotKey);
  return index >= 0 ? index : SLOT_DEFINITIONS.length;
}

function sortRowsForTemplate(rows) {
  return rows.slice().sort((left, right) => {
    const groupDelta = getSlotGroupOrder(left.slot) - getSlotGroupOrder(right.slot);
    if (groupDelta) {
      return groupDelta;
    }
    return getSlotDefinitionIndex(left.slot) - getSlotDefinitionIndex(right.slot);
  });
}

function getRenderableRows() {
  const locales = getSelectedTemplateLocales();
  return sortRowsForTemplate(getFilledRows()).filter((row) => locales.some((locale) => getItemName(row.item, locale)));
}

function getEcRenderableRows() {
  const locales = getSelectedTemplateLocales();
  const rowsBySlot = new Map(getFilledRows().map((row) => [row.slot, row]));
  return EC_TEMPLATE_EQUIPMENT_SLOTS
    .map((slot) => rowsBySlot.get(slot))
    .filter((row) => row && locales.some((locale) => getItemName(row.item, locale)));
}

function getTemplateEquipmentSourceRows(template = getCurrentTemplate()) {
  const format = getTemplateEquipmentFormat(template);
  return format.source === "ec" ? getEcRenderableRows() : getRenderableRows();
}

function buildTemplateEquipmentRows(template = getCurrentTemplate(), locale = state.locale, options = {}) {
  const format = getTemplateEquipmentFormat(template);
  const dyeFormat = getTemplateDyeFormat(template);
  const maxRows = Math.max(0, Number(options.maxRows ?? format.maxRows ?? 0));
  const sourceRows = getTemplateEquipmentSourceRows(template);
  const rows = maxRows > 0 ? sourceRows.slice(0, maxRows) : sourceRows.slice();
  return rows
    .map((row) => {
      const itemName = getItemName(row.item, locale).trim();
      if (!itemName) {
        return null;
      }
      const dyes = getTemplateDisplayDyeEntries(row, locale, dyeFormat);
      const dyeText = getTemplateDyeText(row, locale, dyeFormat);
      return {
        ...row,
        rawRow: row,
        itemName,
        dyes,
        dyeText,
        hasDyeLine: dyeFormat.reserveLineHeight === true || Boolean(dyeText),
      };
    })
    .filter(Boolean);
}

function getSlotLabel(slotKey) {
  const label = SLOT_DEFINITIONS.find((slot) => slot.key === slotKey)?.label || slotKey;
  return getUiLocalizedText(label);
}

function getItemName(item, locale = state.locale) {
  return NSGlamourCommon.cleanDataminingText(resolveLocalized(item?.names, locale) || item?.name || "");
}

function buildIconUrl(iconId) { return NSGlamourCommon.buildIconUrl(iconId); }

function loadIconImage(iconId) {
  const url = buildIconUrl(iconId);
  if (!url) {
    return Promise.resolve(null);
  }
  const cached = iconImageCache.get(url);
  if (cached) {
    return cached instanceof Promise ? cached : Promise.resolve(cached);
  }

  const promise = new Promise((resolve) => {
    const image = new Image();
    image.onload = () => {
      iconImageCache.set(url, image);
      resolve(image);
    };
    image.onerror = () => {
      iconImageCache.delete(url);
      resolve(null);
    };
    image.src = url;
  });
  iconImageCache.set(url, promise);
  return promise;
}

async function ensureTemplateIconsReady() {
  if (!state.settings.showIcons && !getTemplateRenderProfile().forceIcons) {
    return;
  }
  const rows = getTemplateEquipmentSourceRows();
  const iconIds = rows
    .map((row) => row.item?.icon)
    .filter((iconId) => Number(iconId) > 0);
  await Promise.all([...new Set(iconIds)].map((iconId) => loadIconImage(iconId)));
}

function getDyeCount(row) {
  return getItemDyeCount(row?.item, row?.slot);
}

function getTemplateDyeSlotCount(row, options = getTemplateDyeFormat()) {
  const resolvedOptions = getTemplateDisplayDyeOptions(options);
  return TEMPLATE_DYE_POLICY.getSlotCount(
    row,
    resolvedOptions,
    getDyeCount(row),
    !resolvedOptions.includeAccessories && ACCESSORY_SLOTS.has(row?.slot),
  );
}

function getItemDyeCount(item, slot) {
  if (!item || ACCESSORY_SLOTS.has(slot)) {
    return 0;
  }
  return Math.max(0, Math.min(Number(item.dye_count || 0), 2));
}

function getItemEquipSlotCategory(item) {
  return Number(item?.equip_slot_category || 0) || 0;
}

function itemBlocksOffHand(item) {
  return getItemEquipSlotCategory(item) === 13;
}

function getStainById(stainId, locale = state.locale) { return NSGlamourCommon.Stains.getStainById(state.stainsByLocale, stainId, locale); }
function getStainName(stainId, locale = state.locale) { return NSGlamourCommon.Stains.getStainName(state.stainsByLocale, stainId, locale); }
function findStainByName(name) { return NSGlamourCommon.Stains.findStainByName(state.stainsByLocale, name, state.locale); }

function makeNoDyeEntry(locale = state.locale) {
  const stain = getStainById(0, locale);
  const name = stain?.name || getFigmaEmptyDyeLabel(locale);
  return {
    id: 0,
    names: { [locale]: name },
    name,
    hex: stain?.hex || "#000000",
    rgb: stain?.rgb || 0,
    group: stain?.group || 0,
    group_name: stain?.group_name || "",
    sub_order: stain?.sub_order || 0,
  };
}

function localizeDyeEntry(entry, locale = state.locale) {
  return NSGlamourCommon.Stains.localizeDyeEntry(state.stainsByLocale, entry, locale);
}

function getDyeEntries(row, locale = state.locale) {
  const dyeCount = getDyeCount(row);
  if (!row.item || dyeCount <= 0) {
    return [];
  }
  return (row.item.dye_entries || [])
    .slice(0, dyeCount)
    .map((entry) => {
      const stain = getStainById(entry.id, locale);
      return {
        name: getStainName(entry.id, locale) || resolveLocalized(entry.names, locale) || entry.name || "",
        hex: stain?.hex || entry.hex || "#000000",
      };
    })
    .filter((entry) => entry.name);
}

function normalizeFigmaDyeName(name) {
  let normalized = String(name || "").trim();
  normalized = normalized.replace(/^【(.+)】$/, "$1").replace(/[【】]/gu, "");
  if (!normalized || FIGMA_EMPTY_DYE_LABELS.has(normalized) || FIGMA_EMPTY_DYE_LABELS_NORMALIZED.has(normalized.toLowerCase())) {
    return FIGMA_EMPTY_DYE_NAME;
  }
  return normalized;
}

function getFigmaEmptyDyeLabel(locale = state.locale) {
  const stain = getStainById(0, locale);
  const translated = getTemplateLocalizedText(FIGMA_EMPTY_DYE_NAME, locale);
  return stain?.name
    || (translated && translated !== FIGMA_EMPTY_DYE_NAME ? translated : "")
    || FIGMA_EMPTY_DYE_LABEL_BY_LOCALE[locale]
    || FIGMA_EMPTY_DYE_LABEL_BY_LOCALE[DEFAULT_LOCALE];
}

function getFigmaUndyeableLabel(locale = state.locale) {
  const source = "不可染色";
  const translated = getTemplateLocalizedText(source, locale);
  return (translated && translated !== source ? translated : "")
    || FIGMA_UNDYEABLE_LABEL_BY_LOCALE[locale]
    || FIGMA_UNDYEABLE_LABEL_BY_LOCALE[DEFAULT_LOCALE];
}

function getFigmaDyeSuffix(locale = state.locale) {
  if (locale === "en") {
    return "Dye";
  }
  return getTemplateLocalizedText("染剂", locale);
}

function formatFigmaDyeLabel(name, isEmptyDye = false, locale = state.locale) {
  const normalized = normalizeFigmaDyeName(name);
  if (isEmptyDye || normalized === FIGMA_EMPTY_DYE_NAME) {
    return getFigmaEmptyDyeLabel(locale);
  }
  if (locale === "en") {
    return normalized;
  }
  const suffix = getFigmaDyeSuffix(locale);
  return normalized.endsWith("染剂") || normalized.endsWith("染劑") ? normalized.replace(/染剂$/u, suffix) : `${normalized}${suffix}`;
}

function makeFigmaEmptyDyeEntry(locale = state.locale) {
  return {
    name: getFigmaEmptyDyeLabel(locale),
    hex: FIGMA_MASK_FILL,
    isEmpty: true,
  };
}

function getFigmaDyeEntries(row, locale = state.locale, dyeCountOverride = null) {
  if (!row.item) {
    return [];
  }
  const dyeCount = Math.max(0, Math.min(Number(dyeCountOverride ?? getDyeCount(row)), 2));
  if (dyeCount <= 0) {
    return [];
  }
  const sourceEntries = Array.isArray(row.item.dye_entries) ? row.item.dye_entries.slice(0, dyeCount) : [];
  const entries = sourceEntries.map((entry) => {
    const stainId = Number(entry.id);
    const stain = stainId > 0 ? getStainById(stainId, locale) : null;
    const name = normalizeFigmaDyeName(
      stain?.name || resolveLocalized(entry.names, locale) || entry.name || "",
    );
    if (name === FIGMA_EMPTY_DYE_NAME) {
      return makeFigmaEmptyDyeEntry(locale);
    }
    return {
      name,
      hex: stain?.hex || entry.hex || "#000000",
      isEmpty: false,
    };
  });

  while (entries.length < dyeCount) {
    entries.push(makeFigmaEmptyDyeEntry(locale));
  }
  return entries.slice(0, dyeCount);
}

function getTemplateDisplayDyeOptions(templateOrOptions = getCurrentTemplate()) {
  const format = templateOrOptions?.equipmentFormat
    ? getTemplateDyeFormat(templateOrOptions)
    : templateOrOptions;
  return TEMPLATE_DYE_POLICY.resolveDyeOptions(format);
}

function getTemplateDisplayDyeEntries(row, locale = state.locale, options = {}) {
  const resolvedOptions = getTemplateDisplayDyeOptions(options);
  const isExcludedSlot = !resolvedOptions.includeAccessories && ACCESSORY_SLOTS.has(row?.slot);
  if (!row?.item || isExcludedSlot) {
    return [];
  }
  const dyeCount = getTemplateDyeSlotCount(row, resolvedOptions);
  if (dyeCount <= 0) {
    return resolvedOptions.showWhenDyeCountZero ? [makeFigmaEmptyDyeEntry(locale)] : [];
  }
  const dyes = getFigmaDyeEntries(row, locale, dyeCount).slice(0, dyeCount);
  if (resolvedOptions.showEmptySlots) {
    return dyes;
  }
  return dyes.filter((dye) => {
    const name = normalizeFigmaDyeName(dye.name);
    return dye && !dye.isEmpty && name !== FIGMA_EMPTY_DYE_NAME;
  });
}

function getTemplateDyeText(row, locale = state.locale, options = {}) {
  const resolvedOptions = getTemplateDisplayDyeOptions(options);
  return getTemplateDisplayDyeEntries(row, locale, options)
    .map((dye) => {
      const name = normalizeFigmaDyeName(dye.name);
      return dye.isEmpty || name === FIGMA_EMPTY_DYE_NAME ? getFigmaEmptyDyeLabel(locale) : name;
    })
    .filter(Boolean)
    .join(resolvedOptions.separator);
}

async function ensureStains(locale) { return NSGlamourCommon.Stains.ensureStains(state.stainsByLocale, locale); }

async function ensureTemplateFontsForLocales(locales) {
  if (!document.fonts || getCurrentTemplate().id !== "silence-fashion" || !locales.includes("ko")) {
    return;
  }
  if (silenceFashionKoFontsLoading) {
    return;
  }
  silenceFashionKoFontsLoading = true;
  Promise.all(SILENCE_FASHION_KO_CANVAS_FONTS.map((font) => document.fonts.load(font).catch(() => [])))
    .then(() => {
      if (getCurrentTemplate().id === "silence-fashion" && getSelectedTemplateLocales().includes("ko")) {
        renderCanvas();
      }
    })
    .finally(() => {
      silenceFashionKoFontsLoading = false;
    });
}

async function ensureTemplateLocalesReady() {
  const locales = getSelectedTemplateLocales();
  await Promise.all([
    ...locales.map((locale) => ensureStains(locale)),
    ensureTemplateFontsForLocales(locales),
  ]);
}

function getTemplateDefaultTopText(template = getCurrentTemplate()) {
  return getTemplateRenderProfile(template).defaultTopText || TEMPLATE_RENDER_PROFILES.default.defaultTopText;
}

function normalizeTemplateTopText(value, template) {
  const text = String(value || "").slice(0, 80);
  if (text === "幻化模板") {
    return "幻化存档";
  }
  if (text && text === getTemplateRenderProfile(template).legacyTopText) {
    return getTemplateDefaultTopText(template);
  }
  return text;
}

function getDefaultTemplateSettingsFor(templateId = currentTemplateId) {
  const template = TEMPLATE_DEFINITIONS[normalizeTemplateId(templateId)] || TEMPLATE_DEFINITIONS[DEFAULT_TEMPLATE_ID];
  const defaultLocale = getLocaleForTemplateAndUiLanguage(template);
  return {
    ...DEFAULT_TEMPLATE_SETTINGS,
    topText: getTemplateDefaultTopText(template),
    locales: [defaultLocale],
    storySwatchColors: STORY_TEMPLATE_DEFAULT_SWATCH_COLORS.slice(),
  };
}

function getTemplateStateId() {
  return normalizeTemplateId(currentTemplateStateId || currentTemplateId || DEFAULT_TEMPLATE_ID);
}

function cloneTemplateImages(images = {}) {
  return Object.fromEntries(Object.entries(images || {}).map(([slotId, imageData]) => [
    slotId,
    {
      image: imageData?.image || null,
      imageUrl: imageData?.imageUrl || "",
      imageName: imageData?.imageName || "",
      sourceUrl: imageData?.sourceUrl || "",
      sourceName: imageData?.sourceName || "",
      backupUrl: imageData?.backupUrl || "",
      backupOnly: Boolean(imageData?.backupOnly),
    },
  ]));
}

function hasTemplateImage(imageData) {
  return Boolean(imageData?.image);
}

function isPersistentTemplateImageUrl(imageUrl) {
  return typeof imageUrl === "string" && imageUrl.startsWith("data:image/");
}

function readTemplateImageSessionBackup() {
  try {
    const backup = JSON.parse(sessionStorage.getItem(TEMPLATE_IMAGE_SESSION_KEY) || "{}");
    return backup && typeof backup === "object" ? backup : {};
  } catch {
    return {};
  }
}

function writeTemplateImageSessionSlot(templateId, slotId, imageData) {
  if (!hasTemplateImage(imageData) || !isPersistentTemplateImageUrl(imageData?.imageUrl)) {
    return;
  }
  try {
    const backup = readTemplateImageSessionBackup();
    const normalizedTemplateId = normalizeTemplateId(templateId);
    backup[normalizedTemplateId] = {
      ...(backup[normalizedTemplateId] || {}),
      [slotId]: {
        imageUrl: imageData.imageUrl,
        imageName: imageData.imageName || "",
        sourceUrl: imageData.sourceUrl || "",
        sourceName: imageData.sourceName || "",
        updatedAt: Date.now(),
      },
    };
    sessionStorage.setItem(TEMPLATE_IMAGE_SESSION_KEY, JSON.stringify(backup));
  } catch {
    // Same-tab image backup is best-effort; IndexedDB remains primary.
  }
}

async function restoreTemplateImagesFromSessionBackup() {
  const backup = readTemplateImageSessionBackup()[getTemplateStateId()];
  if (!backup || typeof backup !== "object") {
    return false;
  }
  let changed = false;
  for (const [slotId, imageData] of Object.entries(backup)) {
    if (!isPersistentTemplateImageUrl(imageData?.imageUrl) || getTemplateImageSlot(slotId).image) {
      continue;
    }
    try {
      state.images[slotId] = {
        image: await loadImageFromDataUrl(imageData.imageUrl),
        imageUrl: imageData.imageUrl,
        imageName: imageData.imageName || "",
        sourceUrl: imageData.sourceUrl || "",
        sourceName: imageData.sourceName || "",
        backupUrl: "",
        backupOnly: true,
      };
      changed = true;
    } catch {
      // Ignore stale same-tab backup entries.
    }
  }
  if (changed) {
    templateImagesById[getTemplateStateId()] = cloneTemplateImages(state.images);
  }
  return changed;
}

async function makeTemplateImageForSlotFromSource(slotId, sourceImage) {
  const sourceUrl = sourceImage?.sourceUrl || sourceImage?.imageUrl || "";
  if (!isPersistentTemplateImageUrl(sourceUrl)) {
    return null;
  }
  const source = await loadImageFromDataUrl(sourceUrl);
  const slot = getTemplateImageSlotDefinition(slotId);
  const metrics = getTemplateMetrics();
  const imageRect = getTemplateImageSlotRect(metrics, slot.id);
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(imageRect.width));
  output.height = Math.max(1, Math.round(imageRect.height));
  const outputCtx = output.getContext("2d");
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  if (slot.fit === "contain") {
    drawImageContain(outputCtx, source, 0, 0, output.width, output.height, {
      showPlaceholderText: false,
      backgroundFillStyle: FIGMA_MASK_FILL,
    });
  } else {
    drawImageCover(outputCtx, source, 0, 0, output.width, output.height, {
      showPlaceholderText: false,
      showPlaceholderFill: false,
    });
  }
  const imageUrl = output.toDataURL("image/png");
  return {
    image: await loadImageFromDataUrl(imageUrl),
    imageUrl,
    imageName: sourceImage?.imageName || sourceImage?.sourceName || "",
    sourceUrl,
    sourceName: sourceImage?.sourceName || sourceImage?.imageName || "",
  };
}

async function carryTemplateImagesIntoCurrentTemplate(sourceImages = {}) {
  const nextImages = makeTemplateImageSlots(state.images);
  let changed = false;
  for (const slot of getTemplateImageSlotDefinitions()) {
    if (hasTemplateImage(nextImages[slot.id])) {
      continue;
    }
    const sourceImage = [slot.id, ...(TEMPLATE_IMAGE_SLOT_ALIASES[slot.id] || [])]
      .map((sourceSlotId) => sourceImages?.[sourceSlotId])
      .find(hasTemplateImage);
    if (!hasTemplateImage(sourceImage)) {
      continue;
    }
    nextImages[slot.id] = await makeTemplateImageForSlotFromSource(slot.id, sourceImage) || {
      image: sourceImage.image,
      imageUrl: sourceImage.imageUrl || "",
      imageName: sourceImage.imageName || "",
      sourceUrl: sourceImage.sourceUrl || "",
      sourceName: sourceImage.sourceName || "",
    };
    changed = true;
  }
  state.images = nextImages;
  if (changed) {
    templateImagesById[getTemplateStateId()] = cloneTemplateImages(state.images);
  }
  return changed;
}

function getTemplateImageObjectUrlKey(templateId, slotId) {
  return `${normalizeTemplateId(templateId)}::${String(slotId || "").trim()}`;
}

function rememberTemplateImageObjectUrl(templateId, slotId, url) {
  if (!url || !url.startsWith("blob:")) {
    return;
  }
  const key = getTemplateImageObjectUrlKey(templateId, slotId);
  const previous = templateImageObjectUrls.get(key);
  if (previous && previous !== url) {
    URL.revokeObjectURL(previous);
  }
  templateImageObjectUrls.set(key, url);
}

function forgetTemplateImageObjectUrl(templateId, slotId) {
  const key = getTemplateImageObjectUrlKey(templateId, slotId);
  const previous = templateImageObjectUrls.get(key);
  if (previous) {
    URL.revokeObjectURL(previous);
    templateImageObjectUrls.delete(key);
  }
}

async function imageUrlToBlob(imageUrl) {
  if (
    typeof imageUrl !== "string" ||
    (!imageUrl.startsWith("data:image/") && !imageUrl.startsWith("blob:"))
  ) {
    return null;
  }
  const response = await fetch(imageUrl);
  if (!response.ok) {
    return null;
  }
  const blob = await response.blob();
  return blob.type.startsWith("image/") ? blob : null;
}

async function persistTemplateImageSlot(templateId, slotId, imageData) {
  const store = window.NSGlamourTemplateImageStore;
  if (!imageData?.imageUrl || imageData.backupOnly) {
    return;
  }
  const normalizedTemplateId = normalizeTemplateId(templateId);
  try {
    sessionStorage.removeItem(TEMPLATE_IMAGE_LEGACY_SESSION_KEY);
    await store?.deleteSlot?.(normalizedTemplateId, slotId);
  } catch {
    // Stale image cleanup is best-effort; the new save below is authoritative.
  }
  if (!store?.saveSlot) {
    return;
  }
  try {
    await store.saveSlot({
      templateId: normalizedTemplateId,
      slotId,
      imageName: imageData.imageName || "",
      imageUrl: imageData.imageUrl,
      sourceUrl: imageData.sourceUrl || "",
      sourceName: imageData.sourceName || "",
    });
  } catch {
    // Image persistence is best-effort; preview/export should keep working.
  }
}

async function persistCurrentTemplateImages() {
  const templateId = getTemplateStateId();
  await Promise.all(Object.entries(state.images || {}).map(([slotId, imageData]) => (
    hasTemplateImage(imageData) && !imageData.backupOnly
      ? persistTemplateImageSlot(templateId, slotId, imageData)
      : Promise.resolve()
  )));
}

async function loadTemplateImageStoreRecords(templateId) {
  const store = window.NSGlamourTemplateImageStore;
  if (!store?.loadTemplate) {
    return [];
  }
  try {
    return await store.loadTemplate(templateId);
  } catch {
    return [];
  }
}

async function restoreCurrentTemplateImagesFromStore() {
  const templateId = getTemplateStateId();
  const records = await loadTemplateImageStoreRecords(templateId);
  if (getTemplateStateId() !== templateId) {
    return false;
  }
  if (!records.length) {
    return false;
  }
  let changed = false;
  for (const record of records) {
    const currentImage = record?.slotId ? getTemplateImageSlot(record.slotId) : null;
    if (!record?.slotId || (!record.imageUrl && !record.blob) || (currentImage?.image && !currentImage.backupOnly)) {
      continue;
    }
    const imageUrl = record.imageUrl || URL.createObjectURL(record.blob);
    try {
      state.images[record.slotId] = {
        image: await loadImageFromDataUrl(imageUrl),
        imageUrl,
        imageName: record.imageName || "",
        sourceUrl: record.sourceUrl || "",
        sourceName: record.sourceName || "",
        backupUrl: "",
        backupOnly: false,
      };
      rememberTemplateImageObjectUrl(templateId, record.slotId, imageUrl);
      changed = true;
    } catch {
      if (!record.imageUrl) {
        URL.revokeObjectURL(imageUrl);
      }
    }
  }
  if (changed) {
    templateImagesById[templateId] = cloneTemplateImages(state.images);
  }
  return changed;
}

function restoreCurrentTemplateImagesFromStoreInBackground() {
  restoreCurrentTemplateImagesFromStore()
    .then((changed) => {
      if (changed) {
        renderCanvas();
      }
    })
    .catch(() => {});
}

async function restoreCurrentTemplateImages() {
  await restoreCurrentTemplateImagesFromStore();
  await restoreTemplateImagesFromSessionBackup();
}

function saveCurrentTemplateRuntimeState() {
  const templateId = getTemplateStateId();
  templateSettingsById[templateId] = {
    ...state.settings,
    templateId,
    storySwatchColors: normalizeStorySwatchColors(state.settings.storySwatchColors),
    locales: normalizeSelectedTemplateLocales(state.settings.locales, [state.locale || getTemplateDefaultLocale()], getCurrentTemplate()),
  };
  templateImagesById[templateId] = cloneTemplateImages(state.images);
}

function applyTemplateRuntimeState(templateId) {
  const normalizedTemplateId = normalizeTemplateId(templateId);
  currentTemplateId = normalizedTemplateId;
  currentTemplateStateId = normalizedTemplateId;
  const template = getCurrentTemplate();
  const savedSettings = templateSettingsById[normalizedTemplateId] || {};
  state.settings = normalizeSettings({ ...savedSettings, templateId: normalizedTemplateId });
  const defaultLocale = getLocaleForTemplateAndUiLanguage(template);
  state.locale = state.settings.locales[0] || defaultLocale;
  state.images = makeTemplateImageSlots(templateImagesById[normalizedTemplateId] || {});
  activeImageSlotId = getTemplateImageSlotDefinition(DEFAULT_IMAGE_SLOT_ID).id;
}

function normalizeSettings(raw, templateIdOverride = null) {
  const settings = raw && typeof raw === "object" ? raw : {};
  const templateId = normalizeTemplateId(templateIdOverride || settings.templateId);
  currentTemplateId = templateId;
  const template = getCurrentTemplate();
  const defaultLocale = getLocaleForTemplateAndUiLanguage(template);
  const defaults = getDefaultTemplateSettingsFor(templateId);
  const topText = normalizeTemplateTopText(settings.topText ?? defaults.topText, template);
  const legacySubtitleParts = splitEcSubtitleText(settings.ecSubtitleText || "");
  const legacySubtitleHasParts = legacySubtitleParts && !legacySubtitleParts.full;
  const hasStoredSubtitleSymbol = Object.prototype.hasOwnProperty.call(settings, "ecSubtitleSymbolText");
  const localeFallback = Array.isArray(settings.locales) ? [state.locale || defaultLocale] : [defaultLocale];
  return {
    templateId,
    topText,
    characterName: String(settings.characterName ?? defaults.characterName).slice(0, 80),
    bottomText: String(settings.bottomText ?? defaults.bottomText).slice(0, 80),
    ecSubtitleText: String(settings.ecSubtitleText ?? defaults.ecSubtitleText).slice(0, 120),
    ecSubtitleLeftText: String(settings.ecSubtitleLeftText ?? (legacySubtitleHasParts ? legacySubtitleParts.left : settings.ecSubtitleText || defaults.ecSubtitleLeftText)).slice(0, 80),
    ecSubtitleSymbolText: String(hasStoredSubtitleSymbol ? settings.ecSubtitleSymbolText : (legacySubtitleHasParts ? legacySubtitleParts.symbol : defaults.ecSubtitleSymbolText)).slice(0, 4),
    ecSubtitleRightText: String(settings.ecSubtitleRightText ?? (legacySubtitleHasParts ? legacySubtitleParts.right : defaults.ecSubtitleRightText)).slice(0, 80),
    ecSubtitleTouched: Boolean(settings.ecSubtitleTouched ?? defaults.ecSubtitleTouched),
    ecSubtitleAutoText: String(settings.ecSubtitleAutoText ?? defaults.ecSubtitleAutoText).slice(0, 120),
    aspect: normalizeTemplateAspect(settings.aspect ?? defaults.aspect),
    infoWidth: 0,
    padding: clampNumber(settings.padding, 12, 80, defaults.padding),
    nameSize: clampNumber(settings.nameSize, 14, 48, defaults.nameSize),
    dyeSize: clampNumber(settings.dyeSize, 10, 32, defaults.dyeSize),
    showIcons: settings.showIcons ?? defaults.showIcons,
    dyeFrameMode: normalizeFigmaDyeFrameMode(settings.dyeFrameMode || defaults.dyeFrameMode),
    locales: normalizeSelectedTemplateLocales(settings.locales, localeFallback, template),
    textColor: normalizeHexColor(settings.textColor, defaults.textColor),
    panelColor: normalizeHexColor(settings.panelColor, defaults.panelColor),
    storySwatchColors: normalizeStorySwatchColors(settings.storySwatchColors || defaults.storySwatchColors),
  };
}

function loadSettings() {
  try {
    const rawSettings = JSON.parse(localStorage.getItem(TEMPLATE_SETTINGS_KEY) || "{}");
    const shouldResetLegacyTemplateSubtitles = Number(rawSettings?.version || 0) < 3;
    const uiDefaultTemplate = getTemplateDefaultForUiLanguage();
    const storedTemplateId = normalizeTemplateId(rawSettings?.templateId);
    const selectedTemplate = TEMPLATE_DEFINITIONS[storedTemplateId] || uiDefaultTemplate;
    const uiLocale = getTemplateLocaleForUiLanguage();
    const selectedTemplateId = templateSupportsLocale(selectedTemplate, uiLocale)
      ? selectedTemplate.id
      : uiDefaultTemplate.id;
    const rawTemplateSettings = rawSettings?.templates && typeof rawSettings.templates === "object"
      ? rawSettings.templates
      : {};
    templateSettingsById = {};
    TEMPLATE_SELECT_ORDER.forEach((templateId) => {
      const legacySettings = rawSettings?.templates || templateId !== selectedTemplateId ? {} : rawSettings;
      templateSettingsById[templateId] = normalizeSettings(
        { ...legacySettings, ...(rawTemplateSettings[templateId] || {}), templateId },
        templateId,
      );
      if (shouldResetLegacyTemplateSubtitles && TEMPLATE_DEFINITIONS[templateId]?.controls?.ecSubtitle === true) {
        templateSettingsById[templateId] = {
          ...templateSettingsById[templateId],
          ecSubtitleText: "",
          ecSubtitleLeftText: "",
          ecSubtitleSymbolText: "♦",
          ecSubtitleRightText: "",
          ecSubtitleTouched: false,
          ecSubtitleAutoText: "",
        };
      }
    });
    hasStoredTemplateLocalePrefs = Boolean(
      rawSettings &&
      typeof rawSettings === "object" &&
      (
        Array.isArray(rawSettings.locales) ||
        Object.values(rawTemplateSettings).some((settings) => Array.isArray(settings?.locales))
      )
    );
    templateImagesById = {};
    applyTemplateRuntimeState(selectedTemplateId);
  } catch {
    hasStoredTemplateLocalePrefs = false;
    templateSettingsById = {};
    TEMPLATE_SELECT_ORDER.forEach((templateId) => {
      templateSettingsById[templateId] = normalizeSettings({ templateId }, templateId);
    });
    templateImagesById = {};
    applyTemplateRuntimeState(getTemplateDefaultForUiLanguage().id);
  }
  writeSettings();
  syncSettingsControls();
}

function writeSettings() {
  saveCurrentTemplateRuntimeState();
  const templateId = getTemplateStateId();
  const templates = {};
  TEMPLATE_SELECT_ORDER.forEach((id) => {
    templates[id] = normalizeSettings({ ...(templateSettingsById[id] || {}), templateId: id }, id);
  });
  currentTemplateId = templateId;
  currentTemplateStateId = templateId;
  localStorage.setItem(TEMPLATE_SETTINGS_KEY, JSON.stringify({
    version: 3,
    templateId,
    templates,
  }));
}

function syncSettingsControls() {
  renderTemplateSelector();
  const controls = getCurrentTemplate().controls || {};
  document.querySelectorAll(".template-title-field").forEach((element) => {
    element.classList.toggle("hidden", controls.title === false);
  });
  document.querySelectorAll(".template-character-name-field").forEach((element) => {
    element.classList.toggle("hidden", controls.characterName !== true);
  });
  document.querySelectorAll(".template-ec-subtitle-field").forEach((element) => {
    element.classList.toggle("hidden", controls.ecSubtitle !== true);
  });
  document.querySelectorAll(".template-dye-frame-field").forEach((element) => {
    element.classList.toggle("hidden", controls.dyeFrame === false);
  });
  document.querySelectorAll(".template-story-swatch-field").forEach((element) => {
    element.classList.toggle("hidden", controls.storySwatches !== true);
  });
  templateTopTextInput.value = state.settings.topText;
  if (templateCharacterNameInput) {
    templateCharacterNameInput.value = state.settings.characterName;
  }
  syncEcSubtitleControls();
  if (templateEcSubtitleSymbolInput) {
    templateEcSubtitleSymbolInput.style.fontFamily = "'NS Cambria', Cambria, serif";
  }
  templateDyeFrameControls?.querySelectorAll("[data-template-dye-frame]").forEach((button) => {
    button.classList.toggle("active", button.dataset.templateDyeFrame === state.settings.dyeFrameMode);
  });
  renderStorySwatchControls();
}

function syncTemplateMeta() {
  const template = getCurrentTemplate();
  if (templateAuthor) {
    renderTemplateAuthor(templateAuthor, template);
  }
}

function formatTemplateAuthor(template) {
  return `${getUiLocalizedText(TEMPLATE_AUTHOR_PREFIX)}${template.author}`;
}

function getTemplatePreviewUrl(template) {
  return template.previewUrl || TEMPLATE_AUTHOR_PREVIEW_FALLBACK_URL;
}

function renderTemplateAuthor(container, template, options = {}) {
  container.innerHTML = "";
  const prefix = document.createElement("span");
  prefix.textContent = getUiLocalizedText(TEMPLATE_AUTHOR_PREFIX);
  container.appendChild(prefix);
  const authorUrl = String(template.authorUrl || "").trim();
  const authorName = template.author || "Unknown";
  if (authorUrl) {
    const link = document.createElement("a");
    link.className = options.compact ? "template-author-link compact" : "template-author-link";
    link.href = authorUrl;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = authorName;
    link.title = `${authorName} 主页`;
    container.appendChild(link);
    return;
  }
  const name = document.createElement("span");
  name.className = options.compact ? "template-author-link compact is-disabled" : "template-author-link is-disabled";
  name.textContent = authorName;
  container.appendChild(name);
}

function formatTemplateOptionTitle(template) {
  return `${formatTemplateAuthor(template)} ${template.summary || ""}`.trim();
}

function getTemplateLanguageSummary(template) {
  const languageOptions = getTemplateLanguageOptions(template);
  if (languageOptions.length) {
    return languageOptions.map((option) => option.label).join(" ");
  }
  return getTemplateLocaleOrder(template).map((locale) => LOCALE_LABELS[locale] || locale).join(" ");
}

function renderTemplateSupportedLanguageCodes(container, template) {
  container.innerHTML = "";
  const languageOptions = getTemplateLanguageOptions(template);
  if (languageOptions.length) {
    languageOptions.forEach((option) => {
      const code = document.createElement("span");
      code.className = "template-language-code";
      code.textContent = option.label;
      container.appendChild(code);
    });
    return;
  }
  getTemplateLocaleOrder(template).forEach((locale) => {
    const code = document.createElement("span");
    code.className = "template-language-code";
    code.textContent = LOCALE_LABELS[locale] || locale;
    container.appendChild(code);
  });
}

function getTemplateSelectorFilterLocales() {
  const locales = [];
  getTemplatesForUiLanguage().forEach((template) => {
    getTemplateLocaleOrder(template).forEach((locale) => {
      if (!locales.includes(locale)) {
        locales.push(locale);
      }
    });
  });
  const ordered = LOCALE_ORDER.filter((locale) => locales.includes(locale));
  const extra = locales.filter((locale) => !ordered.includes(locale));
  return [...ordered, ...extra];
}

function renderTemplateSelectorFilters() {
  if (!templateSelectorFilterControls) {
    return;
  }
  templateSelectorFilterControls.innerHTML = "";
  const filters = [TEMPLATE_SELECTOR_FILTER_ALL, ...getTemplateSelectorFilterLocales()];
  filters.forEach((filter) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "template-selector-filter-button";
    button.classList.toggle("active", filter === templateSelectorFilter);
    button.textContent = filter === TEMPLATE_SELECTOR_FILTER_ALL ? "全部" : LOCALE_LABELS[filter] || filter;
    button.addEventListener("click", () => {
      templateSelectorFilter = filter;
      renderTemplateSelector();
    });
    templateSelectorFilterControls.appendChild(button);
  });
}

function openTemplateSelectorDialog() {
  if (!templateSelectorOverlay) {
    return;
  }
  templateSelectorFilter = TEMPLATE_SELECTOR_FILTER_ALL;
  templateSelectorOverlay.classList.remove("hidden");
  templateSelectorOverlay.setAttribute("aria-hidden", "false");
  renderTemplateSelector();
  templateSelectorControls?.querySelector(".template-selector-card.active")?.focus();
}

function closeTemplateSelectorDialog() {
  if (!templateSelectorOverlay) {
    return;
  }
  templateSelectorOverlay.classList.add("hidden");
  templateSelectorOverlay.setAttribute("aria-hidden", "true");
  templateSelectorOpenButton?.focus();
}

function updateStorySwatchColor(index, value) {
  const colors = normalizeStorySwatchColors(state.settings.storySwatchColors);
  colors[index] = normalizeOptionalHexColor(value);
  state.settings.storySwatchColors = colors;
  writeSettings();
  renderCanvas();
}

function renderStorySwatchControls() {
  if (!storySwatchControls) {
    return;
  }
  const colors = normalizeStorySwatchColors(state.settings.storySwatchColors);
  const focusedControl = storySwatchControls.contains(document.activeElement)
    ? {
      index: document.activeElement.dataset?.storySwatchIndex || "",
      role: document.activeElement.dataset?.storySwatchControl || "",
      selectionStart: document.activeElement.selectionStart,
      selectionEnd: document.activeElement.selectionEnd,
    }
    : null;

  storySwatchControls.innerHTML = "";
  colors.forEach((color, index) => {
    const row = document.createElement("label");
    row.className = "template-story-swatch-row";

    const marker = document.createElement("span");
    marker.className = "template-story-swatch-index";
    marker.textContent = String(index + 1);

    const picker = document.createElement("input");
    picker.className = "png-setting-color template-story-swatch-picker";
    picker.type = "color";
    picker.value = color || STORY_TEMPLATE_DEFAULT_SWATCH_COLORS[index] || "#ffffff";
    picker.dataset.storySwatchIndex = String(index);
    picker.dataset.storySwatchControl = "picker";
    picker.addEventListener("input", () => {
      updateStorySwatchColor(index, picker.value);
      renderStorySwatchControls();
    });

    const input = document.createElement("input");
    input.className = "template-text-input template-story-swatch-input";
    input.type = "text";
    input.inputMode = "text";
    input.spellcheck = false;
    input.placeholder = "#RRGGBB";
    input.value = color;
    input.dataset.storySwatchIndex = String(index);
    input.dataset.storySwatchControl = "text";
    input.addEventListener("input", () => {
      const normalized = normalizeOptionalHexColor(input.value);
      if (normalized) {
        picker.value = normalized;
      }
      updateStorySwatchColor(index, input.value);
    });
    input.addEventListener("blur", () => {
      renderStorySwatchControls();
    });

    row.append(marker, picker, input);
    storySwatchControls.appendChild(row);
  });

  if (focusedControl) {
    const selector = `[data-story-swatch-index="${focusedControl.index}"][data-story-swatch-control="${focusedControl.role}"]`;
    const nextFocus = storySwatchControls.querySelector(selector);
    if (nextFocus) {
      nextFocus.focus();
      if (
        focusedControl.role === "text" &&
        Number.isFinite(focusedControl.selectionStart) &&
        typeof nextFocus.setSelectionRange === "function"
      ) {
        nextFocus.setSelectionRange(focusedControl.selectionStart, focusedControl.selectionEnd);
      }
    }
  }
}

function renderTemplateSelector() {
  if (!templateSelectorControls) {
    return;
  }
  if (
    templateSelectorFilter !== TEMPLATE_SELECTOR_FILTER_ALL &&
    !getTemplateSelectorFilterLocales().includes(templateSelectorFilter)
  ) {
    templateSelectorFilter = TEMPLATE_SELECTOR_FILTER_ALL;
  }
  renderTemplateSelectorFilters();
  templateSelectorControls.innerHTML = "";
  const templates = getTemplatesForUiLanguage()
    .filter((template) => templateSelectorFilter === TEMPLATE_SELECTOR_FILTER_ALL || getTemplateLocaleOrder(template).includes(templateSelectorFilter));
  if (!templates.length) {
    const empty = document.createElement("p");
    empty.className = "search-empty";
    empty.textContent = getUiLocalizedText("当前界面语言没有可用模板");
    templateSelectorControls.appendChild(empty);
    return;
  }
  templates.forEach((template) => {
    const isActive = template.id === state.settings.templateId;
    const card = document.createElement("article");
    card.className = "template-selector-card";
    card.classList.toggle("active", isActive);
    card.dataset.templateId = template.id;
    card.setAttribute("role", "option");
    card.setAttribute("aria-selected", isActive ? "true" : "false");
    card.tabIndex = 0;
    card.title = localizeUiText("{value}；支持语言：{value}", [
      formatTemplateOptionTitle(template),
      getTemplateLanguageSummary(template),
    ]);

    const preview = document.createElement("span");
    preview.className = "template-selector-preview";
    const previewImage = document.createElement("img");
    previewImage.src = getTemplatePreviewUrl(template);
    previewImage.alt = "";
    previewImage.loading = "lazy";
    preview.appendChild(previewImage);
    card.appendChild(preview);

    const body = document.createElement("span");
    body.className = "template-selector-card-body";
    const author = document.createElement("span");
    author.className = "template-selector-author";
    renderTemplateAuthor(author, template, { compact: true });
    body.appendChild(author);

    const languages = document.createElement("span");
    languages.className = "template-selector-languages";
    renderTemplateSupportedLanguageCodes(languages, template);
    body.appendChild(languages);
    card.appendChild(body);

    const selectTemplate = async () => {
      closeTemplateSelectorDialog();
      await switchTemplate(template.id);
    };
    card.addEventListener("click", (event) => {
      if (event.target.closest("a")) {
        event.stopPropagation();
        return;
      }
      selectTemplate();
    });
    card.addEventListener("keydown", (event) => {
      if (event.target.closest("a")) {
        return;
      }
      if (event.key !== "Enter" && event.key !== " ") {
        return;
      }
      event.preventDefault();
      selectTemplate();
    });
    templateSelectorControls.appendChild(card);
  });
}

async function ensureTemplateSupportsCurrentUiLanguage({ saveDraft = true } = {}) {
  const uiLocale = getTemplateLocaleForUiLanguage();
  const currentTemplate = getCurrentTemplate();
  if (templateSupportsLocale(currentTemplate, uiLocale)) {
    if (state.locale !== uiLocale || state.settings.locales[0] !== uiLocale) {
      state.locale = uiLocale;
      state.settings.locales = normalizeSelectedTemplateLocales([uiLocale], [uiLocale], currentTemplate);
      await ensureStains(state.locale);
      await ensureTemplateLocalesReady();
      writeSettings();
      if (saveDraft) {
        writeCurrentDraft();
      }
      return true;
    }
    renderTemplateSelector();
    return false;
  }

  const fallbackTemplate = getTemplateDefaultForUiLanguage();
  if (!fallbackTemplate || fallbackTemplate.id === currentTemplate.id) {
    renderTemplateSelector();
    return false;
  }

  const previousImages = cloneTemplateImages(state.images);
  saveCurrentTemplateRuntimeState();
  applyTemplateRuntimeState(fallbackTemplate.id);
  await restoreCurrentTemplateImages();
  await carryTemplateImagesIntoCurrentTemplate(previousImages);
  const locale = getLocaleForTemplateAndUiLanguage(fallbackTemplate);
  state.locale = locale;
  state.settings.locales = normalizeSelectedTemplateLocales([locale], [locale], fallbackTemplate);
  await ensureStains(state.locale);
  await ensureTemplateLocalesReady();
  writeSettings();
  if (saveDraft) {
    writeCurrentDraft();
  }
  return true;
}

async function switchTemplate(templateId) {
  const nextTemplateId = normalizeTemplateId(templateId);
  const nextTemplate = TEMPLATE_DEFINITIONS[nextTemplateId];
  if (!nextTemplate || !templateSupportsLocale(nextTemplate, getTemplateLocaleForUiLanguage())) {
    setStatus("当前界面语言不支持此模板", true);
    return;
  }
  if (nextTemplateId === state.settings.templateId) {
    return;
  }
  const loadingTaskId = beginTemplateLoadingTask();
  try {
    const previousImages = cloneTemplateImages(state.images);
    saveCurrentTemplateRuntimeState();
    applyTemplateRuntimeState(nextTemplateId);
    await restoreCurrentTemplateImages();
    await carryTemplateImagesIntoCurrentTemplate(previousImages);
    const uiLocale = getLocaleForTemplateAndUiLanguage(getCurrentTemplate());
    state.locale = uiLocale;
    state.settings.locales = normalizeSelectedTemplateLocales([uiLocale], [uiLocale], getCurrentTemplate());
    await ensureTemplateLocalesReady();
    writeSettings();
    writeCurrentDraft();
    syncSettingsControls();
    await render({ loadingTaskId });
  } finally {
    finishTemplateLoadingTask(loadingTaskId);
  }
}

function buildCurrentDraft() {
  sanitizeRows(state.rows);
  return {
    version: 1,
    sourceName: state.sourceName,
    sourceMeta: state.sourceMeta && typeof state.sourceMeta === "object" ? { ...state.sourceMeta } : {},
    createdAt: new Date().toISOString(),
    entries: getFilledRows().map((row) => {
      const { _source, ...item } = row.item || {};
      return { slot: row.slot, item };
    }),
  };
}

function writeCurrentDraft() {
  if (isApplyingDraft) {
    return;
  }
  if (!getFilledRows().length) {
    localStorage.removeItem(CARD_DRAFT_KEY);
    return;
  }
  localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(buildCurrentDraft()));
  syncTemplateToStore();
}

function readRecentCache() { return NSGlamourCommon.readRecentCache(); }
function writeRecentCache(items) { return NSGlamourCommon.writeRecentCache(items); }
function formatRecentTime(value) { return NSGlamourCommon.formatRecentTime(value); }

function getRecentDisplayName(item) {
  return String(item?.displayName || item?.sourceName || "").trim() || "未命名";
}

function getRecentEquipmentCount(item) {
  return Array.isArray(item?.parsed?.resolved_equipment) ? item.parsed.resolved_equipment.length : 0;
}

function buildDraftFromRecentSnapshot(item) {
  if (!item?.parsed) {
    return null;
  }
  const draft = buildDraftFromParsedPayload(item.parsed, { includeEcSubtitle: false });
  return {
    ...draft,
    sourceName: "手动编辑",
    sourceMeta: {},
    locale: item.locale || draft.locale || DEFAULT_LOCALE,
    ecSubtitleText: "",
  };
}

async function restoreRecentSnapshot(item) {
  const draft = buildDraftFromRecentSnapshot(item);
  if (!draft?.entries?.length) {
    setStatus("这条历史记录没有可导入的装备", true);
    return;
  }

  const loadingTaskId = beginTemplateLoadingTask();
  try {
    localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(draft));
    applyDraft(draft);
    const templateDefaultLocale = getLocaleForTemplateAndUiLanguage(getCurrentTemplate());
    const preferredLocale = getTemplateLocaleOrder().includes(draft.locale) ? draft.locale : templateDefaultLocale;
    state.locale = preferredLocale;
    state.settings.locales = normalizeSelectedTemplateLocales([state.locale], [state.locale]);
    await hydrateMissingItemRarity();
    await ensureStains(state.locale);
    await ensureTemplateLocalesReady();
    writeCurrentDraft();
    closeRecentPanel();
    setStatus(localizeUiText("已载入 {value} 个装备", getFilledRows().length));
    await render({ loadingTaskId });
  } finally {
    finishTemplateLoadingTask(loadingTaskId);
  }
}

function deleteRecentSnapshot(id) {
  writeRecentCache(readRecentCache().filter((item) => item.id !== id));
  renderRecentList();
}

function renderRecentList() {
  if (!templateRecentList) {
    return;
  }
  const items = readRecentCache();
  templateRecentList.innerHTML = "";
  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "recent-empty";
    empty.textContent = "暂无缓存";
    templateRecentList.appendChild(empty);
    return;
  }

  for (const item of items) {
    const row = document.createElement("div");
    row.className = "recent-item-row";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "recent-item";
    button.addEventListener("click", () => restoreRecentSnapshot(item));

    const name = document.createElement("strong");
    name.textContent = getRecentDisplayName(item);
    button.appendChild(name);

    const meta = document.createElement("span");
    meta.textContent = `${getRecentEquipmentCount(item)} 个部位 · ${formatRecentTime(item.savedAt)}`;
    button.appendChild(meta);

    const deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.className = "recent-delete";
    deleteButton.title = "删除这条记录";
    deleteButton.setAttribute("aria-label", `删除 ${getRecentDisplayName(item)}`);
    deleteButton.textContent = "×";
    deleteButton.addEventListener("click", (event) => {
      event.stopPropagation();
      deleteRecentSnapshot(item.id);
    });

    row.append(button, deleteButton);
    templateRecentList.appendChild(row);
  }
  window.NSGlamourUiLanguage?.refresh?.(templateRecentList);
}

function refreshOpenRecentPanel() {
  if (templateRecentPanel && !templateRecentPanel.classList.contains("hidden")) {
    renderRecentList();
  }
}

function openRecentPanel() {
  window.NSGlamourUiLanguage?.closeMenu?.();
  renderRecentList();
  templateRecentPanel?.classList.remove("hidden");
}

function closeRecentPanel() {
  templateRecentPanel?.classList.add("hidden");
}

function toggleRecentPanel() {
  if (!templateRecentPanel || templateRecentPanel.classList.contains("hidden")) {
    openRecentPanel();
    return;
  }
  closeRecentPanel();
}

function updateDyeDisplay(item) {
  const entries = item.dye_entries || [];
  item.dye_display = entries.map((entry) => getStainName(entry.id) || entry.name || "").join(" | ");
  item.dye_display_by_locale = {
    ...item.dye_display_by_locale,
    [state.locale]: item.dye_display,
  };
}

function normalizeDyeEntries(item, options = {}) {
  const dyeCount = Math.max(0, Math.min(Number(options.dyeCount ?? item?.dye_count ?? 0), 2));
  if (dyeCount <= 0) {
    return [];
  }
  const display = resolveLocalized(item?.dye_display_by_locale) || item?.dye_display || "";
  const displayParts = display.split("|").map((part) => part.trim()).filter(Boolean);
  const sourceEntries = Array.isArray(options.sourceDyeEntries) ? options.sourceDyeEntries : item?.dye_entries;
  const entries = Array.isArray(sourceEntries)
    ? sourceEntries.slice(0, dyeCount).map((entry) => localizeDyeEntry(entry, state.locale) || makeNoDyeEntry())
    : [];

  if (!entries.length && displayParts.length) {
    for (const part of displayParts.slice(0, dyeCount)) {
      const stain = findStainByName(part) || { id: 0, name: part, hex: "#000000", rgb: 0 };
      entries.push({
        id: stain.id,
        names: { [state.locale]: stain.name },
        name: stain.name,
        hex: stain.hex,
        rgb: stain.rgb,
      });
    }
  }
  while (entries.length < dyeCount) {
    entries.push(makeNoDyeEntry());
  }
  return entries;
}

function normalizeImportedItem(item, options = {}) {
  if (!item) {
    return null;
  }
  const dyeCount = getItemDyeCount(item, options.slot);
  const itemDyeEntries = Array.isArray(item.dye_entries) ? item.dye_entries : [];
  const previousDyeEntries = Array.isArray(options.previousItem?.dye_entries) ? options.previousItem.dye_entries : [];
  const sourceDyeEntries = itemDyeEntries.length ? itemDyeEntries : previousDyeEntries;
  const normalized = {
    key: item.key,
    key_label: item.key_label || "物品ID",
    names: item.names || {},
    name: NSGlamourCommon.cleanDataminingText(item.name || resolveLocalized(item.names) || ""),
    icon: item.icon || 0,
    rarity: Number(item.rarity || 1) || 1,
    equip_slot_category: item.equip_slot_category || 0,
    model_main: item.model_main || {},
    dye_count: dyeCount,
    dye_display_by_locale: item.dye_display_by_locale || {},
    dye_display: NSGlamourCommon.cleanDataminingText(item.dye_display || ""),
    dye_entries: [],
    ec_variant_label: item.ec_variant_label || "",
    ec_variant_kind: item.ec_variant_kind || "",
    is_emperor: item.is_emperor === true,
  };
  normalized.dye_entries = normalizeDyeEntries(normalized, { dyeCount, sourceDyeEntries });
  return normalized;
}

function sanitizeRows(rows) {
  rows.forEach((row) => {
    if (row.item) {
      const source = row.item._source;
      row.item = normalizeImportedItem(row.item, { slot: row.slot });
      if (row.item && source) {
        row.item._source = source;
      }
    }
  });
  const mainHand = rows.find((row) => row.slot === "MainHand" && row.item);
  if (itemBlocksOffHand(mainHand?.item)) {
    const offHand = rows.find((row) => row.slot === "OffHand");
    if (offHand) {
      offHand.item = null;
    }
  }
  return rows;
}

function hasExplicitItemRarity(item) {
  return item && item.rarity !== undefined && item.rarity !== null && item.rarity !== "";
}

function getMissingItemNameLocales(item) {
  const names = item?.names && typeof item.names === "object" ? item.names : {};
  return getSelectedTemplateLocales().filter((locale) => !names[locale]);
}

function mergeItemSearchMetadata(target, source) {
  if (!target || !source) {
    return false;
  }
  let changed = false;
  const sourceNames = source.names && typeof source.names === "object" ? source.names : {};
  if (Object.keys(sourceNames).length) {
    const mergedNames = { ...(target.names || {}) };
    Object.entries(sourceNames).forEach(([locale, name]) => {
      const value = NSGlamourCommon.cleanDataminingText(name);
      if (value && mergedNames[locale] !== value) {
        mergedNames[locale] = value;
        changed = true;
      }
    });
    if (changed) {
      target.names = mergedNames;
    }
  }
  if (hasExplicitItemRarity(source) && Number(target.rarity || 0) !== Number(source.rarity || 1)) {
    target.rarity = Number(source.rarity || 1) || 1;
    changed = true;
  }
  return changed;
}

async function hydrateMissingItemRarity() {
  const targets = getFilledRows().filter((row) => (
    row.item
    && (
      !hasExplicitItemRarity(row.item._source || row.item)
      || getMissingItemNameLocales(row.item).length > 0
    )
  ));
  if (!targets.length) {
    return false;
  }

  let changed = false;
  for (const row of targets) {
    const query = row.item.key ? String(row.item.key) : getItemName(row.item, state.locale);
    if (!query) {
      continue;
    }
    try {
      const params = new URLSearchParams({ slot: row.slot, q: query, locale: state.locale, limit: "10" });
      const response = await fetch(appPath(`/api/search-items?${params.toString()}`), { cache: "no-store" });
      const data = await response.json();
      const results = Array.isArray(data.results) ? data.results : [];
      const match = results.find((item) => String(item.key || "") === String(row.item.key || "")) || results[0];
      changed = mergeItemSearchMetadata(row.item, match) || changed;
    } catch {
      // Missing metadata is non-fatal; the renderer falls back to stored item data.
    }
  }
  if (changed) {
    writeCurrentDraft();
  }
  return changed;
}

function applyDraft(draft) {
  isApplyingDraft = true;
  try {
    const rows = makeRows();
    for (const entry of Array.isArray(draft.entries) ? draft.entries : []) {
      if (readIgnoreEmperor() && entry.item?.is_emperor === true) {
        continue;
      }
      const row = rows.find((candidate) => candidate.slot === entry.slot);
      if (row) {
        row.item = normalizeImportedItem(entry.item, { slot: row.slot });
        if (row.item) {
          row.item._source = entry.item || {};
        }
      }
    }
    state.sourceName = draft.sourceName || "第一页导入";
    state.sourceMeta = draft.sourceMeta && typeof draft.sourceMeta === "object" ? { ...draft.sourceMeta } : {};
    state.rows = sanitizeRows(rows);
  } finally {
    isApplyingDraft = false;
  }
}

function buildDraftFromParsedPayload(parsed, options = {}) {
  const entries = (Array.isArray(parsed?.resolved_equipment) ? parsed.resolved_equipment : [])
    .map((entry) => {
      const candidate = Array.isArray(entry.candidates) ? entry.candidates[0] : null;
      if (!entry?.slot || !candidate) {
        return null;
      }
      return {
        slot: entry.slot,
        item: normalizeImportedItem({
          ...candidate,
          dye_count: candidate.dye_count || 0,
          dye_display: resolveLocalized(candidate.dye_display_by_locale, parsed.default_locale || DEFAULT_LOCALE) || candidate.dye_display || "",
          dye_display_by_locale: candidate.dye_display_by_locale || {},
          dye_entries: Array.isArray(candidate.dye_entries) ? candidate.dye_entries : [],
        }, { slot: entry.slot }),
      };
    })
    .filter(Boolean);
  return {
    version: 1,
    sourceName: parsed?.source_name || parsed?.source_title || "幻化站导入",
    sourceMeta: buildTemplateSourceMeta(parsed),
    ecSubtitleText: options.includeEcSubtitle === true ? getImportedEcSubtitleText(parsed) : "",
    locale: parsed?.default_locale || DEFAULT_LOCALE,
    createdAt: new Date().toISOString(),
    entries,
  };
}

function buildTemplateSourceMeta(parsed) {
  const author = parsed?.author && typeof parsed.author === "object" ? parsed.author : {};
  const sourceUrl = String(parsed?.source_url || "").trim();
  const sourceIdMatch = sourceUrl.match(/(?:detail\/|[?&](?:id|glamour_id|glamourId)=)(\d+)/i);
  return {
    fileType: String(parsed?.file_type || "").trim(),
    sourceTitle: String(parsed?.source_title || parsed?.source_name || "").trim(),
    sourceUrl,
    sourceId: sourceIdMatch ? sourceIdMatch[1] : "",
    authorName: String(author.name || "").trim(),
    authorWorld: String(author.world || "").trim(),
    authorLabel: String(author.label || parsed?.source_author || "").trim(),
    race: String(parsed?.race || "").trim(),
    gender: String(parsed?.gender || "").trim(),
  };
}

function getImportedEcSubtitleText(parsed) {
  const author = parsed?.author && typeof parsed.author === "object" ? parsed.author : {};
  const name = String(author.name || "").trim();
  const world = String(author.world || "").trim();
  return name && world ? `${name} ♦ ${world}` : "";
}

async function importTemplateGlamourLink(event) {
  event?.preventDefault();
  const url = normalizeGlamourLinkUrl(templateImportUrlInput?.value);
  if (!url) {
    setStatus("请输入石之家或 Eorzea Collection 幻化链接", true);
    setTemplateImportHint("请输入石之家或 Eorzea Collection 幻化链接", true);
    templateImportUrlInput?.focus();
    return;
  }
  if (!getGlamourLinkKind(url)) {
    setStatus("无法识别，请输入石之家或 Eorzea Collection 幻化链接", true);
    setTemplateImportHint("无法识别，请输入石之家或 Eorzea Collection 幻化链接", true);
    return;
  }

  if (templateImportSubmitButton) {
    templateImportSubmitButton.disabled = true;
  }
  const loadingTaskId = beginTemplateLoadingTask();
  setStatus("正在载入网页数据……");
  setTemplateImportHint("正在载入网页数据……");
  try {
    const parsed = await fetchJson("/api/import-glamour-link", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const draft = buildDraftFromParsedPayload(parsed);
    if (!draft.entries.length) {
      throw new Error(getUiLocalizedText("未识别到可导入装备"));
    }
    localStorage.setItem(CARD_DRAFT_KEY, JSON.stringify(draft));
    applyDraft(draft);
    const templateDefaultLocale = getLocaleForTemplateAndUiLanguage(getCurrentTemplate());
    const availableLocales = parsed?.locales || [];
    state.locale = availableLocales.includes(templateDefaultLocale)
      ? templateDefaultLocale
      : parsed.default_locale || DEFAULT_LOCALE;
    state.settings.locales = normalizeSelectedTemplateLocales([state.locale], [state.locale]);
    syncSettingsControls();
    await hydrateMissingItemRarity();
    await ensureStains(state.locale);
    await ensureTemplateLocalesReady();
    writeCurrentDraft();
    closeTemplateImportDialog();
    setStatus(localizeUiText("已载入 {value} 个装备", getFilledRows().length));
    await render({ loadingTaskId });
  } catch (error) {
    setStatus(error.message || "载入网页数据失败", true);
    setTemplateImportHint(error.message || "载入网页数据失败", true);
  } finally {
    finishTemplateLoadingTask(loadingTaskId);
    if (templateImportSubmitButton) {
      templateImportSubmitButton.disabled = false;
    }
  }
}

async function loadDraft() {
  const raw = localStorage.getItem(CARD_DRAFT_KEY);
  if (!raw) {
    state.sourceName = "手动编辑";
    state.sourceMeta = {};
    state.rows = makeRows();
    setStatus("");
    return;
  }
  try {
    applyDraft(JSON.parse(raw));
    if (!hasStoredTemplateLocalePrefs) {
      const defaultLocale = getLocaleForTemplateAndUiLanguage(getCurrentTemplate());
      state.locale = defaultLocale;
      state.settings.locales = normalizeSelectedTemplateLocales([defaultLocale], [defaultLocale]);
    }
    await hydrateMissingItemRarity();
    await ensureStains(state.locale);
    await ensureTemplateLocalesReady();
    setStatus(localizeUiText("已载入 {value} 个装备", getFilledRows().length));
  } catch {
    state.sourceName = "手动编辑";
    state.sourceMeta = {};
    state.rows = makeRows();
    setStatus("配装读取失败", true);
  }
}

function resetDraft() {
  state.sourceName = "手动编辑";
  state.sourceMeta = {};
  state.rows = makeRows();
  localStorage.removeItem(CARD_DRAFT_KEY);
  lastTemplateStoreSyncSignature = "";
  NSGlamourStore.equipment.clear();
  setStatus("已清空配装");
  render();
}

function getSelectedTemplateLocales() {
  const template = getCurrentTemplate();
  const defaultLocale = getTemplateDefaultLocale(template);
  const languageOptions = getTemplateLanguageOptions(template);
  if (languageOptions.length) {
    const currentLocales = normalizeTemplateLocales(state.settings.locales, [state.locale || defaultLocale], template);
    const option = languageOptions.find((item) => areSameTemplateLocales(item.locales, currentLocales))
      || languageOptions.find((item) => item.locales.includes(state.locale))
      || languageOptions.find((item) => item.locales.includes(defaultLocale))
      || languageOptions[0];
    state.settings.locales = option.locales.slice();
    if (!state.settings.locales.includes(state.locale)) {
      state.locale = state.settings.locales[0] || defaultLocale;
    }
    return state.settings.locales.slice();
  }

  state.settings.locales = normalizeSelectedTemplateLocales(state.settings.locales, [state.locale || defaultLocale], template);
  if (!state.settings.locales.includes(state.locale)) {
    state.locale = state.settings.locales[0] || defaultLocale;
  }
  return state.settings.locales.slice();
}

function getSelectedTemplateLanguageOption(template = getCurrentTemplate()) {
  const languageOptions = getTemplateLanguageOptions(template);
  if (!languageOptions.length) {
    return null;
  }
  const defaultLocale = getTemplateDefaultLocale(template);
  const selectedLocales = normalizeTemplateLocales(state.settings.locales, [state.locale || defaultLocale], template);
  return languageOptions.find((option) => areSameTemplateLocales(option.locales, selectedLocales))
    || languageOptions.find((option) => option.locales.includes(state.locale))
    || languageOptions.find((option) => option.locales.includes(defaultLocale))
    || languageOptions[0];
}

function moveTemplateLocale(locale, direction) {
  if (isSingleTemplateLanguageMode()) {
    return;
  }
  const selected = getSelectedTemplateLocales();
  const index = selected.indexOf(locale);
  const nextIndex = index + direction;
  if (index < 0 || nextIndex < 0 || nextIndex >= selected.length) {
    return;
  }
  [selected[index], selected[nextIndex]] = [selected[nextIndex], selected[index]];
  state.settings.locales = selected;
  writeSettings();
  render();
}

async function removeTemplateLocale(locale) {
  if (isSingleTemplateLanguageMode()) {
    return;
  }
  const selected = getSelectedTemplateLocales();
  if (!selected.includes(locale)) {
    return;
  }
  if (selected.length <= 1) {
    setStatus("至少保留一种模板语言", true);
    return;
  }

  state.settings.locales = selected.filter((item) => item !== locale);
  if (state.locale === locale) {
    state.locale = state.settings.locales[0] || getTemplateDefaultLocale();
    await ensureStains(state.locale);
  }
  writeSettings();
  writeCurrentDraft();
  render();
}

async function toggleTemplateLocale(locale) {
  const languageOptions = getTemplateLanguageOptions();
  if (languageOptions.length) {
    const option = languageOptions.find((item) => item.id === locale || item.locales.includes(locale));
    if (!option) {
      return;
    }
    state.settings.locales = option.locales.slice();
    state.locale = state.settings.locales[0] || getTemplateDefaultLocale();
    await ensureTemplateLocalesReady();
    await hydrateMissingItemRarity();
    writeSettings();
    writeCurrentDraft();
    render();
    return;
  }

  if (!getTemplateLocaleOrder().includes(locale)) {
    return;
  }

  if (isSingleTemplateLanguageMode()) {
    state.locale = locale;
    state.settings.locales = normalizeSelectedTemplateLocales([locale], [getTemplateDefaultLocale()]);
    await ensureStains(state.locale);
    await hydrateMissingItemRarity();
    writeSettings();
    writeCurrentDraft();
    render();
    return;
  }

  const selected = getSelectedTemplateLocales();
  const isSelected = selected.includes(locale);
  if (isSelected && locale !== state.locale) {
    state.locale = locale;
  } else if (isSelected && selected.length > 1) {
    state.settings.locales = selected.filter((item) => item !== locale);
    if (state.locale === locale) {
      state.locale = state.settings.locales[0] || getTemplateDefaultLocale();
    }
  } else if (isSelected) {
    setStatus("至少保留一种模板语言", true);
  } else {
    state.settings.locales = normalizeSelectedTemplateLocales([...selected, locale], [locale]);
    state.locale = locale;
  }

  state.settings.locales = normalizeSelectedTemplateLocales(state.settings.locales, [state.locale || getTemplateDefaultLocale()]);
  await ensureStains(state.locale);
  await ensureTemplateLocalesReady();
  await hydrateMissingItemRarity();
  writeSettings();
  writeCurrentDraft();
  render();
}

function renderTemplateLanguageSettings() {
  if (!templateLanguageSettings) {
    return;
  }

  templateLanguageSettings.innerHTML = "";
  const selectedLocales = getSelectedTemplateLocales();
  if (isSingleTemplateLanguageMode() || getTemplateLanguageOptions().length) {
    return;
  }

  selectedLocales.forEach((locale, index) => {
    const row = document.createElement("div");
    row.className = "template-language-row";
    row.classList.toggle("current", locale === state.locale);

    const orderControls = document.createElement("div");
    orderControls.className = "template-language-order-controls";
    const upButton = document.createElement("button");
    upButton.type = "button";
    upButton.textContent = "↑";
    upButton.title = getUiLocalizedText("上移");
    upButton.setAttribute("aria-label", localizeUiText("{value} 上移", LOCALE_LABELS[locale] || locale));
    upButton.disabled = index === 0;
    upButton.addEventListener("click", () => moveTemplateLocale(locale, -1));
    orderControls.appendChild(upButton);
    const downButton = document.createElement("button");
    downButton.type = "button";
    downButton.textContent = "↓";
    downButton.title = getUiLocalizedText("下移");
    downButton.setAttribute("aria-label", localizeUiText("{value} 下移", LOCALE_LABELS[locale] || locale));
    downButton.disabled = index === selectedLocales.length - 1;
    downButton.addEventListener("click", () => moveTemplateLocale(locale, 1));
    orderControls.appendChild(downButton);
    const removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.textContent = "×";
    removeButton.title = getUiLocalizedText("移除");
    removeButton.setAttribute("aria-label", localizeUiText("{value} 移除", LOCALE_LABELS[locale] || locale));
    removeButton.disabled = selectedLocales.length <= 1;
    removeButton.addEventListener("click", () => removeTemplateLocale(locale));
    orderControls.appendChild(removeButton);
    row.appendChild(orderControls);

    const label = document.createElement("strong");
    label.className = "template-language-code";
    label.textContent = LOCALE_LABELS[locale] || locale;
    label.title = getUiLocalizedText(locale === state.locale ? "当前编辑语言" : "模板显示语言");
    row.appendChild(label);

    const note = document.createElement("span");
    note.className = "template-language-note";
    note.textContent = getUiLocalizedText(locale === state.locale ? "当前编辑" : "输出语言");
    row.appendChild(note);

    templateLanguageSettings.appendChild(row);
  });
}

function renderLanguageControls() {
  templateLanguageControls.innerHTML = "";
  const selectedLocales = getSelectedTemplateLocales();
  const languageOptions = getTemplateLanguageOptions();
  if (languageOptions.length) {
    const selectedOption = getSelectedTemplateLanguageOption();
    for (const option of languageOptions) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "language-button";
      button.textContent = option.label;
      button.classList.toggle("active", option.id === selectedOption?.id);
      button.classList.toggle("current", option.id === selectedOption?.id);
      button.title = getUiLocalizedText(option.id === selectedOption?.id ? "当前排版语言" : "切换排版语言");
      button.addEventListener("click", () => toggleTemplateLocale(option.id));
      templateLanguageControls.appendChild(button);
    }
    renderTemplateLanguageSettings();
    return;
  }

  const templateLocaleOrder = getTemplateLocaleOrder();
  const orderedControls = isSingleTemplateLanguageMode()
    ? templateLocaleOrder.slice()
    : [
      ...selectedLocales,
      ...templateLocaleOrder.filter((locale) => !selectedLocales.includes(locale)),
    ];
  for (const locale of orderedControls) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "language-button";
    button.textContent = LOCALE_LABELS[locale] || locale;
    button.classList.toggle("active", selectedLocales.includes(locale));
    button.classList.toggle("current", locale === state.locale);
    const buttonTitle = isSingleTemplateLanguageMode()
      ? (locale === state.locale ? "当前输出语言" : "切换输出语言")
      : selectedLocales.includes(locale)
        ? locale === state.locale
          ? selectedLocales.length > 1
            ? "当前编辑语言，点击可从模板移除"
            : "当前编辑语言，至少保留一种模板语言"
          : "已在模板中显示，点击切换为当前编辑语言"
        : "点击加入模板并切换为当前编辑语言";
    button.title = getUiLocalizedText(buttonTitle);
    button.addEventListener("click", () => toggleTemplateLocale(locale));
    templateLanguageControls.appendChild(button);
  }
  renderTemplateLanguageSettings();
}

function renderSearch(container, row) {
  container.innerHTML = "";
  container.classList.add("editor-search-mode");
  const searchWrap = document.createElement("div");
  searchWrap.className = "editor-search";
  const input = document.createElement("input");
  input.className = "item-search-input";
  input.type = "search";
  input.placeholder = getUiLocalizedText("搜索装备名");
  searchWrap.appendChild(input);
  const resultsBox = document.createElement("div");
  resultsBox.className = "search-results";
  searchWrap.appendChild(resultsBox);
  let timerId = 0;
  let searchRequestId = 0;
  let searchAbortController = null;
  input.addEventListener("input", () => {
    window.clearTimeout(timerId);
    searchRequestId += 1;
    const requestId = searchRequestId;
    const query = input.value;
    if (searchAbortController) {
      searchAbortController.abort();
      searchAbortController = null;
    }
    resultsBox.innerHTML = "";
    if (!query.trim()) {
      return;
    }
    timerId = window.setTimeout(() => {
      searchAbortController = typeof AbortController === "function" ? new AbortController() : null;
      searchItems(row, query, resultsBox, {
        signal: searchAbortController?.signal,
        isCurrent: () => requestId === searchRequestId && input.value === query && container.contains(resultsBox),
      });
    }, ITEM_SEARCH_DEBOUNCE_MS);
  });
  container.appendChild(searchWrap);
}

function renderItem(container, row) {
  container.innerHTML = "";
  container.classList.remove("editor-search-mode");
  const iconUrl = buildIconUrl(row.item.icon);
  if (iconUrl) {
    const img = document.createElement("img");
    img.className = "editor-item-icon";
    img.src = iconUrl;
    img.alt = getItemName(row.item);
    img.loading = "lazy";
    img.referrerPolicy = "no-referrer";
    container.appendChild(img);
  }
  const body = document.createElement("div");
  body.className = "editor-item-body";
  const header = document.createElement("div");
  header.className = "editor-item-title";
  const name = document.createElement("strong");
  name.textContent = getItemName(row.item);
  name.lang = localeToHtmlLang(state.locale);
  header.appendChild(name);
  body.appendChild(header);
  const dyeControls = document.createElement("div");
  dyeControls.className = "editor-dye-controls";
  renderDyeControls(dyeControls, row);
  body.appendChild(dyeControls);
  const clearButton = document.createElement("button");
  clearButton.type = "button";
  clearButton.className = "inline-delete-button";
  clearButton.title = getUiLocalizedText("删除当前装备");
  clearButton.textContent = "×";
  clearButton.addEventListener("click", () => {
    row.item = null;
    writeCurrentDraft();
    render();
  });
  container.appendChild(body);
  container.appendChild(clearButton);
}

function closeDyePickers() {
  document.querySelectorAll(".dye-picker-panel").forEach((panel) => panel.remove());
}

function groupStains(stains) { return NSGlamourCommon.groupStains(stains); }
function normalizeDyeSearchText(value) { return NSGlamourCommon.normalizeDyeSearchText(value); }
function stainMatchesQuery(stain, query) { return NSGlamourCommon.stainMatchesQuery(stain, query); }

function renderDyePickerOptions(panel, stains, query, row, index) {
  const results = stains.filter((stain) => stainMatchesQuery(stain, query));
  const list = panel.querySelector(".dye-picker-results");
  if (!list) {
    return;
  }
  list.innerHTML = "";
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "dye-picker-empty";
    empty.textContent = "没有匹配的染剂";
    list.appendChild(empty);
    return;
  }
  for (const group of groupStains(results)) {
    const title = document.createElement("div");
    title.className = "dye-picker-group-title";
    title.textContent = group.label;
    list.appendChild(title);
    for (const stain of group.items) {
      const option = document.createElement("button");
      option.type = "button";
      option.className = "dye-picker-option";
      option.style.setProperty("--dye-color", stain.hex || "#000000");
      const swatch = document.createElement("span");
      swatch.className = "dye-picker-swatch";
      option.appendChild(swatch);
      const name = document.createElement("span");
      name.textContent = stain.name;
      option.appendChild(name);
      option.addEventListener("click", (event) => {
        event.stopPropagation();
        setDyeEntry(row, index, stain);
      });
      list.appendChild(option);
    }
  }
}

function setDyeEntry(row, index, stain) {
  const dyeCount = getTemplateDyeSlotCount(row);
  if (!row.item || index < 0 || index >= dyeCount) {
    return;
  }
  row.item.dye_entries = normalizeDyeEntries(row.item, { dyeCount, sourceDyeEntries: row.item.dye_entries });
  row.item.dye_entries[index] = {
    id: stain.id,
    name: stain.name,
    names: stain.names || { [state.locale]: stain.name },
    hex: stain.hex,
    rgb: stain.rgb,
  };
  updateDyeDisplay(row.item);
  writeCurrentDraft();
  render();
}

function openDyePicker(button, row, index) {
  closeDyePickers();
  const stains = state.stainsByLocale[state.locale] || [];
  const panel = document.createElement("div");
  panel.className = "dye-picker-panel";
  panel.addEventListener("click", (event) => event.stopPropagation());
  const search = document.createElement("input");
  search.className = "dye-picker-search";
  search.type = "search";
  search.placeholder = "搜索染剂";
  search.spellcheck = false;
  search.autocomplete = "off";
  search.addEventListener("input", () => {
    renderDyePickerOptions(panel, stains, search.value, row, index);
  });
  panel.appendChild(search);
  const results = document.createElement("div");
  results.className = "dye-picker-results";
  panel.appendChild(results);
  renderDyePickerOptions(panel, stains, "", row, index);
  button.closest(".editor-dye-select").appendChild(panel);
}

function renderDyeControls(container, row) {
  container.innerHTML = "";
  const dyeCount = getTemplateDyeSlotCount(row);
  if (!row.item || dyeCount <= 0) {
    container.textContent = row.item && !ACCESSORY_SLOTS.has(row.slot) ? getFigmaUndyeableLabel(state.locale) : "";
    return;
  }
  for (let index = 0; index < dyeCount; index += 1) {
    const entry = row.item.dye_entries[index] || makeNoDyeEntry();
    const wrapper = document.createElement("div");
    wrapper.className = "editor-dye-select";
    const currentStain = getStainById(entry.id);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dye-picker-button";
    button.title = dyeCount > 1 ? `染色${index + 1}` : "染色";
    button.style.setProperty("--dye-color", currentStain?.hex || entry.hex || "#000000");
    button.textContent = currentStain?.name || entry.name || getTemplateLocalizedText(FIGMA_EMPTY_DYE_NAME);
    button.addEventListener("click", (event) => {
      event.stopPropagation();
      openDyePicker(button, row, index);
    });
    wrapper.appendChild(button);
    container.appendChild(wrapper);
  }
}

async function searchItems(row, query, resultsBox, options = {}) {
  const trimmedQuery = query.trim();
  const isCurrent = typeof options.isCurrent === "function" ? options.isCurrent : () => true;
  if (!trimmedQuery || !isCurrent()) {
    return;
  }
  const params = new URLSearchParams({ slot: row.slot, q: trimmedQuery, locale: state.locale, limit: "20" });
  let data;
  try {
    const response = await fetch(appPath(`/api/search-items?${params.toString()}`), {
      cache: "no-store",
      signal: options.signal,
    });
    data = await response.json();
  } catch (error) {
    if (error.name !== "AbortError") {
      console.warn("Item search failed", error);
    }
    return;
  }
  if (!isCurrent()) {
    return;
  }
  resultsBox.innerHTML = "";
  const results = Array.isArray(data.results) ? data.results : [];
  if (!results.length) {
    const empty = document.createElement("div");
    empty.className = "search-empty";
    empty.textContent = getUiLocalizedText("无搜索结果");
    resultsBox.appendChild(empty);
    return;
  }
  for (const result of results) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "search-result";
    const iconUrl = buildIconUrl(result.icon);
    if (iconUrl) {
      const img = document.createElement("img");
      img.src = iconUrl;
      img.alt = result.name;
      img.loading = "lazy";
      img.referrerPolicy = "no-referrer";
      button.appendChild(img);
    }
    const text = document.createElement("span");
    text.textContent = result.name;
    button.appendChild(text);
    button.addEventListener("click", () => {
      row.item = normalizeImportedItem(result, { slot: row.slot, previousItem: row.item });
      sanitizeRows(state.rows);
      if (row.item) {
        updateDyeDisplay(row.item);
      }
      writeCurrentDraft();
      resultsBox.innerHTML = "";
      render();
    });
    resultsBox.appendChild(button);
  }
}

/** Update an existing row DOM in-place — avoids destroying icon <img> */
function updateRowInPlace(rowElement, row) {
  if (!row.item) return; // should not happen (guarded by caller)
  const nameEl = rowElement.querySelector(".editor-item-title strong");
  if (nameEl) {
    nameEl.textContent = getItemName(row.item);
    nameEl.lang = localeToHtmlLang(state.locale);
  }
  const dyeBox = rowElement.querySelector(".editor-dye-controls");
  if (dyeBox) renderDyeControls(dyeBox, row);
}

function renderRow(row) {
  const fragment = templateEditorRowTemplate.content.cloneNode(true);
  const rowElement = fragment.querySelector(".editor-row");
  rowElement.dataset.slot = row.slot;
  rowElement.querySelector(".editor-slot-name").textContent = getSlotLabel(row.slot);
  const itemBox = rowElement.querySelector(".editor-item");
  if (row.item) {
    renderItem(itemBox, row);
  } else {
    renderSearch(itemBox, row);
  }
  return fragment;
}

function loadImageFromDataUrl(dataUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });
}

function isAllowedTemplateImageFile(file) {
  if (!file) {
    return false;
  }
  const type = String(file.type || "").toLowerCase();
  if (type) {
    return /^(image\/png|image\/jpe?g|image\/webp|image\/gif|image\/avif|image\/bmp)$/.test(type);
  }
  return /\.(avif|bmp|gif|jpe?g|png|webp)$/i.test(file.name || "");
}

function normalizeTemplateImageFileList(files) {
  return Array.from(files || []).filter(isAllowedTemplateImageFile);
}

function normalizeDraggedImageUrl(value = "") {
  const firstLine = String(value || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => line && !line.startsWith("#"));
  if (!firstLine) {
    return "";
  }
  if (/^data:image\//i.test(firstLine)) {
    return firstLine;
  }
  if (/^https?:\/\//i.test(firstLine) || /^file:\/\/\//i.test(firstLine) || /^blob:/i.test(firstLine)) {
    return firstLine;
  }
  return "";
}

function getDraggedData(dataTransfer, type) {
  if (!dataTransfer || typeof dataTransfer.getData !== "function") {
    return "";
  }
  try {
    return dataTransfer.getData(type);
  } catch {
    return "";
  }
}

function getDroppedImageUrl(event) {
  const dataTransfer = event?.dataTransfer;
  if (!dataTransfer) {
    return "";
  }
  const uriList = normalizeDraggedImageUrl(getDraggedData(dataTransfer, "text/uri-list"));
  if (uriList) {
    return uriList;
  }
  const plainText = normalizeDraggedImageUrl(getDraggedData(dataTransfer, "text/plain"));
  if (plainText) {
    return plainText;
  }
  return "";
}

function getImageSlotSequence(startSlotId = activeImageSlotId) {
  const slots = getTemplateImageSlotDefinitions();
  const startIndex = Math.max(0, slots.findIndex((slot) => slot.id === startSlotId));
  return [...slots.slice(startIndex), ...slots.slice(0, startIndex)].map((slot) => slot.id);
}

function queueImageFiles(files, startSlotId = activeImageSlotId) {
  const imageFiles = normalizeTemplateImageFileList(files);
  if (!imageFiles.length) {
    setStatus("上传图片", true);
    return;
  }
  const slotIds = getImageSlotSequence(startSlotId);
  pendingImageFileQueue = imageFiles.map((file, index) => ({
    file,
    slotId: slotIds[Math.min(index, slotIds.length - 1)],
  }));
  processNextImageFile();
}

function processNextImageFile() {
  const next = pendingImageFileQueue.shift();
  if (!next) {
    return;
  }
  handleImageFile(next.file, next.slotId);
}

function handleImageFile(file, slotId = activeImageSlotId) {
  if (!isAllowedTemplateImageFile(file)) {
    setStatus("上传图片", true);
    processNextImageFile();
    return;
  }
  activeImageSlotId = getTemplateImageSlotDefinition(slotId).id;
  const reader = new FileReader();
  reader.onload = async () => {
    try {
      const dataUrl = String(reader.result || "");
      const slot = getTemplateImageSlotDefinition(activeImageSlotId);
      const image = await loadImageFromDataUrl(dataUrl);
      if (slot.fit === "contain") {
        await setContainedTemplateImageSlot(slot.id, image, file.name, dataUrl);
        setStatus(localizeUiText("已裁剪{value}: {value}", [
          getUiLocalizedText(slot.label),
          file.name,
        ]));
        renderCanvas();
        processNextImageFile();
        return;
      }
      if (slot.cropRequired === false) {
        await setCoveredTemplateImageSlot(slot.id, image, file.name, dataUrl);
        setStatus(localizeUiText("已裁剪{value}: {value}", [
          getUiLocalizedText(slot.label),
          file.name,
        ]));
        renderCanvas();
        processNextImageFile();
        return;
      }
      openImageCropper(image, file.name, activeImageSlotId);
    } catch {
      setStatus("图片读取失败", true);
      processNextImageFile();
    }
  };
  reader.readAsDataURL(file);
}

async function handleDroppedImageUrl(url, slotId = activeImageSlotId) {
  const normalizedUrl = normalizeDraggedImageUrl(url);
  if (!normalizedUrl) {
    setStatus("上传图片", true);
    return;
  }
  if (/^file:\/\/\//i.test(normalizedUrl)) {
    setStatus("浏览器无法直接读取本地图片链接，请从资源管理器拖入文件或点击上传", true);
    return;
  }
  activeImageSlotId = getTemplateImageSlotDefinition(slotId).id;
  try {
    const image = await loadImageFromDataUrl(normalizedUrl);
    openImageCropper(image, "拖入图片", activeImageSlotId);
  } catch {
    setStatus("图片读取失败，请从资源管理器拖入文件或点击上传", true);
  }
}

async function setContainedTemplateImageSlot(slotId, image, imageName, sourceUrl = "") {
  const metrics = getTemplateMetrics();
  const slot = getTemplateImageSlotDefinition(slotId);
  const imageRect = getTemplateImageSlotRect(metrics, slot.id);
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(imageRect.width));
  output.height = Math.max(1, Math.round(imageRect.height));
  const outputCtx = output.getContext("2d");
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  drawImageContain(outputCtx, image, 0, 0, output.width, output.height, {
    showPlaceholderText: false,
    backgroundFillStyle: FIGMA_MASK_FILL,
  });
  const dataUrl = output.toDataURL("image/png");
  await setTemplateImageSlot(slot.id, {
    image: await loadImageFromDataUrl(dataUrl),
    imageUrl: dataUrl,
    imageName,
    sourceUrl: sourceUrl || image.src || "",
    sourceName: imageName,
  });
}

async function setCoveredTemplateImageSlot(slotId, image, imageName, sourceUrl = "") {
  const metrics = getTemplateMetrics();
  const slot = getTemplateImageSlotDefinition(slotId);
  const imageRect = getTemplateImageSlotRect(metrics, slot.id);
  const output = document.createElement("canvas");
  output.width = Math.max(1, Math.round(imageRect.width));
  output.height = Math.max(1, Math.round(imageRect.height));
  const outputCtx = output.getContext("2d");
  outputCtx.imageSmoothingEnabled = true;
  outputCtx.imageSmoothingQuality = "high";
  drawImageCover(outputCtx, image, 0, 0, output.width, output.height, {
    showPlaceholderText: false,
    showPlaceholderFill: false,
  });
  const dataUrl = output.toDataURL("image/png");
  await setTemplateImageSlot(slot.id, {
    image: await loadImageFromDataUrl(dataUrl),
    imageUrl: dataUrl,
    imageName,
    sourceUrl: sourceUrl || image.src || "",
    sourceName: imageName,
  });
}

function openImageCropper(image, imageName, slotId = activeImageSlotId) {
  const slot = getTemplateImageSlotDefinition(slotId);
  activeImageSlotId = slot.id;
  if (!templateCropImage || typeof Cropper !== "function") {
    setStatus(localizeUiText("裁剪控件加载失败，请刷新页面后重试: {value}", getUiLocalizedText(slot.label)), true);
    processNextImageFile();
    return;
  }
  closeCropperInstance();
  pendingCrop = {
    image,
    imageName,
    sourceUrl: image.src || "",
    slotId: slot.id,
  };
  templateCropOverlay?.classList.remove("hidden");
  templateCropOverlay?.setAttribute("aria-hidden", "false");

  const initializeCropper = () => {
    if (!pendingCrop || pendingCrop.slotId !== slot.id) {
      return;
    }
    try {
      cropper = new Cropper(templateCropImage, {
        aspectRatio: getTemplateCropAspectRatio(slot.id),
        viewMode: 1,
        dragMode: "move",
        autoCropArea: 1,
        background: false,
        responsive: true,
        restore: false,
        movable: true,
        zoomable: true,
        rotatable: false,
        scalable: false,
        cropBoxMovable: true,
        cropBoxResizable: false,
        toggleDragModeOnDblclick: false,
        ready: syncCropZoomControls,
        zoom: syncCropZoomControls,
      });
      syncCropZoomControls();
      setStatus(localizeUiText("正在裁剪{value}，确认后点击使用裁剪", getUiLocalizedText(slot.label)));
    } catch {
      closeImageCropper();
      setStatus(localizeUiText("裁剪控件加载失败，请刷新页面后重试: {value}", getUiLocalizedText(slot.label)), true);
      processNextImageFile();
    }
  };

  templateCropImage.onload = () => {
    templateCropImage.onload = null;
    templateCropImage.onerror = null;
    initializeCropper();
  };
  templateCropImage.onerror = () => {
    templateCropImage.onload = null;
    templateCropImage.onerror = null;
    closeImageCropper();
    setStatus("图片读取失败", true);
    processNextImageFile();
  };
  templateCropImage.src = image.src;
  if (templateCropImage.complete && templateCropImage.naturalWidth) {
    templateCropImage.onload?.();
  }
}

function closeCropperInstance() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  if (templateCropImage) {
    templateCropImage.removeAttribute("src");
  }
}

function getCropZoomPercent() {
  const data = cropper?.getImageData?.();
  if (!data?.naturalWidth) {
    return 100;
  }
  return clampNumber((data.width / data.naturalWidth) * 100, 10, 500, 100);
}

function syncCropZoomControls() {
  if (!templateCropZoomRange || !templateCropZoomInput) {
    return;
  }
  isSyncingCropZoomControl = true;
  const value = String(Math.round(getCropZoomPercent()));
  templateCropZoomRange.value = value;
  templateCropZoomInput.value = value;
  isSyncingCropZoomControl = false;
}

function setCropZoomFromControl(value) {
  if (!cropper || isSyncingCropZoomControl) {
    return;
  }
  cropper.zoomTo(clampNumber(value, 10, 500, 100) / 100);
  syncCropZoomControls();
}

function closeImageCropper() {
  closeCropperInstance();
  pendingCrop = null;
  pendingImageFileQueue = [];
  templateCropOverlay?.classList.add("hidden");
  templateCropOverlay?.setAttribute("aria-hidden", "true");
}

async function applyImageCrop() {
  if (!pendingCrop || !cropper) {
    return;
  }
  const metrics = getTemplateMetrics();
  const cropSlot = getTemplateImageSlotDefinition(pendingCrop.slotId);
  const cropRect = getTemplateImageSlotRect(metrics, cropSlot.id);
  let output = null;
  if (cropSlot.fit === "contain") {
    await setContainedTemplateImageSlot(cropSlot.id, pendingCrop.image, pendingCrop.imageName, pendingCrop.sourceUrl);
  } else {
    output = cropper.getCroppedCanvas({
      width: Math.max(1, cropRect.width),
      height: Math.max(1, cropRect.height),
      imageSmoothingEnabled: true,
      imageSmoothingQuality: "high",
    });
  }
  if (cropSlot.fit !== "contain" && !output) {
    setStatus("裁剪器还在加载，请稍后再试", true);
    return;
  }
  if (cropSlot.fit !== "contain") {
    const dataUrl = output.toDataURL("image/png");
    await setTemplateImageSlot(cropSlot.id, {
      image: await loadImageFromDataUrl(dataUrl),
      imageUrl: dataUrl,
      imageName: pendingCrop.imageName,
      sourceUrl: pendingCrop.sourceUrl || pendingCrop.image.src || "",
      sourceName: pendingCrop.imageName,
    });
  }
  setStatus(localizeUiText("已裁剪{value}: {value}", [
    getUiLocalizedText(cropSlot.label),
    pendingCrop.imageName,
  ]));
  closeCropperInstance();
  pendingCrop = null;
  templateCropOverlay?.classList.add("hidden");
  templateCropOverlay?.setAttribute("aria-hidden", "true");
  renderCanvas();
  processNextImageFile();
}

function resetImageCrop() {
  cropper?.reset();
  syncCropZoomControls();
}

function getDroppedImageFiles(event) {
  const files = Array.from(event.dataTransfer?.files || []);
  return normalizeTemplateImageFileList(files);
}

function setImageDragState(isDragging, layer = templateCanvasUploadLayer) {
  layer?.classList.toggle("dragover", Boolean(isDragging));
}

function getCanvasUploadLayerForSlot(slotId = activeImageSlotId) {
  const normalizedSlotId = getTemplateImageSlotDefinition(slotId).id;
  return getCanvasUploadLayers().find((layer) => layer.dataset.templateImageSlot === normalizedSlotId) || null;
}

function updateCanvasUploadLayer() {
  syncCanvasUploadLayers();
  positionCanvasUploadLayer();
}

function getCanvasUploadLayers() {
  return Array.from(templateCanvasShell?.querySelectorAll("[data-template-image-slot]") || []);
}

function setAllImageDragStates(isDragging) {
  getCanvasUploadLayers().forEach((layer) => setImageDragState(isDragging, layer));
  if (!isDragging) {
    highlightedImageDropSlotId = "";
  }
}

function getClientRectForTemplateSlotRegion(metrics, region) {
  if (!templateCanvasShell || !region) {
    return null;
  }
  const canvasBox = templateCanvas.getBoundingClientRect();
  const shellBox = templateCanvasShell.getBoundingClientRect();
  const scaleX = canvasBox.width / Math.max(1, metrics.totalWidth);
  const scaleY = canvasBox.height / Math.max(1, metrics.totalHeight);
  const box = figmaRect(metrics, region);
  return {
    left: canvasBox.left - shellBox.left + box.x * scaleX + shellBox.left,
    top: canvasBox.top - shellBox.top + box.y * scaleY + shellBox.top,
    right: canvasBox.left - shellBox.left + (box.x + box.width) * scaleX + shellBox.left,
    bottom: canvasBox.top - shellBox.top + (box.y + box.height) * scaleY + shellBox.top,
  };
}

function getImageSlotDropRect(slotId) {
  const slot = getTemplateImageSlotDefinition(slotId);
  if (slot.dropRegion && getTemplateMetrics().aspect === FIGMA_TEMPLATE_ASPECT) {
    return getClientRectForTemplateSlotRegion(getTemplateMetrics(), slot.dropRegion);
  }
  return getCanvasUploadLayerForSlot(slot.id)?.getBoundingClientRect() || null;
}

function isClientPointInRect(clientX, clientY, rect) {
  return Boolean(
    rect &&
    clientX >= rect.left &&
    clientX <= rect.right &&
    clientY >= rect.top &&
    clientY <= rect.bottom
  );
}

function getImageSlotIdFromClientPoint(clientX, clientY, options = {}) {
  if (!templateCanvasShell) {
    return activeImageSlotId;
  }
  const slots = getTemplateImageSlotDefinitions();
  let nearestSlotId = activeImageSlotId;
  let nearestDistance = Number.POSITIVE_INFINITY;
  for (let index = slots.length - 1; index >= 0; index -= 1) {
    const slot = slots[index];
    const rect = options.useDropRegion ? getImageSlotDropRect(slot.id) : getCanvasUploadLayerForSlot(slot.id)?.getBoundingClientRect();
    if (isClientPointInRect(clientX, clientY, rect)) {
      return slot.id;
    }
    if (!rect) {
      continue;
    }
    const dx = clientX < rect.left ? rect.left - clientX : clientX > rect.right ? clientX - rect.right : 0;
    const dy = clientY < rect.top ? rect.top - clientY : clientY > rect.bottom ? clientY - rect.bottom : 0;
    const distance = dx * dx + dy * dy;
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearestSlotId = slot.id;
    }
  }
  const shellBox = templateCanvasShell.getBoundingClientRect();
  if (isClientPointInRect(clientX, clientY, shellBox)) {
    return nearestSlotId;
  }
  return activeImageSlotId;
}

function hasDraggedFiles(event) {
  const dataTransfer = event?.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  if (dataTransfer.files?.length) {
    return true;
  }
  if (Array.from(dataTransfer.items || []).some((item) => item.kind === "file")) {
    return true;
  }
  return Array.from(dataTransfer.types || []).some((type) => String(type).toLowerCase() === "files");
}

function hasDraggedFilePayload(event) {
  const dataTransfer = event?.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  if (dataTransfer.files?.length) {
    return true;
  }
  if (Array.from(dataTransfer.items || []).some((item) => item.kind === "file")) {
    return true;
  }
  const types = Array.from(dataTransfer.types || []).map((type) => String(type).toLowerCase());
  return types.some((type) => (
    type === "files" ||
    type === "file" ||
    type === "application/x-moz-file" ||
    type === "downloadurl" ||
    type.startsWith("image/")
  ));
}

function hasDraggedImageSource(event) {
  const dataTransfer = event?.dataTransfer;
  if (!dataTransfer) {
    return false;
  }
  if (hasDraggedFiles(event)) {
    return true;
  }
  const types = Array.from(dataTransfer.types || []).map((type) => String(type).toLowerCase());
  if (types.some((type) => type.startsWith("image/") || type === "text/uri-list")) {
    return true;
  }
  return Boolean(normalizeDraggedImageUrl(getDraggedData(dataTransfer, "text/plain")));
}

function hasDraggedTemplateImagePayload(event) {
  return hasDraggedFilePayload(event) || hasDraggedImageSource(event);
}

function isEventInsideTemplateCanvasShell(event) {
  if (!templateCanvasShell) {
    return false;
  }
  const path = typeof event.composedPath === "function" ? event.composedPath() : [];
  if (path.includes(templateCanvasShell)) {
    return true;
  }
  if (event.target instanceof Node && templateCanvasShell.contains(event.target)) {
    return true;
  }
  const shellBox = templateCanvasShell.getBoundingClientRect();
  return (
    event.clientX >= shellBox.left &&
    event.clientX <= shellBox.right &&
    event.clientY >= shellBox.top &&
    event.clientY <= shellBox.bottom
  );
}

function shouldClearImageDropHighlightForDragLeave(event) {
  if (!templateCanvasShell) {
    return true;
  }
  if (event.relatedTarget instanceof Node && templateCanvasShell.contains(event.relatedTarget)) {
    return false;
  }
  const shellBox = templateCanvasShell.getBoundingClientRect();
  return !isClientPointInRect(event.clientX, event.clientY, shellBox);
}

function highlightImageDropTarget(clientX, clientY) {
  const slotId = getImageSlotIdFromClientPoint(clientX, clientY, { useDropRegion: true });
  activeImageSlotId = getTemplateImageSlotDefinition(slotId).id;
  templateCanvasShell?.classList.add("dragover");
  if (highlightedImageDropSlotId === activeImageSlotId) {
    return;
  }
  setAllImageDragStates(false);
  highlightedImageDropSlotId = activeImageSlotId;
  setImageDragState(true, getCanvasUploadLayerForSlot(activeImageSlotId) || templateCanvasUploadLayer);
}

function clearImageDropHighlight() {
  templateCanvasShell?.classList.remove("dragover");
  setAllImageDragStates(false);
}

function handleTemplateFileDragEvent(event) {
  const insideShell = isEventInsideTemplateCanvasShell(event);
  const isDragEvent = event.type === "dragenter" || event.type === "dragover" || event.type === "dragleave" || event.type === "drop";
  const shouldHandle = hasDraggedTemplateImagePayload(event) || (insideShell && isDragEvent);
  if (!shouldHandle) {
    return;
  }
  event.preventDefault();
  event.stopPropagation();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
  if (insideShell && (event.type === "dragenter" || event.type === "dragover")) {
    highlightImageDropTarget(event.clientX, event.clientY);
    return;
  }
  if (event.type === "drop") {
    clearImageDropHighlight();
    if (insideShell) {
      const slotId = getImageSlotIdFromClientPoint(event.clientX, event.clientY, { useDropRegion: true });
      const files = getDroppedImageFiles(event);
      if (files.length) {
        queueImageFiles(files, slotId);
      } else if (getDroppedImageUrl(event)) {
        handleDroppedImageUrl(getDroppedImageUrl(event), slotId);
      } else {
        setStatus("上传图片", true);
      }
    }
    return;
  }
  if (event.type === "dragleave") {
    if (!insideShell || shouldClearImageDropHighlightForDragLeave(event)) {
      clearImageDropHighlight();
    }
    return;
  }
  if (!insideShell) {
    clearImageDropHighlight();
  }
}

function syncCanvasUploadLayers() {
  if (!templateCanvasShell) {
    return;
  }
  const existingLayers = new Map(getCanvasUploadLayers().map((layer) => [layer.dataset.templateImageSlot, layer]));
  for (const slot of getTemplateImageSlotDefinitions()) {
    let layer = existingLayers.get(slot.id);
    if (!layer) {
      layer = document.createElement("button");
      layer.type = "button";
      layer.className = "template-canvas-upload-layer";
      layer.dataset.templateImageSlot = slot.id;
      templateCanvasShell.appendChild(layer);
      bindCanvasUploadLayer(layer);
    }
    layer.innerHTML = "";
    const title = document.createElement("span");
    title.textContent = slot.uploadText;
    layer.appendChild(title);
    if (slot.helperText) {
      const helper = document.createElement("small");
      helper.textContent = slot.helperText;
      layer.appendChild(helper);
    }
    layer.setAttribute("aria-label", slot.label);
    layer.classList.toggle("has-image", Boolean(getTemplateImageSlot(slot.id).image));
    existingLayers.delete(slot.id);
  }
  for (const layer of existingLayers.values()) {
    layer.remove();
  }
}

function getTemplateImageSlotRect(metrics, slotId = DEFAULT_IMAGE_SLOT_ID) {
  const slot = getTemplateImageSlotDefinition(slotId);
  if (metrics.aspect === FIGMA_TEMPLATE_ASPECT) {
    return figmaRect(metrics, slot.region || FIGMA_IMAGE_REGION);
  }
  return { x: 0, y: metrics.imageY, width: metrics.imageWidth, height: metrics.imageHeight };
}

function getTemplateUploadSlotRect(metrics, slotId = DEFAULT_IMAGE_SLOT_ID) {
  const slot = getTemplateImageSlotDefinition(slotId);
  if (metrics.aspect === FIGMA_TEMPLATE_ASPECT && slot.uploadRegion) {
    return figmaRect(metrics, slot.uploadRegion);
  }
  return getTemplateImageSlotRect(metrics, slotId);
}

function positionCanvasUploadLayer() {
  if (!templateCanvasShell) {
    return;
  }
  const layers = getCanvasUploadLayers();
  if (!layers.length) {
    return;
  }
  const canvasBox = templateCanvas.getBoundingClientRect();
  const shellBox = templateCanvasShell.getBoundingClientRect();
  const metrics = getTemplateMetrics();
  const scaleX = canvasBox.width / Math.max(1, metrics.totalWidth);
  const scaleY = canvasBox.height / Math.max(1, metrics.totalHeight);
  for (const layer of layers) {
    const imageBox = getTemplateUploadSlotRect(metrics, layer.dataset.templateImageSlot);
    Object.assign(layer.style, {
      left: `${canvasBox.left - shellBox.left + imageBox.x * scaleX}px`,
      top: `${canvasBox.top - shellBox.top + imageBox.y * scaleY}px`,
      width: `${imageBox.width * scaleX}px`,
      height: `${imageBox.height * scaleY}px`,
    });
  }
}

function drawFittedText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 1) {
  const words = String(text || "").split("");
  const lines = [];
  let line = "";
  for (const char of words) {
    const next = `${line}${char}`;
    if (ctx.measureText(next).width > maxWidth && line) {
      lines.push(line);
      line = char;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) {
    lines.push(line);
  }
  lines.slice(0, maxLines).forEach((item, index) => ctx.fillText(item, x, y + lineHeight * index));
  return y + lineHeight * lines.length;
}

function measureTextWithTracking(ctx, text, tracking) {
  const chars = Array.from(String(text || ""));
  if (!chars.length) {
    return 0;
  }
  return chars.reduce((width, char) => width + ctx.measureText(char).width, 0) + tracking * (chars.length - 1);
}

function drawTextWithTracking(ctx, text, x, y, tracking, maxWidth) {
  const chars = Array.from(String(text || ""));
  if (!chars.length) {
    return;
  }
  const direction = ctx.textAlign === "right" ? -1 : 1;
  let cursorX = x;
  const previousAlign = ctx.textAlign;
  ctx.textAlign = direction < 0 ? "right" : "left";
  for (const char of direction < 0 ? chars.slice().reverse() : chars) {
    const charWidth = ctx.measureText(char).width;
    ctx.fillText(char, cursorX, y, maxWidth);
    cursorX += direction * (charWidth + tracking);
  }
  ctx.textAlign = previousAlign;
}

function drawFittedTextWithTracking(ctx, text, x, y, maxWidth, lineHeight, tracking, maxLines = 1) {
  const words = Array.from(String(text || ""));
  const lines = [];
  let line = "";
  for (const char of words) {
    const next = `${line}${char}`;
    if (measureTextWithTracking(ctx, next, tracking) > maxWidth && line) {
      lines.push(line);
      line = char;
      if (lines.length >= maxLines) {
        break;
      }
    } else {
      line = next;
    }
  }
  if (lines.length < maxLines && line) {
    lines.push(line);
  }
  lines.slice(0, maxLines).forEach((item, index) => {
    drawTextWithTracking(ctx, item, x, y + lineHeight * index, tracking, maxWidth);
  });
  return y + lineHeight * lines.length;
}

function drawClippedTextWithTracking(ctx, text, x, y, maxWidth, lineHeight, tracking) {
  const clipX = ctx.textAlign === "right" ? x - maxWidth : x;
  ctx.save();
  ctx.beginPath();
  ctx.rect(clipX, y, maxWidth, lineHeight);
  ctx.clip();
  drawTextWithTracking(ctx, text, x, y, tracking);
  ctx.restore();
}

function drawClippedTextInBox(ctx, text, box, drawX, drawY) {
  ctx.save();
  ctx.beginPath();
  ctx.rect(box.x, box.y, box.width, box.height);
  ctx.clip();
  ctx.fillText(text, drawX, drawY);
  ctx.restore();
}

function drawImageResampled(ctx, image, sx, sy, sw, sh, dx, dy, dw, dh) {
  if (sw <= 0 || sh <= 0 || dw <= 0 || dh <= 0) {
    return;
  }
  let source = image;
  let sourceWidth = sw;
  let sourceHeight = sh;
  let sourceX = sx;
  let sourceY = sy;
  while (sourceWidth / dw > 2 || sourceHeight / dh > 2) {
    const nextWidth = Math.max(dw, Math.round(sourceWidth / 2));
    const nextHeight = Math.max(dh, Math.round(sourceHeight / 2));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(nextWidth));
    canvas.height = Math.max(1, Math.round(nextHeight));
    const nextCtx = canvas.getContext("2d");
    nextCtx.imageSmoothingEnabled = true;
    nextCtx.imageSmoothingQuality = "high";
    nextCtx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, 0, 0, canvas.width, canvas.height);
    source = canvas;
    sourceWidth = canvas.width;
    sourceHeight = canvas.height;
    sourceX = 0;
    sourceY = 0;
  }
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, sourceX, sourceY, sourceWidth, sourceHeight, dx, dy, dw, dh);
}

function getTemplatePreviewSize(metrics) {
  const shellBox = templateCanvasShell?.getBoundingClientRect?.();
  const maxCssWidth = Math.max(1, Math.floor(shellBox?.width || metrics.totalWidth));
  const maxCssHeight = Math.max(1, Math.floor(shellBox?.height || metrics.totalHeight));
  const scale = Math.min(1, maxCssWidth / metrics.totalWidth, maxCssHeight / metrics.totalHeight);
  const cssWidth = Math.max(1, Math.round(metrics.totalWidth * scale));
  const cssHeight = Math.max(1, Math.round(metrics.totalHeight * scale));
  const pixelRatio = Math.max(1, Math.min(
    window.devicePixelRatio || 1,
    metrics.totalWidth / cssWidth,
    metrics.totalHeight / cssHeight,
  ));
  return {
    cssWidth,
    cssHeight,
    pixelWidth: Math.max(1, Math.round(cssWidth * pixelRatio)),
    pixelHeight: Math.max(1, Math.round(cssHeight * pixelRatio)),
  };
}

function renderCanvasPreview(sourceCanvas, metrics) {
  const preview = getTemplatePreviewSize(metrics);
  if (templateCanvas.width !== preview.pixelWidth) {
    templateCanvas.width = preview.pixelWidth;
  }
  if (templateCanvas.height !== preview.pixelHeight) {
    templateCanvas.height = preview.pixelHeight;
  }
  templateCanvas.style.width = `${preview.cssWidth}px`;
  templateCanvas.style.height = `${preview.cssHeight}px`;
  const ctx = templateCanvas.getContext("2d");
  ctx.clearRect(0, 0, preview.pixelWidth, preview.pixelHeight);
  drawImageResampled(
    ctx,
    sourceCanvas,
    0,
    0,
    metrics.totalWidth,
    metrics.totalHeight,
    0,
    0,
    preview.pixelWidth,
    preview.pixelHeight,
  );
}

function drawImageCover(ctx, image, x, y, width, height, options = {}) {
  if (!image) {
    if (options.showPlaceholderFill !== false) {
      ctx.fillStyle = options.placeholderFillStyle || "#e8ecf4";
      ctx.fillRect(x, y, width, height);
    }
    if (options.showPlaceholderText !== false) {
      ctx.fillStyle = "#7a8194";
      ctx.font = `700 ${scaleTemplateUnit(28)}px 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("上传图片", x + width / 2, y + height / 2);
    }
    return;
  }
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.max(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  const sourceWidth = width / scale;
  const sourceHeight = height / scale;
  const sourceX = Math.max(0, (imageWidth - sourceWidth) / 2);
  const sourceY = Math.max(0, (imageHeight - sourceHeight) / 2);
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  drawImageResampled(ctx, image, sourceX, sourceY, sourceWidth, sourceHeight, x, y, width, height);
  ctx.restore();
}

function drawImageContain(ctx, image, x, y, width, height, options = {}) {
  const fillStyle = options.backgroundFillStyle || FIGMA_MASK_FILL;
  ctx.fillStyle = fillStyle;
  ctx.fillRect(x, y, width, height);
  if (!image) {
    if (options.showPlaceholderText !== false) {
      ctx.fillStyle = "#7a8194";
      ctx.font = `700 ${scaleTemplateUnit(28)}px 'Microsoft YaHei', sans-serif`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("上传图片", x + width / 2, y + height / 2);
    }
    return;
  }
  const imageWidth = image.naturalWidth || image.width;
  const imageHeight = image.naturalHeight || image.height;
  const scale = Math.min(width / imageWidth, height / imageHeight);
  const drawWidth = imageWidth * scale;
  const drawHeight = imageHeight * scale;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  drawImageResampled(ctx, image, 0, 0, imageWidth, imageHeight, x + (width - drawWidth) / 2, y + (height - drawHeight) / 2, drawWidth, drawHeight);
  ctx.restore();
}

function createLuminanceMaskCanvas(maskImage, width, height, maskBox = null, imageBox = null) {
  const outputWidth = Math.max(1, Math.ceil(width));
  const outputHeight = Math.max(1, Math.ceil(height));
  const output = document.createElement("canvas");
  const sourceBox = maskBox && imageBox
    ? {
      x: maskBox.x - imageBox.x,
      y: maskBox.y - imageBox.y,
      width: maskBox.width,
      height: maskBox.height,
    }
    : { x: 0, y: 0, width, height };
  const cacheKey = [
    maskImage.currentSrc || maskImage.src || "",
    outputWidth,
    outputHeight,
    Math.round(sourceBox.x),
    Math.round(sourceBox.y),
    Math.round(sourceBox.width),
    Math.round(sourceBox.height),
  ].join("|");
  const cached = luminanceMaskCanvasCache.get(cacheKey);
  if (cached) {
    return cached;
  }
  output.width = outputWidth;
  output.height = outputHeight;
  const outputCtx = output.getContext("2d", { willReadFrequently: true });
  outputCtx.drawImage(maskImage, sourceBox.x, sourceBox.y, sourceBox.width, sourceBox.height);
  const imageData = outputCtx.getImageData(0, 0, output.width, output.height);
  const pixels = imageData.data;
  for (let index = 0; index < pixels.length; index += 4) {
    const alphaFromLightness = Math.round((pixels[index] + pixels[index + 1] + pixels[index + 2]) / 3);
    pixels[index] = 255;
    pixels[index + 1] = 255;
    pixels[index + 2] = 255;
    pixels[index + 3] = Math.round((pixels[index + 3] * alphaFromLightness) / 255);
  }
  outputCtx.putImageData(imageData, 0, 0);
  luminanceMaskCanvasCache.set(cacheKey, output);
  return output;
}

function getTemplateCropAspectRatio(slotId = DEFAULT_IMAGE_SLOT_ID) {
  const slot = getTemplateImageSlotDefinition(slotId);
  if (slot.aspectRatio) {
    return slot.aspectRatio;
  }
  if (normalizeTemplateAspect(state.settings.aspect) === FIGMA_TEMPLATE_ASPECT) {
    const rect = slot.region || FIGMA_IMAGE_REGION;
    return rect.width / rect.height;
  }
  return CROP_ASPECT_RATIO;
}

function figmaUnit(metrics, value) {
  return Math.round((Number(value) * metrics.totalWidth) / getCurrentTemplateSourceWidth());
}

function figmaUnitY(metrics, value) {
  return Math.round((Number(value) * metrics.totalHeight) / getCurrentTemplateSourceHeight());
}

function figmaRect(metrics, rect) {
  return {
    x: figmaUnit(metrics, rect.x),
    y: figmaUnitY(metrics, rect.y),
    width: figmaUnit(metrics, rect.width),
    height: figmaUnitY(metrics, rect.height),
  };
}

function loadCanvasAsset(url, assignImage, readImage, assignLoading, readLoading, assignPromise, readPromise) {
  const loaded = readImage();
  if (loaded) {
    return Promise.resolve(loaded);
  }
  const existingPromise = readPromise?.();
  if (readLoading() && existingPromise) {
    return existingPromise;
  }
  assignLoading(true);
  const image = new Image();
  const promise = new Promise((resolve) => {
    image.onload = () => {
      assignImage(image);
      assignLoading(false);
      assignPromise?.(null);
      renderCanvas();
      resolve(image);
    };
    image.onerror = () => {
      assignLoading(false);
      assignPromise?.(null);
      resolve(null);
    };
  });
  assignPromise?.(promise);
  image.src = url;
  return promise;
}

function loadFigmaTemplateBackground() {
  return loadCanvasAsset(
    FIGMA_TEMPLATE_BACKGROUND_URL,
    (image) => {
      figmaTemplateBackground = image;
    },
    () => figmaTemplateBackground,
    (isLoading) => {
      figmaTemplateBackgroundLoading = isLoading;
    },
    () => figmaTemplateBackgroundLoading,
    (promise) => {
      figmaTemplateBackgroundPromise = promise;
    },
    () => figmaTemplateBackgroundPromise,
  );
}

function loadHorizontalTemplateBackground() {
  return loadCanvasAsset(
    HORIZONTAL_TEMPLATE_BACKGROUND_URL,
    (image) => {
      horizontalTemplateBackground = image;
    },
    () => horizontalTemplateBackground,
    (isLoading) => {
      horizontalTemplateBackgroundLoading = isLoading;
    },
    () => horizontalTemplateBackgroundLoading,
    (promise) => {
      horizontalTemplateBackgroundPromise = promise;
    },
    () => horizontalTemplateBackgroundPromise,
  );
}

function loadSilenceFashionBackground() {
  return loadCanvasAsset(
    SILENCE_FASHION_BACKGROUND_URL,
    (image) => {
      silenceFashionBackground = image;
    },
    () => silenceFashionBackground,
    (isLoading) => {
      silenceFashionBackgroundLoading = isLoading;
    },
    () => silenceFashionBackgroundLoading,
    (promise) => {
      silenceFashionBackgroundPromise = promise;
    },
    () => silenceFashionBackgroundPromise,
  );
}

function loadStoryTemplateLeftMask() {
  return loadCanvasAsset(
    STORY_TEMPLATE_LEFT_MASK_URL,
    (image) => {
      storyTemplateLeftMask = image;
    },
    () => storyTemplateLeftMask,
    (isLoading) => {
      storyTemplateLeftMaskLoading = isLoading;
    },
    () => storyTemplateLeftMaskLoading,
    (promise) => {
      storyTemplateLeftMaskPromise = promise;
    },
    () => storyTemplateLeftMaskPromise,
  );
}

function loadDoublePicLeftMask() {
  return loadCanvasAsset(
    DOUBLE_PIC_LEFT_MASK_URL,
    (image) => {
      doublePicLeftMask = image;
    },
    () => doublePicLeftMask,
    (isLoading) => {
      doublePicLeftMaskLoading = isLoading;
    },
    () => doublePicLeftMaskLoading,
    (promise) => {
      doublePicLeftMaskPromise = promise;
    },
    () => doublePicLeftMaskPromise,
  );
}

const EC_TEMPLATE_RENDERER = window.NSGlamourEcTemplateRenderer.createEcTemplateRenderer({
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
  state,
});

const RISINGSTONES_TEMPLATE_RENDERER = window.NSGlamourRisingstonesTemplateRenderer.createRisingstonesTemplateRenderer({
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
});

const SILENCE_FASHION_TEMPLATE_RENDERER = window.NSGlamourSilenceFashionTemplateRenderer.createSilenceFashionTemplateRenderer({
  DEFAULT_IMAGE_SLOT_ID,
  SILENCE_FASHION_AVATAR_SLOT_ID,
  SILENCE_FASHION_TEMPLATE,
  TEMPLATE_DEFINITIONS,
  buildTemplateEquipmentRows,
  drawImageCover,
  figmaRect,
  figmaUnit,
  figmaUnitY,
  formatEcSubtitleParts,
  getItemName,
  getSilenceFashionBackground: () => silenceFashionBackground,
  getSelectedTemplateLocales,
  getTemplateDefaultTopText,
  getTemplateDisplayDyeEntries,
  getTemplateDyeText,
  getTemplateImageSlot,
  state,
});

const HORIZONTAL_TEMPLATE_RENDERER = window.NSGlamourHorizontalTemplateRenderer.createHorizontalTemplateRenderer({
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
  getHorizontalTemplateBackground: () => horizontalTemplateBackground,
});

const STORY_TEMPLATE_RENDERER = window.NSGlamourStoryTemplateRenderer.createStoryTemplateRenderer({
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
  getDoublePicLeftMask: () => doublePicLeftMask,
  getItemName,
  getSelectedTemplateLocales,
  getStoryTemplateLeftMask: () => storyTemplateLeftMask,
  getTemplateDyeFormat,
  getTemplateDyeText,
  getTemplateImageSlot,
  getTemplateImageSlotDefinition,
  getTemplateImageSlotRect,
  loadDoublePicLeftMask,
  loadStoryTemplateLeftMask,
  normalizeStorySwatchColors,
  state,
});

const EORZEA_TEMPLATE_RENDERER = window.NSGlamourEorzeaTemplateRenderer.createEorzeaTemplateRenderer({
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
  getFigmaTemplateBackground: () => figmaTemplateBackground,
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
});

const TEMPLATE_RENDER_PROFILES = window.NSGlamourTemplateRenderers.createTemplateRenderProfiles({
  loadFigmaTemplateBackground,
  loadHorizontalTemplateBackground,
  loadSilenceFashionBackground,
  loadDoublePicLeftMask,
  loadStoryTemplateLeftMask,
  renderFigmaCanvas: EORZEA_TEMPLATE_RENDERER.renderEorzeaTemplateCanvas,
  renderHorizontalTemplateCanvas: HORIZONTAL_TEMPLATE_RENDERER.renderHorizontalTemplateCanvas,
  renderEcTemplateCanvas: EC_TEMPLATE_RENDERER.renderEcTemplateCanvas,
  renderDoublePicTemplateCanvas: STORY_TEMPLATE_RENDERER.renderDoublePicTemplateCanvas,
  renderStoryTemplateCanvas: STORY_TEMPLATE_RENDERER.renderStoryTemplateCanvas,
  renderRisingstonesTemplateCanvas: RISINGSTONES_TEMPLATE_RENDERER.renderRisingstonesTemplateCanvas,
  renderSilenceFashionTemplateCanvas: SILENCE_FASHION_TEMPLATE_RENDERER.renderSilenceFashionTemplateCanvas,
});

function getTemplateRenderProfile(template = getCurrentTemplate()) {
  return TEMPLATE_RENDER_PROFILES[template?.renderMode] || TEMPLATE_RENDER_PROFILES.default;
}

function getTemplateAssetPromises() {
  if (!isFigmaTemplateMode()) {
    return [];
  }
  return (getTemplateRenderProfile().loadAssets?.() || []).filter(Boolean);
}

function drawMaskedImageCover(ctx, image, maskImage, x, y, width, height, maskBox = null, options = {}) {
  if (!maskImage) {
    drawImageCover(ctx, image, x, y, width, height, { showPlaceholderText: false, ...options });
    return;
  }
  const offscreen = document.createElement("canvas");
  offscreen.width = Math.max(1, Math.ceil(width));
  offscreen.height = Math.max(1, Math.ceil(height));
  const offscreenCtx = offscreen.getContext("2d");
  drawImageCover(offscreenCtx, image, 0, 0, offscreen.width, offscreen.height, { showPlaceholderText: false, ...options });
  const maskRect = maskBox || { x, y, width, height };
  const luminanceMask = createLuminanceMaskCanvas(maskImage, offscreen.width, offscreen.height, maskRect, { x, y, width, height });
  offscreenCtx.globalCompositeOperation = "destination-in";
  offscreenCtx.drawImage(luminanceMask, 0, 0);
  ctx.drawImage(offscreen, x, y, width, height);
}

function makeRoundedRectPath(ctx, x, y, width, height, radius) {
  const normalizedRadius = Math.max(0, Math.min(radius, width / 2, height / 2));
  ctx.beginPath();
  ctx.moveTo(x + normalizedRadius, y);
  ctx.lineTo(x + width - normalizedRadius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + normalizedRadius);
  ctx.lineTo(x + width, y + height - normalizedRadius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - normalizedRadius, y + height);
  ctx.lineTo(x + normalizedRadius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - normalizedRadius);
  ctx.lineTo(x, y + normalizedRadius);
  ctx.quadraticCurveTo(x, y, x + normalizedRadius, y);
  ctx.closePath();
}

function fillRoundedRect(ctx, x, y, width, height, radius) {
  makeRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.fill();
}

function strokeRoundedRect(ctx, x, y, width, height, radius) {
  makeRoundedRectPath(ctx, x, y, width, height, radius);
  ctx.stroke();
}

function normalizeEcSubtitleText(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 120);
}

function normalizeEcSubtitlePart(value, maxLength = 80) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}

function normalizeEcSubtitleSymbol(value) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 4);
}

function getEcSubtitlePartsFromSettings() {
  const left = normalizeEcSubtitlePart(state.settings.ecSubtitleLeftText);
  const symbol = normalizeEcSubtitleSymbol(state.settings.ecSubtitleSymbolText);
  const right = normalizeEcSubtitlePart(state.settings.ecSubtitleRightText);
  if (left || symbol || right || state.settings.ecSubtitleTouched) {
    return { left, symbol, right };
  }
  const configured = normalizeEcSubtitleText(state.settings.ecSubtitleText);
  if (configured) {
    return splitEcSubtitleText(configured) || { full: configured };
  }
  return null;
}

function getEcSubtitleText() {
  return formatEcSubtitleParts(getEcSubtitlePartsFromSettings());
}

function formatEcSubtitleParts(parts) {
  if (!parts) {
    return "";
  }
  if (parts.full) {
    return normalizeEcSubtitleText(parts.full);
  }
  const left = normalizeEcSubtitlePart(parts.left);
  const symbol = normalizeEcSubtitleSymbol(parts.symbol);
  const right = normalizeEcSubtitlePart(parts.right);
  if (left && right && symbol) {
    return `${left} ${symbol} ${right}`;
  }
  return [left, right].filter(Boolean).join(" ");
}

function splitEcSubtitleText(text) {
  const rawSource = String(text || "").trim();
  const source = normalizeEcSubtitleText(rawSource);
  if (!source) {
    return null;
  }
  let best = null;
  for (const symbol of EC_TEMPLATE_SUBTITLE_SYMBOLS) {
    const index = source.indexOf(symbol);
    if (index >= 0 && (!best || index < best.index)) {
      best = { symbol, index };
    }
  }
  if (!best) {
    const wideGapMatch = rawSource.match(/^(.+?)\s{2,}(.+)$/);
    if (wideGapMatch) {
      return {
        left: normalizeEcSubtitlePart(wideGapMatch[1]),
        symbol: "♦",
        right: normalizeEcSubtitlePart(wideGapMatch[2]),
      };
    }
    return { full: source };
  }
  const left = source.slice(0, best.index).trim();
  const right = source.slice(best.index + best.symbol.length).trim();
  if (!left || !right) {
    return { full: source };
  }
  return { left, symbol: best.symbol, right };
}

function syncEcSubtitleControls() {
  const parts = getEcSubtitlePartsFromSettings() || {};
  if (templateEcSubtitleLeftInput) {
    templateEcSubtitleLeftInput.value = normalizeEcSubtitlePart(parts.full ? parts.full : parts.left);
  }
  if (templateEcSubtitleSymbolInput) {
    templateEcSubtitleSymbolInput.value = parts.full ? "" : normalizeEcSubtitleSymbol(parts.symbol);
  }
  if (templateEcSubtitleRightInput) {
    templateEcSubtitleRightInput.value = parts.full ? "" : normalizeEcSubtitlePart(parts.right);
  }
}

function getEcDyeLabel(dye, locale = state.locale) {
  const name = normalizeFigmaDyeName(dye.name);
  if (dye.isEmpty || name === FIGMA_EMPTY_DYE_NAME) {
    return getFigmaEmptyDyeLabel(locale);
  }
  return name.replace(/染剂$/u, "").replace(/染劑$/u, "");
}

function drawEcFittedItemName(ctx, metrics, text, x, centerY, maxWidth, layout) {
  const weight = Number(layout.nameWeight || 700);
  const fontFamily = layout.fontFamily || "'Source Sans 3', 'Microsoft YaHei', sans-serif";
  const maxSize = figmaUnit(metrics, layout.nameSize);
  const minSize = figmaUnit(metrics, layout.nameMinSize || Math.max(32, layout.nameSize - 18));
  let size = maxSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${fontFamily}`;
    if (ctx.measureText(text).width <= maxWidth) {
      break;
    }
    size -= 1;
  }
  ctx.font = `${weight} ${size}px ${fontFamily}`;
  if (layout.inkCenter) {
    const textMetrics = ctx.measureText(text || "Ag");
    const ascent = Number(textMetrics.actualBoundingBoxAscent || 0);
    const descent = Number(textMetrics.actualBoundingBoxDescent || 0);
    if (ascent || descent) {
      ctx.textBaseline = "alphabetic";
      ctx.fillText(text, x, centerY + (ascent - descent) / 2, maxWidth);
      return;
    }
  }
  ctx.fillText(text, x, centerY, maxWidth);
}

function drawTemplateInfo(ctx, x, y, width, height) {
  const { textColor } = state.settings;
  const padding = scaleTemplateUnit(state.settings.padding);
  const nameSize = scaleTemplateUnit(state.settings.nameSize);
  const dyeSize = scaleTemplateUnit(state.settings.dyeSize);
  const rows = getRenderableRows();
  const locales = getSelectedTemplateLocales();
  const showIcons = state.settings.showIcons;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, width, height);
  ctx.clip();
  ctx.fillStyle = textColor;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  let cursorY = y + padding;
  const contentX = x + padding;
  const contentWidth = width - padding * 2;
  const iconSize = Math.max(22, Math.round(nameSize * 1.35));
  const iconGap = showIcons ? Math.max(8, Math.round(nameSize * 0.38)) : 0;
  for (const row of rows) {
    if (cursorY > y + height - padding) {
      break;
    }
    for (const locale of locales) {
      if (cursorY > y + height - padding) {
        break;
      }
      const itemName = getItemName(row.item, locale);
      if (!itemName) {
        continue;
      }
      ctx.font = `700 ${nameSize}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
      ctx.fillStyle = textColor;
      let textX = contentX;
      let textWidth = contentWidth;
      const iconImage = showIcons ? iconImageCache.get(buildIconUrl(row.item?.icon)) : null;
      if (iconImage && !(iconImage instanceof Promise)) {
        const iconY = cursorY + Math.max(0, Math.round((nameSize * 1.24 - iconSize) / 2));
        ctx.drawImage(iconImage, contentX, iconY, iconSize, iconSize);
        textX += iconSize + iconGap;
        textWidth -= iconSize + iconGap;
      }
      cursorY = drawFittedText(ctx, itemName, textX, cursorY, textWidth, Math.round(nameSize * 1.24), 2);
      const dyes = getDyeEntries(row, locale);
      if (dyes.length) {
        cursorY += 5;
        ctx.font = `600 ${dyeSize}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
        let cursorX = textX;
        const dyeContentWidth = contentX + contentWidth - textX;
        for (const dye of dyes) {
          const swatchSize = Math.max(10, Math.round(dyeSize * 0.9));
          const dyeTextWidth = ctx.measureText(dye.name).width;
          if (cursorX + swatchSize + 5 + dyeTextWidth > textX + dyeContentWidth) {
            break;
          }
          ctx.fillStyle = dye.hex || "#000000";
          ctx.fillRect(cursorX, cursorY + 1, swatchSize, swatchSize);
          ctx.strokeStyle = "rgba(0,0,0,0.18)";
          ctx.lineWidth = 1;
          ctx.strokeRect(cursorX, cursorY + 1, swatchSize, swatchSize);
          ctx.fillStyle = textColor;
          ctx.fillText(dye.name, cursorX + swatchSize + 5, cursorY);
          cursorX += swatchSize + 5 + dyeTextWidth + 16;
        }
        cursorY += Math.round(dyeSize * 1.55);
      }
      cursorY += 7;
    }
    cursorY += 13;
  }
  ctx.restore();
}

function renderCanvas() {
  const ctx = templateExportCanvas.getContext("2d");
  const metrics = getTemplateMetrics();
  templateExportCanvas.width = metrics.totalWidth;
  templateExportCanvas.height = metrics.totalHeight;
  // Must set AFTER resize — canvas resize resets all context properties
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  const width = templateExportCanvas.width;
  const height = templateExportCanvas.height;
  const settings = state.settings;
  const headerHeight = metrics.headerHeight;
  const footerHeight = metrics.footerHeight;
  const contentY = headerHeight;
  const contentHeight = metrics.contentHeight;
  const infoWidth = metrics.infoWidth;
  const imageWidth = metrics.imageWidth;
  const imageHeight = metrics.imageHeight;
  const imageY = metrics.imageY;

  if (metrics.aspect === FIGMA_TEMPLATE_ASPECT) {
    getTemplateRenderProfile().renderCanvas(ctx, metrics);
    renderCanvasPreview(templateExportCanvas, metrics);
    updateCanvasUploadLayer();
    return;
  }

  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = settings.panelColor;
  ctx.fillRect(0, 0, width, height);

  if (headerHeight) {
    ctx.fillStyle = settings.textColor;
    ctx.font = `800 ${scaleTemplateUnit(34)}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(settings.topText, width / 2, headerHeight / 2);
  }

  drawImageCover(ctx, getTemplateImageSlot(DEFAULT_IMAGE_SLOT_ID).image, 0, imageY, imageWidth, imageHeight);

  if (infoWidth > 0) {
    ctx.fillStyle = settings.panelColor;
    ctx.fillRect(imageWidth, contentY, infoWidth, contentHeight);
    ctx.strokeStyle = "rgba(20, 28, 45, 0.14)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(imageWidth, contentY);
    ctx.lineTo(imageWidth, contentY + contentHeight);
    ctx.stroke();
    drawTemplateInfo(ctx, imageWidth, contentY, infoWidth, contentHeight);
  }

  if (footerHeight) {
    ctx.fillStyle = settings.textColor;
    ctx.font = `600 ${scaleTemplateUnit(18)}px 'Source Han Serif CN', 'Microsoft YaHei', serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(settings.bottomText, width / 2, height - footerHeight / 2);
  }
  renderCanvasPreview(templateExportCanvas, metrics);
  updateCanvasUploadLayer();
}

let canvasResumeRenderFrame = 0;

function renderCanvasAfterPageResume() {
  if (!templateInitialized || document.hidden) {
    return;
  }
  if (canvasResumeRenderFrame) {
    cancelAnimationFrame(canvasResumeRenderFrame);
  }
  canvasResumeRenderFrame = requestAnimationFrame(() => {
    canvasResumeRenderFrame = 0;
    renderCanvas();
  });
}

function renderCanvasPreviewSoon() {
  window.cancelAnimationFrame(templatePreviewResizeFrame);
  templatePreviewResizeFrame = window.requestAnimationFrame(() => {
    const metrics = getTemplateMetrics();
    if (templateExportCanvas.width && templateExportCanvas.height) {
      renderCanvasPreview(templateExportCanvas, metrics);
    }
    positionCanvasUploadLayer();
  });
}

async function render(options = {}) {
  const renderId = ++renderSequence;
  const loadingTaskId = options.loadingTaskId || 0;
  if (options.showLoading && !loadingTaskId) {
    options.loadingTaskId = beginTemplateLoadingTask();
  }
  syncTemplateMeta();
  syncSettingsControls();
  if (templateSourceName) {
    templateSourceName.textContent = state.sourceName;
  }
  renderLanguageControls();
  // Incremental row update — preserve existing DOM to avoid icon flash
  const sortedRows = sortRowsForTemplate(state.rows);
  const existingRows = new Map();
  for (const child of templateEditor.children) {
    const slot = child.dataset?.slot;
    if (slot) existingRows.set(slot, child);
  }
  const seen = new Set();
  for (const row of sortedRows) {
    seen.add(row.slot);
    const existing = existingRows.get(row.slot);
    const existingHasItem = !existing?.classList.contains("editor-search-mode");
    const newHasItem = Boolean(row.item);
    const iconMatches = existing?.querySelector(".editor-item-icon")?.src === buildIconUrl(row.item?.icon);
    if (existing && existingHasItem === newHasItem && iconMatches) {
      // Icon unchanged, item state unchanged — update text/dye in-place
      updateRowInPlace(existing, row);
    } else {
      // Structural change — replace the row
      if (existing) existing.replaceWith(renderRow(row));
      else templateEditor.appendChild(renderRow(row));
    }
  }
  // Remove rows no longer in state
  for (const child of templateEditor.children) {
    if (child.dataset?.slot && !seen.has(child.dataset.slot)) {
      child.remove();
    }
  }
  try {
    const assetPromises = getTemplateAssetPromises();
    await Promise.all([
      ensureTemplateIconsReady(),
      templateFontsReady ? Promise.resolve() : templateFontsReadyPromise,
      ...assetPromises,
    ]);
    if (renderId !== renderSequence) {
      return;
    }
    renderCanvas();
  } finally {
    if (options.showLoading && options.loadingTaskId) {
      finishTemplateLoadingTask(options.loadingTaskId);
    }
  }
  window.NSGlamourUiLanguage?.refresh?.();
  syncTemplateToStore();
}

async function downloadCanvas() {
  if (!templateFontsReady) {
    setStatus("正在加载字体...");
    await templateFontsReadyPromise;
    renderCanvas();
  }
  if (!templateExportCanvas.width || !templateExportCanvas.height) {
    renderCanvas();
  }
  templateExportCanvas.toBlob((blob) => {
    if (!blob) {
      setStatus("图片生成失败", true);
      return;
    }
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `幻化模板_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus("已保存图片");
  }, "image/png");
}

function bindTextSetting(input, key) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    const maxLength = key === "ecSubtitleText" ? 120 : 80;
    state.settings[key] = String(input.value || "").slice(0, maxLength);
    writeSettings();
    renderCanvas();
  });
}

function bindEcSubtitlePart(input, key, normalizeValue) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    state.settings[key] = normalizeValue(input.value);
    state.settings.ecSubtitleTouched = true;
    state.settings.ecSubtitleText = formatEcSubtitleParts({
      left: state.settings.ecSubtitleLeftText,
      symbol: state.settings.ecSubtitleSymbolText,
      right: state.settings.ecSubtitleRightText,
    });
    writeSettings();
    renderCanvas();
  });
}

function bindColorSetting(input, key, fallback) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    state.settings[key] = normalizeHexColor(input.value, fallback);
    writeSettings();
    renderCanvas();
  });
}

function bindCanvasUploadLayer(layer) {
  if (!layer || boundCanvasUploadLayers.has(layer)) {
    return;
  }
  boundCanvasUploadLayers.add(layer);
  layer.addEventListener("click", (event) => {
    event.stopPropagation();
    activeImageSlotId = getTemplateImageSlotDefinition(layer.dataset.templateImageSlot).id;
    templateImageInput.click();
  });
  ["dragenter", "dragover"].forEach((eventName) => {
    layer.addEventListener(eventName, (event) => {
      if (!hasDraggedTemplateImagePayload(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      highlightImageDropTarget(event.clientX, event.clientY);
    });
  });
  layer.addEventListener("dragleave", (event) => {
    if (!hasDraggedTemplateImagePayload(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (shouldClearImageDropHighlightForDragLeave(event)) {
      clearImageDropHighlight();
    }
  });
  layer.addEventListener("drop", (event) => {
    if (!hasDraggedTemplateImagePayload(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clearImageDropHighlight();
    const slotId = layer.dataset.templateImageSlot;
    const files = getDroppedImageFiles(event);
    if (files.length) {
      queueImageFiles(files, slotId);
    } else if (getDroppedImageUrl(event)) {
      handleDroppedImageUrl(getDroppedImageUrl(event), slotId);
    } else {
      setStatus("上传图片", true);
    }
  });
}

function bindCanvasShellDrop() {
  if (!templateCanvasShell || isCanvasShellDropBound) {
    return;
  }
  isCanvasShellDropBound = true;
  ["dragenter", "dragover"].forEach((eventName) => {
    templateCanvasShell.addEventListener(eventName, (event) => {
      if (!hasDraggedTemplateImagePayload(event)) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      event.dataTransfer.dropEffect = "copy";
      highlightImageDropTarget(event.clientX, event.clientY);
    });
  });
  templateCanvasShell.addEventListener("dragleave", (event) => {
    if (!hasDraggedTemplateImagePayload(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (shouldClearImageDropHighlightForDragLeave(event)) {
      clearImageDropHighlight();
    }
  });
  templateCanvasShell.addEventListener("drop", (event) => {
    if (!hasDraggedTemplateImagePayload(event)) {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    clearImageDropHighlight();
    const slotId = getImageSlotIdFromClientPoint(event.clientX, event.clientY, { useDropRegion: true });
    const files = getDroppedImageFiles(event);
    if (files.length) {
      queueImageFiles(files, slotId);
    } else if (getDroppedImageUrl(event)) {
      handleDroppedImageUrl(getDroppedImageUrl(event), slotId);
    } else {
      setStatus("上传图片", true);
    }
  });
}

function bindTemplateDocumentDropGuard() {
  if (isTemplateDocumentDropGuardBound) {
    return;
  }
  isTemplateDocumentDropGuardBound = true;
  const targets = [window, document, document.documentElement].filter(Boolean);
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    targets.forEach((target) => {
      target.addEventListener(eventName, handleTemplateFileDragEvent, { capture: true });
    });
  });
}

templateImageInput.addEventListener("change", (event) => {
  if (event.target.files?.length) {
    queueImageFiles(event.target.files, activeImageSlotId);
  }
  templateImageInput.value = "";
});
getCanvasUploadLayers().forEach(bindCanvasUploadLayer);
bindCanvasShellDrop();
bindTemplateDocumentDropGuard();
window.addEventListener("resize", renderCanvasPreviewSoon);
document.addEventListener("visibilitychange", renderCanvasAfterPageResume);
window.addEventListener("pageshow", renderCanvasAfterPageResume);
window.addEventListener("focus", renderCanvasAfterPageResume);
templateCropResetButton?.addEventListener("click", resetImageCrop);
templateCropApplyButton?.addEventListener("click", applyImageCrop);
templateCropCancelButton?.addEventListener("click", closeImageCropper);
templateCropZoomRange?.addEventListener("input", (event) => setCropZoomFromControl(event.target.value));
templateCropZoomInput?.addEventListener("input", (event) => setCropZoomFromControl(event.target.value));
templateCropOverlay?.addEventListener("click", (event) => {
  if (event.target === templateCropOverlay) {
    closeImageCropper();
  }
});
templateSelectorOpenButton?.addEventListener("click", openTemplateSelectorDialog);
templateSelectorCloseButton?.addEventListener("click", closeTemplateSelectorDialog);
templateSelectorOverlay?.addEventListener("click", (event) => {
  if (event.target === templateSelectorOverlay) {
    closeTemplateSelectorDialog();
  }
});
templateImportLinkButton?.addEventListener("click", openTemplateImportDialog);
templateImportCloseButton?.addEventListener("click", closeTemplateImportDialog);
templateImportOverlay?.addEventListener("click", (event) => {
  if (event.target === templateImportOverlay) {
    closeTemplateImportDialog();
  }
});
templateImportForm?.addEventListener("submit", importTemplateGlamourLink);
templateClearDraftButton?.addEventListener("click", resetDraft);
templateDownloadButton?.addEventListener("click", downloadCanvas);
themeToggleBtn.addEventListener("click", () => {
  closeRecentPanel();
  window.NSGlamourUiLanguage?.closeMenu?.();
  toggleTheme();
});
templateRecentButton?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleRecentPanel();
});
templateRecentPanel?.addEventListener("click", (event) => event.stopPropagation());
templateClearRecentButton?.addEventListener("click", () => {
  writeRecentCache([]);
  renderRecentList();
  setStatus("已清空最近载入缓存");
});
window.addEventListener("storage", (event) => {
  if (event.key === RECENT_CACHE_KEY) {
    refreshOpenRecentPanel();
  }
});
document.addEventListener("click", closeDyePickers);
document.addEventListener("click", closeRecentPanel);
window.addEventListener("nsglamour:header-popover-open", (event) => {
  if (event.detail?.source !== "recent") {
    closeRecentPanel();
  }
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && templateSelectorOverlay && !templateSelectorOverlay.classList.contains("hidden")) {
    closeTemplateSelectorDialog();
    return;
  }
  if (event.key === "Escape" && templateImportOverlay && !templateImportOverlay.classList.contains("hidden")) {
    closeTemplateImportDialog();
  }
});

window.addEventListener("nsglamour:ui-language-change", async () => {
  if (!templateInitialized) {
    return;
  }
  const loadingTaskId = beginTemplateLoadingTask();
  try {
    const changed = await ensureTemplateSupportsCurrentUiLanguage();
    if (changed) {
      syncSettingsControls();
      await render({ loadingTaskId });
    } else {
      renderTemplateSelector();
      window.NSGlamourUiLanguage?.refresh?.();
    }
  } finally {
    finishTemplateLoadingTask(loadingTaskId);
  }
});

bindTextSetting(templateTopTextInput, "topText");
bindTextSetting(templateCharacterNameInput, "characterName");
bindEcSubtitlePart(templateEcSubtitleLeftInput, "ecSubtitleLeftText", normalizeEcSubtitlePart);
bindEcSubtitlePart(templateEcSubtitleSymbolInput, "ecSubtitleSymbolText", normalizeEcSubtitleSymbol);
bindEcSubtitlePart(templateEcSubtitleRightInput, "ecSubtitleRightText", normalizeEcSubtitlePart);
if (templateDyeFrameControls) {
  templateDyeFrameControls.addEventListener("click", (event) => {
    const button = event.target.closest("[data-template-dye-frame]");
    if (!button) {
      return;
    }
    const nextMode = normalizeFigmaDyeFrameMode(button.dataset.templateDyeFrame);
    if (state.settings.dyeFrameMode === nextMode) {
      return;
    }
    state.settings.dyeFrameMode = nextMode;
    writeSettings();
    syncSettingsControls();
    renderCanvas();
  });
}
// ---- Store integration ----
/** Merge current rows back into sourceParsed for bidir sync */
function buildParsedPayloadForSync() {
  if (!state.sourceParsed?.resolved_equipment) return null;
  const parsed = JSON.parse(JSON.stringify(state.sourceParsed));

  // Get current slot occupation from rows
  const activeSlots = new Set(state.rows.filter((r) => r.item).map((r) => r.slot));

  // Remove entries that were deleted in template
  parsed.resolved_equipment = parsed.resolved_equipment.filter((e) => activeSlots.has(e.slot));

  // Add entries that were added in template (from rows not in sourceParsed)
  const parsedSlots = new Set(parsed.resolved_equipment.map((e) => e.slot));
  for (const row of state.rows) {
    if (!row.item) continue;
    if (!parsedSlots.has(row.slot)) {
      parsed.resolved_equipment.push({
        slot: row.slot,
        slot_names: NSGlamourCommon.getSlotNames(row.slot),
        candidates: [{ ...row.item }],
      });
    }
  }

  // Update dye info for existing entries
  for (const row of state.rows) {
    if (!row.item) continue;
    const entry = parsed.resolved_equipment.find((e) => e.slot === row.slot);
    if (!entry || !entry.candidates?.length) continue;
    const candidate = entry.candidates[0];
    candidate.dye_entries = row.item.dye_entries || [];
    candidate.dye_count = row.item.dye_count ?? candidate.dye_count;
    candidate.dye_display = row.item.dye_display || "";
    candidate.dye_display_by_locale = row.item.dye_display_by_locale || {};
    if (candidate.dye_entries[0]) entry.dye_id = candidate.dye_entries[0].id;
    if (candidate.dye_entries[1]) entry.dye_id_2 = candidate.dye_entries[1].id;
  }
  return parsed;
}

function syncTemplateToStore() {
  if (_storeIgnoreSync) { return; }
  const draft = buildCurrentDraft();
  if (!draft || !draft.entries?.length) { return; }
  const signature = JSON.stringify({
    locale: state.locale,
    sourceName: draft.sourceName || "",
    entries: draft.entries.map((entry) => ({
      slot: entry.slot,
      key: entry.item?.key || "",
      name: entry.item?.name || "",
      dyes: (entry.item?.dye_entries || []).map((dye) => dye?.id || 0),
    })),
  });
  const payload = NSGlamourStore.equipmentSync.makeTemplatePayload({
    draft,
    parsed: buildParsedPayloadForSync(),
    locale: state.locale,
  });
  if (signature !== lastTemplateStoreSyncSignature) {
    _storeIgnoreSync = true;
    try {
      NSGlamourStore.equipment.set(payload);
      lastTemplateStoreSyncSignature = signature;
    } finally {
      _storeIgnoreSync = false;
    }
  }
}

// ---- Store sync helpers ----

function draftFromStorePayload(data) {
  state.sourceParsed = NSGlamourStore.equipmentSync.getTemplateSourceParsed(data);
  return NSGlamourStore.equipmentSync.getTemplateDraft(data, (parsed) => (
    NSGlamourCommon.buildDraftFromParsedPayload(parsed, { stainsByLocale: state.stainsByLocale })
  ));
}

NSGlamourStore.on("equipment:changed", async (data) => {
  if (_storeIgnoreSync || !NSGlamourStore.equipmentSync.isPayload(data)) { return; }
  const storeLocale = NSGlamourStore.equipmentSync.getLocale(data);
  if (storeLocale) state.locale = storeLocale;
  await ensureStains(state.locale);
  const draft = draftFromStorePayload(data);
  if (!draft) return;
  _storeIgnoreSync = true;
  try {
    applyDraft(draft, { saveDraft: false });
    render();
  } finally {
    _storeIgnoreSync = false;
  }
});

// ---- Author SNS popup ----
const SNS_ICONS = {
  weibo:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M10.1 16.8c-1.4 0-2.7-.3-3.7-.9-.3-.1-.4-.5-.2-.8.1-.1.4-.2.6-.1 1 .5 2.1.8 3.3.8 1.7 0 3.2-.6 4.2-1.7.5-.5.9-1.1 1.2-1.8.1-.2.4-.3.6-.1.1.2.1.4 0 .6-.3.9-.8 1.6-1.4 2.2-1.2 1.2-2.8 1.8-4.6 1.8z"/></svg>',
  xiaohongshu: '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/><text x="12" y="16" text-anchor="middle" font-size="10" fill="white" font-weight="bold">红</text></svg>',
  douyin:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2zm4.5 8.5c-.8 0-1.6-.2-2.2-.6v4.6c0 2-1.6 3.6-3.6 3.6s-3.6-1.6-3.6-3.6 1.6-3.6 3.6-3.6c.2 0 .4 0 .6.1v2c-.2 0-.4-.1-.6-.1-1 0-1.8.8-1.8 1.8s.8 1.8 1.8 1.8 1.8-.8 1.8-1.8V6h2c0 2.5 2 4.5 4.5 4.5v2z"/></svg>',
  bilibili:  '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.8 4.5H6.2c-1.2 0-2.2 1-2.2 2.2v8.6c0 1.2 1 2.2 2.2 2.2h11.6c1.2 0 2.2-1 2.2-2.2V6.7c0-1.2-1-2.2-2.2-2.2zM9.5 11.5V8l4 1.7-4 1.8z"/></svg>',
  github:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.5 2 2 6.5 2 12c0 4.4 2.9 8.2 6.8 9.5.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.2-3.4-1.2-.5-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.6.4-1.1.7-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.7 1a9.5 9.5 0 0 1 5 0c1.9-1.3 2.7-1 2.7-1 .6 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7 1 .7 2v2.9c0 .3.2.6.7.5C19.1 20.2 22 16.4 22 12c0-5.5-4.5-10-10-10z"/></svg>',
  website:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M2 12h20M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10A15 15 0 0 1 12 2z"/></svg>',
};

const SNS_LABELS = {
  weibo: "微博", xiaohongshu: "小红书", douyin: "抖音",
  bilibili: "B站", github: "GitHub", twitter: "X", website: "网站",
};

let authorSnsPopup = null;

function getAuthorSnsPopup() {
  if (authorSnsPopup) return authorSnsPopup;
  authorSnsPopup = document.createElement("div");
  authorSnsPopup.className = "author-sns-popup hidden";
  authorSnsPopup.setAttribute("role", "dialog");
  authorSnsPopup.addEventListener("click", (e) => e.stopPropagation());
  document.body.appendChild(authorSnsPopup);
  return authorSnsPopup;
}

function renderAuthorSnsPopup(template) {
  const popup = getAuthorSnsPopup();
  const sns = Array.isArray(template?.authorSns) ? template.authorSns : [];
  if (!sns.length && template?.authorUrl) {
    sns.push({ platform: "website", url: template.authorUrl });
  }
  if (!sns.length) { popup.classList.add("hidden"); return; }

  popup.innerHTML = "";
  sns.forEach((item) => {
    const link = document.createElement("a");
    link.className = "author-sns-link";
    link.href = item.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.title = SNS_LABELS[item.platform] || item.platform;
    link.setAttribute("aria-label", SNS_LABELS[item.platform] || item.platform);
    const icon = document.createElement("span");
    icon.className = "author-sns-icon";
    icon.innerHTML = SNS_ICONS[item.platform] || SNS_ICONS.website;
    link.appendChild(icon);
    popup.appendChild(link);
  });
}

function showAuthorSnsPopup(template, anchorEl) {
  if (!template) return;
  renderAuthorSnsPopup(template);
  const popup = getAuthorSnsPopup();
  const rect = anchorEl.getBoundingClientRect();
  popup.style.top = `${rect.bottom + 6}px`;
  popup.style.left = `${rect.left}px`;
  popup.classList.remove("hidden");
}

function hideAuthorSnsPopup() {
  const popup = getAuthorSnsPopup();
  popup.classList.add("hidden");
}

document.addEventListener("click", (e) => {
  if (!e.target.closest(".author-sns-popup") && !e.target.closest(".template-meta-author")) {
    hideAuthorSnsPopup();
  }
});

// Make author name clickable
function updateAuthorClickHandler() {
  if (!templateAuthor) return;
  templateAuthor.style.cursor = "pointer";
  templateAuthor.title = "点击查看作者社交链接";
  templateAuthor.onclick = (e) => {
    e.stopPropagation();
    const template = getCurrentTemplate();
    if (template) showAuthorSnsPopup(template, templateAuthor);
  };
}

// Hook into template switch to refresh author SNS
const _origSwitchTemplate = switchTemplate;
switchTemplate = async function (templateId) {
  await _origSwitchTemplate(templateId);
  hideAuthorSnsPopup();
  updateAuthorClickHandler();
};

(async function init() {
  loadTheme();
  await window.NSGlamourUiLanguage?.ready?.();

  // Pull equipment from store (from equipinfo page or previous session)
  const storedEquip = NSGlamourStore.equipment.get();
  let loadedFromStore = false;
  if (NSGlamourStore.equipmentSync.isPayload(storedEquip)) {
    const draft = draftFromStorePayload(storedEquip);
    if (draft?.entries?.length) {
      applyDraft(draft, { saveDraft: false });
      const storeLocale = NSGlamourStore.equipmentSync.getLocale(storedEquip);
      if (storeLocale) state.locale = storeLocale;
      loadedFromStore = true;
    }
  }

  loadSettings();
  await ensureTemplateSupportsCurrentUiLanguage({ saveDraft: false });
  await ensureStains(state.locale);
  if (!loadedFromStore) {
    await loadDraft(); // only load old draft if store had nothing
    syncTemplateToStore();
  }
  await ensureTemplateLocalesReady();
  await restoreCurrentTemplateImages();
  templateInitialized = true;
  updateAuthorClickHandler();
  render();
})();
