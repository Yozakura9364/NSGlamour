"""Open the dedicated Rising Stones browser for a persistent server login."""

from __future__ import annotations

from app import (
    RS_BROWSER_HEADLESS,
    RS_GLAMOUR_HOME_URL,
    ensure_risingstones_browser,
    shutdown_risingstones_browser_locked,
)


def mode_label(headless: bool) -> str:
    return "headless" if headless else "可见"


def main() -> None:
    state = ensure_risingstones_browser(
        open_login=True,
        prefer_headless=False,
        force_relaunch=True,
    )
    print("石之家专用浏览器已切到可见登录模式。")
    print(f"登录页面: {RS_GLAMOUR_HOME_URL}")
    print(f"DevTools 端口: {state.get('port')}")
    print(f"专用登录资料目录: {state.get('profile')}")
    print("请在弹出的专用浏览器里完成石之家小号登录。")
    print("服务器上如没有桌面，请先进入 Xvfb/VNC/noVNC 再运行本脚本。")
    try:
        input(f"登录完成后，回到此终端按回车，脚本会自动切回当前默认模式（{mode_label(RS_BROWSER_HEADLESS)}）。")
    except EOFError:
        print("当前终端不可交互。登录完成后，请手动重启 NSGlamour 服务，让后台浏览器重新按默认模式启动。")
        return

    shutdown_risingstones_browser_locked(state.get("port"))
    restored = ensure_risingstones_browser(
        prefer_headless=RS_BROWSER_HEADLESS,
        force_relaunch=True,
    )
    print(f"已切回 {mode_label(RS_BROWSER_HEADLESS)} 模式。")
    print(f"当前 DevTools 端口: {restored.get('port')}")
    print(f"专用登录资料目录: {restored.get('profile')}")


if __name__ == "__main__":
    main()
