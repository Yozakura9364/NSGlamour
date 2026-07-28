const crypto = require("node:crypto");
const fs = require("node:fs");
const http = require("node:http");
const path = require("node:path");
const { spawn } = require("node:child_process");

const PROGRAM_DATA = process.env.ProgramData || "C:\\ProgramData";
const ROOT = process.env.NSGLAMOUR_READER_ROOT || path.join(PROGRAM_DATA, "NSGlamourReader");
const CONFIG_PATH = process.env.NSGLAMOUR_READER_CONFIG || path.join(ROOT, "config.json");
const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf8"));
const token = fs.readFileSync(config.tokenFile || path.join(ROOT, "reader-token.txt"), "utf8").trim();

const LISTEN_HOST = String(config.listenHost || "127.0.0.1");
const LISTEN_PORT = Number(config.listenPort || 18770);
const DEVTOOLS_PORT = Number(config.devToolsPort || 18765);
const EDGE_PATH = String(config.edgePath || "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe");
const PROFILE_DIR = String(config.profileDir || path.join(ROOT, "edge-profile"));
const QR_PATH = String(config.qrPath || path.join(ROOT, "login-qr.png"));
const LOG_PATH = String(config.logPath || path.join(ROOT, "reader.log"));
const RS_ORIGIN = "https://ff14risingstones.web.sdo.com";
const RS_HOME = `${RS_ORIGIN}/pc/index.html#/post`;
const RS_API = "https://apiff14risingstones.web.sdo.com/api/home/";

let edgeProcess = null;
let edgeHeadlessMode = null;
let loginInProgress = false;
let operationQueue = Promise.resolve();

function log(message) {
  const line = `${new Date().toISOString()} ${String(message).replace(/[\r\n]+/g, " ")}\n`;
  fs.appendFileSync(LOG_PATH, line, "utf8");
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function serialized(operation) {
  const current = operationQueue.then(operation, operation);
  operationQueue = current.catch(() => {});
  return current;
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left || ""));
  const b = Buffer.from(String(right || ""));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function isAuthorized(request) {
  const value = String(request.headers.authorization || "");
  return value.startsWith("Bearer ") && safeEqual(value.slice(7), token);
}

async function readJson(request, maxBytes = 16 * 1024) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) throw new Error("Request body is too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  return text ? JSON.parse(text) : {};
}

function sendJson(response, status, payload) {
  const body = Buffer.from(JSON.stringify(payload));
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
  });
  response.end(body);
}

