const fs = require("node:fs");
const path = require("node:path");

function isWindows() {
  return process.platform === "win32";
}

function isMac() {
  return process.platform === "darwin";
}

function fileExists(targetPath) {
  return Boolean(targetPath) && fs.existsSync(targetPath);
}

function uniquePaths(paths) {
  const seen = new Set();
  const result = [];
  for (const item of paths) {
    const value = String(item || "").trim();
    if (!value || seen.has(value)) {
      continue;
    }
    seen.add(value);
    result.push(value);
  }
  return result;
}

function getCandidateBrowsers() {
  const envExecutable = process.env.NSGLAMOUR_PLAYWRIGHT_EXECUTABLE_PATH || process.env.PLAYWRIGHT_EXECUTABLE_PATH || "";
  const envChannel = (process.env.NSGLAMOUR_PLAYWRIGHT_CHANNEL || "").trim();
  const localAppData = process.env.LOCALAPPDATA || "";
  const programFiles = process.env.PROGRAMFILES || "C:\\Program Files";
  const programFilesX86 = process.env["PROGRAMFILES(X86)"] || "C:\\Program Files (x86)";

  const candidates = [];

  if (envExecutable) {
    candidates.push({
      id: "env-executable",
      label: "环境变量指定浏览器",
      channel: envChannel || "",
      executablePath: envExecutable,
    });
  }

  if (isWindows()) {
    candidates.push(
      {
        id: "edge",
        label: "Microsoft Edge",
        channel: "msedge",
        executablePath: path.join(programFilesX86, "Microsoft", "Edge", "Application", "msedge.exe"),
      },
      {
        id: "edge",
        label: "Microsoft Edge",
        channel: "msedge",
        executablePath: path.join(programFiles, "Microsoft", "Edge", "Application", "msedge.exe"),
      },
      {
        id: "edge",
        label: "Microsoft Edge",
        channel: "msedge",
        executablePath: path.join(localAppData, "Microsoft", "Edge", "Application", "msedge.exe"),
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: path.join(programFiles, "Google", "Chrome", "Application", "chrome.exe"),
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: path.join(programFilesX86, "Google", "Chrome", "Application", "chrome.exe"),
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: path.join(localAppData, "Google", "Chrome", "Application", "chrome.exe"),
      },
      {
        id: "chromium",
        label: "Chromium",
        channel: "",
        executablePath: path.join(localAppData, "Chromium", "Application", "chrome.exe"),
      },
    );
  } else if (isMac()) {
    candidates.push(
      {
        id: "edge",
        label: "Microsoft Edge",
        channel: "msedge",
        executablePath: "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      },
      {
        id: "chromium",
        label: "Chromium",
        channel: "",
        executablePath: "/Applications/Chromium.app/Contents/MacOS/Chromium",
      },
    );
  } else {
    candidates.push(
      {
        id: "edge",
        label: "Microsoft Edge",
        channel: "msedge",
        executablePath: "/usr/bin/microsoft-edge",
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: "/usr/bin/google-chrome",
      },
      {
        id: "chrome",
        label: "Google Chrome",
        channel: "chrome",
        executablePath: "/usr/bin/google-chrome-stable",
      },
      {
        id: "chromium",
        label: "Chromium",
        channel: "",
        executablePath: "/usr/bin/chromium",
      },
      {
        id: "chromium",
        label: "Chromium",
        channel: "",
        executablePath: "/usr/bin/chromium-browser",
      },
    );
  }

  return candidates.filter((candidate) => fileExists(candidate.executablePath));
}

function getPreferredSystemBrowser() {
  const candidates = getCandidateBrowsers();
  return candidates[0] || null;
}

function getPreferredPlaywrightLaunchOptions(baseOptions = {}) {
  const browser = getPreferredSystemBrowser();
  if (!browser) {
    return { ...baseOptions };
  }
  const launchOptions = {
    ...baseOptions,
    executablePath: browser.executablePath,
  };
  if (browser.channel) {
    launchOptions.channel = browser.channel;
  }
  return launchOptions;
}

function describePreferredSystemBrowser() {
  const browser = getPreferredSystemBrowser();
  if (!browser) {
    return "未找到系统浏览器，将回退到 Playwright 默认设置";
  }
  const parts = [browser.label, browser.executablePath];
  if (browser.channel) {
    parts.push(`channel=${browser.channel}`);
  }
  return parts.join(" | ");
}

function listDetectedSystemBrowsers() {
  return uniquePaths(
    getCandidateBrowsers().map((browser) => {
      const parts = [browser.label, browser.executablePath];
      if (browser.channel) {
        parts.push(`channel=${browser.channel}`);
      }
      return parts.join(" | ");
    }),
  );
}

module.exports = {
  describePreferredSystemBrowser,
  getPreferredPlaywrightLaunchOptions,
  getPreferredSystemBrowser,
  listDetectedSystemBrowsers,
};
