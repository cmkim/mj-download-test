"""미드저니 로그인 — 전용 프로필에 세션 저장."""

import os
from playwright.sync_api import sync_playwright

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def login(account_name: str):
    """브라우저를 열어 미드저니 로그인을 진행하고 프로필에 세션을 저장한다."""
    print(f"[mj_{account_name}] 브라우저를 열어 로그인을 진행합니다.")
    print("디스코드 계정으로 미드저니에 로그인해 주세요.")

    with sync_playwright() as p:
        browser = p.chromium.launch_persistent_context(
            user_data_dir=os.path.join(_PROJECT_ROOT, "login_profile", f"mj_{account_name}"),
            headless=False,
            args=["--disable-blink-features=AutomationControlled"],
            ignore_default_args=["--enable-automation"],
        )
        page = browser.pages[0] if browser.pages else browser.new_page()
        page.goto("https://www.midjourney.com/explore", timeout=60000)
        page.wait_for_load_state("load")

        print("\n로그인 완료 후 브라우저 창을 닫아 주세요. 창이 닫히면 세션을 저장합니다.")
        page.wait_for_event("close", timeout=0)

    print(f"[mj_{account_name}] 로그인 정보가 저장되었습니다.")
