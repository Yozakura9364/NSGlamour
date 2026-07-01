"""Open the dedicated Rising Stones browser for a persistent server login."""

from __future__ import annotations

from app import RS_GLAMOUR_HOME_URL, ensure_risingstones_browser


def main() -> None:
    state = ensure_risingstones_browser(open_login=True)
    print("石之家专用浏览器已启动。")
    print(f"登录页面: {RS_GLAMOUR_HOME_URL}")
    print(f"DevTools 端口: {state.get('port')}")
    print(f"专用登录资料目录: {state.get('profile')}")
    print("请在弹出的专用浏览器里完成石之家小号登录；服务器上如没有桌面，请用 Xvfb/VNC/noVNC 进入后再运行本脚本。")


if __name__ == "__main__":
    main()
