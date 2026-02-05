"""미드저니 로그인 — 세션을 JSON으로 저장."""

import os
import time

from playwright.sync_api import sync_playwright

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)


def login(account_name: str):
    """브라우저를 열어 미드저니 로그인을 진행하고 세션을 JSON으로 저장한다."""
    print(f"[mj_{account_name}] 브라우저를 열어 로그인을 진행합니다.")
    print("디스코드 계정으로 미드저니에 로그인해 주세요.")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=True,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-crashpad",
                "--disable-crash-reporter",
                "--disable-gpu",
            ],
            ignore_default_args=["--enable-automation"],
        )
        context = browser.new_context()
        page = context.new_page()
        page.goto("https://www.midjourney.com/home", timeout=60000)
        page.wait_for_load_state("load")

        print("\n60초 내에 로그인을 완료해 주세요.")
        time.sleep(60)

        session_dir = os.path.join(_PROJECT_ROOT, "sessions")
        os.makedirs(session_dir, exist_ok=True)
        session_file = os.path.join(session_dir, f"mj_{account_name}.json")
        context.storage_state(path=session_file)

        context.close()
        browser.close()

    print(f"[mj_{account_name}] 로그인 정보가 저장되었습니다: {session_file}")
