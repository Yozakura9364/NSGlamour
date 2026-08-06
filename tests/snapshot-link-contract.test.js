const assert = require("node:assert/strict");
const fs = require("node:fs");

const source = fs.readFileSync("static/equipinfo.js", "utf8");
const createUrlSource = source.match(/function createSnapshotUrl\(snapshotId\) \{[\s\S]*?\n\}/)?.[0] || "";

assert.match(source, /const SNAPSHOT_PUBLIC_ORIGIN = "https:\/\/n9s\.site";/);
assert.match(createUrlSource, /new URL\(`\/g\/\$\{encodeURIComponent\(snapshotId\)\}`/);
assert.match(createUrlSource, /url\.searchParams\.set\("lang", language\)/);
assert.doesNotMatch(createUrlSource, /appPath\(/);
assert.match(source, /window\.open\("about:blank", "_blank"\)/);
assert.match(source, /snapshotWindow\.opener = null/);
assert.match(source, /snapshotWindow\.location\.replace\(snapshotUrl\)/);
assert.match(source, /snapshotWindow\.close\(\)/);

console.log("snapshot link contract ok");