async function devToolsJson(endpoint, options = {}) {
  const response = await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}${endpoint}`, options);
  if (!response.ok) throw new Error(`DevTools HTTP ${response.status}`);
  return response.json();
}

async function isDevToolsAlive() {
  try {
    await devToolsJson("/json/version");
    return true;
  } catch {
    return false;
  }
}

async function stopEdge() {
  if (await isDevToolsAlive()) {
    try {
      const version = await devToolsJson("/json/version");
      if (version.webSocketDebuggerUrl) {
        const session = await new CdpSession(version.webSocketDebuggerUrl).open();
        try {
          await Promise.race([session.send("Browser.close"), delay(2000)]);
        } finally {
          session.close();
        }
      }
    } catch (error) {
      log(`Graceful Edge shutdown failed: ${error?.message || error}`);
    }
  }
  const deadline = Date.now() + 8000;
  while (Date.now() < deadline && await isDevToolsAlive()) await delay(250);
  if (await isDevToolsAlive() && edgeProcess) edgeProcess.kill();
  while (await isDevToolsAlive() && Date.now() < deadline + 3000) await delay(250);
  edgeProcess = null;
  edgeHeadlessMode = null;
}

async function ensureEdge({ headless = true } = {}) {
  const alive = await isDevToolsAlive();
  if (alive && edgeHeadlessMode === headless) return;
  if (alive) await stopEdge();
  fs.mkdirSync(PROFILE_DIR, { recursive: true });
  const edgeArgs = [
    `--remote-debugging-port=${DEVTOOLS_PORT}`,
    "--remote-debugging-address=127.0.0.1",
    `--user-data-dir=${PROFILE_DIR}`,
    "--no-sandbox",
    "--disable-gpu",
    "--disable-blink-features=AutomationControlled",
    "--no-first-run",
    "--no-default-browser-check",
    RS_HOME,
  ];
  if (headless) edgeArgs.splice(edgeArgs.length - 1, 0, "--headless=new");
  const spawnedProcess = spawn(EDGE_PATH, edgeArgs, {
    detached: false,
    stdio: ["ignore", "ignore", "pipe"],
    windowsHide: true,
  });
  edgeProcess = spawnedProcess;
  edgeHeadlessMode = headless;
  spawnedProcess.stderr.on("data", (chunk) => log(`Edge stderr: ${chunk.toString("utf8")}`));
  spawnedProcess.on("error", (error) => log(`Edge spawn failed: ${error?.message || error}`));
  spawnedProcess.on("exit", (code) => {
    log(`Edge exited with code ${code}`);
    if (edgeProcess === spawnedProcess) {
      edgeProcess = null;
      edgeHeadlessMode = null;
    }
  });

  const deadline = Date.now() + 15000;
  while (Date.now() < deadline) {
    if (await isDevToolsAlive()) return;
    await delay(250);
  }
  throw new Error("Edge DevTools did not start");
}

class CdpSession {
  constructor(wsUrl) {
    this.ws = new WebSocket(wsUrl);
    this.pending = new Map();
    this.nextId = 1;
  }

  async open() {
    this.ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      const pending = this.pending.get(message.id);
      if (!pending) return;
      this.pending.delete(message.id);
      if (message.error) pending.reject(new Error(message.error.message || "CDP request failed"));
      else pending.resolve(message.result || {});
    });
    await new Promise((resolve, reject) => {
      this.ws.addEventListener("open", resolve, { once: true });
      this.ws.addEventListener("error", () => reject(new Error("Cannot connect to Edge DevTools")), { once: true });
    });
    return this;
  }

  send(method, params = {}) {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.ws.send(JSON.stringify({ id, method, params }));
    });
  }

  async evaluate(expression) {
    const result = await this.send("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (result.exceptionDetails) {
      const detail = result.exceptionDetails.exception?.description || result.exceptionDetails.text;
      throw new Error(detail || "Page evaluation failed");
    }
    return result.result?.value;
  }

  close() {
    this.ws.close();
  }
}

async function pageTargets({ headless = true } = {}) {
  await ensureEdge({ headless });
  const targets = await devToolsJson("/json/list");
  return targets.filter((target) => target.type === "page" && target.webSocketDebuggerUrl);
}

async function openPage(url, { headless = true } = {}) {
  await ensureEdge({ headless });
  return devToolsJson(`/json/new?${encodeURIComponent(url)}`, { method: "PUT" });
}

async function findTarget({ allowLogin = false } = {}) {
  let targets = await pageTargets();
  let target = targets.find((item) => String(item.url || "").startsWith(RS_ORIGIN));
  if (!target && allowLogin) {
    target = targets.find((item) => String(item.url || "").startsWith("https://login.u.sdo.com/"));
  }
  if (!target) {
    target = await openPage(RS_HOME);
    await delay(1000);
    targets = await pageTargets();
    target = targets.find((item) => item.id === target.id) || target;
  }
  if (!target?.webSocketDebuggerUrl) throw new Error("No usable Edge page target");
  return target;
}

async function waitFor(predicate, timeoutMs, message) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const value = await predicate();
    if (value) return value;
    await delay(250);
  }
  throw new Error(message);
}

async function startLogin() {
  loginInProgress = true;
  const targets = await pageTargets({ headless: false });
  for (const staleTarget of targets.filter((item) => String(item.url || "").startsWith("https://login.u.sdo.com/"))) {
    await fetch(`http://127.0.0.1:${DEVTOOLS_PORT}/json/close/${encodeURIComponent(staleTarget.id)}`);
  }
  const target = targets.find((item) => String(item.url || "").startsWith(RS_ORIGIN))
    || await openPage(RS_HOME, { headless: false });
  let session = await new CdpSession(target.webSocketDebuggerUrl).open();
  try {
    await session.send("Page.enable");
    await session.send("Runtime.enable");
    const entryState = await waitFor(
      () => session.evaluate(`(() => {
        if (document.querySelector("#isAgreementAccept") && document.querySelector("#code2")) return "login";
        if (document.querySelector("button.login-btn")) return "home";
        return "";
      })()`),
      30000,
      "The Rising Stones login entry was not rendered",
    );
    if (entryState === "home") {
      await session.evaluate(`document.querySelector("button.login-btn")?.click()`);
      session.close();
      const loginTarget = await waitFor(
        async () => {
          const currentTargets = await pageTargets({ headless: false });
          return currentTargets.find((item) => String(item.url || "").startsWith("https://login.u.sdo.com/"));
        },
        30000,
        "The Rising Stones login page did not open",
      );
      session = await new CdpSession(loginTarget.webSocketDebuggerUrl).open();
      await session.send("Page.enable");
      await session.send("Runtime.enable");
    }
    await waitFor(
      () => session.evaluate(`Boolean(
        document.querySelector("#isAgreementAccept")
        && document.querySelector("#code2")
        && typeof jump === "function"
        && globalThis.QRCodeBiz
      )`),
      30000,
      "The complete QR login page was not rendered",
    );
    await session.evaluate(`(() => {
      const agreement = document.querySelector("#isAgreementAccept");
      if (!agreement.checked) agreement.click();
      jump("code2d");
      document.querySelector("#code2")?.classList.remove("show_error");
      QRCodeBiz.Start(true);
      clearInterval(window.__nsgQrGuard);
      window.__nsgQrGuard = setInterval(() => {
        const expired = document.querySelector("#code2")?.classList.contains("show_error") || false;
        if (!expired && QRCodeBiz?.Work === 0) QRCodeBiz.Resume();
      }, 1000);
    })()`);
    await waitFor(
      () => session.evaluate(`(() => {
        const image = document.querySelector("#code2 img");
        return Boolean(image?.complete && image.naturalWidth >= 120 && QRCodeBiz?.Work === 1);
      })()`),
      15000,
      "The QR image was not loaded",
    );

    const qrSource = await session.evaluate(`(() => {
      const source = document.querySelector("#code2 img");
      return source.currentSrc || source.src;
    })()`);
    if (typeof qrSource !== "string" || !qrSource) {
      throw new Error("The QR image source is missing");
    }
    let qrImage;
    if (qrSource.startsWith("data:image/") && qrSource.includes(";base64,")) {
      qrImage = Buffer.from(qrSource.slice(qrSource.indexOf(",") + 1), "base64");
    } else {
      const qrUrl = new URL(qrSource);
      if (qrUrl.protocol !== "https:" || !(qrUrl.hostname === "sdo.com" || qrUrl.hostname.endsWith(".sdo.com"))) {
        throw new Error(`Unsupported QR image host: ${qrUrl.hostname}`);
      }
      const cookieState = await session.send("Network.getCookies", { urls: [qrUrl.href] });
      const cookieHeader = (cookieState.cookies || [])
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
      const qrResponse = await fetch(qrUrl, {
        headers: {
          Accept: "image/*",
          Referer: RS_HOME,
          ...(cookieHeader ? { Cookie: cookieHeader } : {}),
        },
        signal: AbortSignal.timeout(15000),
      });
      if (!qrResponse.ok) throw new Error(`QR image HTTP ${qrResponse.status}`);
      const contentLength = Number(qrResponse.headers.get("content-length") || 0);
      if (contentLength > 2 * 1024 * 1024) throw new Error("The QR image is too large");
      qrImage = Buffer.from(await qrResponse.arrayBuffer());
    }
    const pngSignature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    if (qrImage.length < 100 || !qrImage.subarray(0, pngSignature.length).equals(pngSignature)) {
      throw new Error("The exported QR image is not a valid PNG");
    }
    if (qrImage.length > 2 * 1024 * 1024) throw new Error("The QR image is too large");
    fs.writeFileSync(QR_PATH, qrImage);
    return { ok: true, qrReady: true };
  } finally {
    session.close();
  }
}

