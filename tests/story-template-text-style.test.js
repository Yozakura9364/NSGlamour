const assert = require("node:assert/strict");
const fs = require("node:fs");

const definitionsSource = fs.readFileSync("static/template-definitions.js", "utf8");
const templateSource = fs.readFileSync("static/template.js", "utf8");
const rendererSource = fs.readFileSync("static/template-renderer-story.js", "utf8");
const htmlSource = fs.readFileSync("templates/template.html", "utf8");

assert.match(definitionsSource, /storyTextColor:\s*true/);
assert.match(templateSource, /storyTextColorMode:\s*"white"/);
assert.match(templateSource, /outerGlowOpacity:\s*0\.(?:[0-3]\d*)/);
assert.match(htmlSource, /data-story-text-color="white"/);
assert.match(htmlSource, /data-story-text-color="black"/);
assert.match(rendererSource, /function getStoryTextPalette\(/);
assert.match(rendererSource, /drawDoublePicCopyright\(ctx, metrics\);/);
assert.doesNotMatch(rendererSource, /if \(hasStoryEquipmentLines/);

console.log("story template text style ok");
