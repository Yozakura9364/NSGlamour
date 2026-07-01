const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("static/template.js", "utf8");

assert.match(source, /const templateExportCanvas = document\.createElement\("canvas"\);/);
assert.match(source, /function renderCanvasPreview\(sourceCanvas, metrics\)/);
assert.match(source, /templateExportCanvas\.toBlob\(/);
assert.doesNotMatch(source, /templateCanvas\.toBlob\(/);

console.log("template preview/export split ok");