function fetchExpression(ids) {
  return `(async () => {
    const ids = ${JSON.stringify(ids)};
    const API_BASE = ${JSON.stringify(RS_API)};
    const successCodes = new Set(["10000", "10002"]);
    async function api(path, params = {}, extraCodes = []) {
      const url = new URL(API_BASE + path);
      Object.entries({ ...params, tempsuid: crypto.randomUUID() }).forEach(([key, value]) => url.searchParams.set(key, value));
      const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json, text/plain, */*" } });
      const payload = await response.json();
      const code = String(payload?.code ?? payload?.Code ?? "");
      if (!response.ok || !(successCodes.has(code) || extraCodes.includes(code) || (!code && payload && "data" in payload))) {
        throw new Error(String(payload?.msg || payload?.message || payload?.Message || code || response.status));
      }
      return payload.data;
    }
    await api("GHome/isLogin", {}, ["10103", "10104"]);
    const details = [];
    const failures = [];
    for (const id of ids) {
      try { details.push(await api("glamour/glamourDetail", { id })); }
      catch (error) { failures.push({ id, message: error?.message || "read failed" }); }
    }
    return { ok: true, ids, details, failures, page: location.href, mode: "remote-page" };
  })()`;
}

function normalizeUserAgent(userAgent) {
  return String(userAgent || "").replace(/HeadlessChrome\//g, "Chrome/");
}

async function readDetailsDirect(target, ids) {
  const session = await new CdpSession(target.webSocketDebuggerUrl).open();
  let cookies;
  let userAgent;
  try {
    const cookieState = await session.send("Network.getCookies", {
      urls: [RS_ORIGIN, RS_HOME, RS_API],
    });
    cookies = Array.isArray(cookieState.cookies) ? cookieState.cookies : [];
    userAgent = await session.evaluate("navigator.userAgent");
  } finally {
    session.close();
  }
  if (!cookies.length) throw new Error("The dedicated Edge profile has no Rising Stones cookies");
  const cookieHeader = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
  const successCodes = new Set(["10000", "10002"]);
  async function api(apiPath, params = {}, extraCodes = []) {
    const url = new URL(apiPath, RS_API);
    for (const [key, value] of Object.entries({ ...params, tempsuid: crypto.randomUUID() })) {
      url.searchParams.set(key, value);
    }
    const response = await fetch(url, {
      headers: {
        Accept: "application/json, text/plain, */*",
        Cookie: cookieHeader,
        Origin: RS_ORIGIN,
        Referer: RS_HOME,
        "User-Agent": normalizeUserAgent(userAgent),
      },
      signal: AbortSignal.timeout(30000),
    });
    const text = await response.text();
    if (text.length > 2 * 1024 * 1024) throw new Error("Rising Stones API response is too large");
    let payload;
    try { payload = JSON.parse(text); }
    catch { throw new Error(`Rising Stones API returned invalid JSON (HTTP ${response.status})`); }
    const code = String(payload?.code ?? payload?.Code ?? "");
    if (!response.ok || !(successCodes.has(code) || extraCodes.includes(code) || (!code && payload && "data" in payload))) {
      throw new Error(String(payload?.msg || payload?.message || payload?.Message || code || response.status));
    }
    return payload.data;
  }
  await api("GHome/isLogin", {}, ["10103", "10104"]);
  const details = [];
  const failures = [];
  for (const id of ids) {
    try { details.push(await api("glamour/glamourDetail", { id })); }
    catch (error) { failures.push({ id, message: error?.message || "read failed" }); }
  }
  return { ok: true, ids, details, failures, page: RS_HOME, mode: "remote-http" };
}

async function readDetails(ids) {
  const target = await findTarget();
  try {
    return await readDetailsDirect(target, ids);
  } catch (error) {
    log(`Direct Rising Stones API read failed: ${error?.message || error}`);
  }
  const session = await new CdpSession(target.webSocketDebuggerUrl).open();
  try {
    await session.send("Runtime.enable");
    const result = await session.evaluate(fetchExpression(ids));
    if (!result || typeof result !== "object") throw new Error("Invalid page result");
    return result;
  } finally {
    session.close();
  }
}

async function loginStatus() {
  const targets = await pageTargets({ headless: !loginInProgress });
  const risingStonesTargets = targets.filter((item) => String(item.url || "").startsWith(RS_ORIGIN));
  let lastResult = { loggedIn: false };
  for (const target of risingStonesTargets) {
    const session = await new CdpSession(target.webSocketDebuggerUrl).open();
    try {
      lastResult = await session.evaluate(`(async () => {
        try {
          const url = new URL(${JSON.stringify(`${RS_API}GHome/isLogin`)});
          url.searchParams.set("tempsuid", crypto.randomUUID());
          const response = await fetch(url, { credentials: "include", headers: { Accept: "application/json, text/plain, */*" } });
          const payload = await response.json();
          const code = String(payload?.code ?? payload?.Code ?? "");
          return { loggedIn: response.ok && ["10000", "10002", "10103", "10104"].includes(code), code };
        } catch (error) { return { loggedIn: false, error: error?.message || "fetch failed" }; }
      })()`);
    } finally {
      session.close();
    }
    if (lastResult?.loggedIn) break;
  }
  if (lastResult?.loggedIn) {
    if (fs.existsSync(QR_PATH)) fs.rmSync(QR_PATH, { force: true });
    loginInProgress = false;
    await delay(1000);
    await ensureEdge({ headless: true });
    return { ok: true, ...lastResult, mode: "headless" };
  }
  const hasLoginPage = targets.some((item) => String(item.url || "").startsWith("https://login.u.sdo.com/"));
  return { ok: true, ...lastResult, page: hasLoginPage ? "login" : "risingstones" };
}

async function handle(request, response) {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);
  if (request.method === "GET" && url.pathname === "/health") {
    sendJson(response, 200, { ok: true, edge: await isDevToolsAlive() });
    return;
  }
  if (!isAuthorized(request)) {
    sendJson(response, 401, { ok: false, error: "Unauthorized" });
    return;
  }
  if (request.method === "POST" && url.pathname === "/v1/login/start") {
    sendJson(response, 200, await serialized(startLogin));
    return;
  }
  if (request.method === "GET" && url.pathname === "/v1/login/qr") {
    if (!fs.existsSync(QR_PATH)) {
      sendJson(response, 404, { ok: false, error: "QR image is not ready" });
      return;
    }
    const image = fs.readFileSync(QR_PATH);
    response.writeHead(200, {
      "Content-Type": "image/png",
      "Content-Length": image.length,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    });
    response.end(image);
    return;
  }
  if (request.method === "GET" && url.pathname === "/v1/login/status") {
    sendJson(response, 200, await serialized(loginStatus));
    return;
  }
  if (request.method === "POST" && url.pathname === "/v1/glamour-detail") {
    const payload = await readJson(request);
    const ids = Array.isArray(payload.ids) ? payload.ids.map(String) : [];
    if (!ids.length || ids.length > 5 || ids.some((id) => !/^\d{4,20}$/.test(id))) {
      sendJson(response, 400, { ok: false, error: "ids must contain 1-5 numeric detail IDs" });
      return;
    }
    sendJson(response, 200, await serialized(() => readDetails(ids)));
    return;
  }
  sendJson(response, 404, { ok: false, error: "Not found" });
}

fs.mkdirSync(ROOT, { recursive: true });
const server = http.createServer((request, response) => {
  handle(request, response).catch((error) => {
    log(`Request failed: ${error?.message || String(error)}`);
    if (!response.headersSent) sendJson(response, 502, { ok: false, error: error?.message || "Reader failed" });
    else response.end();
  });
});
server.listen(LISTEN_PORT, LISTEN_HOST, () => log(`Reader listening on ${LISTEN_HOST}:${LISTEN_PORT}`));

process.on("uncaughtException", (error) => log(`Uncaught exception: ${error?.stack || error}`));
process.on("unhandledRejection", (error) => log(`Unhandled rejection: ${error?.stack || error}`));
