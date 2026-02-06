"""미드저니 Organize 페이지에서 오늘 이미지를 일괄 다운로드."""

import os
import sys
from datetime import date

from playwright.sync_api import TimeoutError as PlaywrightTimeout
from playwright.sync_api import sync_playwright

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)
DEFAULT_DOWNLOAD_DIR = os.path.join(_PROJECT_ROOT, "downloads", "MJ_Backups")


def _get_save_path(download_dir: str) -> str:
    """날짜별 파일명 생성. 중복 시 (1), (2) 접미사 추가."""
    os.makedirs(download_dir, exist_ok=True)
    today = date.today().strftime("%Y%m%d")
    base = os.path.join(download_dir, f"MJ_Backup_{today}.zip")
    if not os.path.exists(base):
        return base
    idx = 1
    while True:
        path = os.path.join(download_dir, f"MJ_Backup_{today}({idx}).zip")
        if not os.path.exists(path):
            return path
        idx += 1


def download(account_name: str, download_dir: str = DEFAULT_DOWNLOAD_DIR) -> bool:
    """세션 JSON으로 미드저니에 접속하여 오늘 이미지를 zip으로 다운로드한다."""
    print("미드저니 다운로드 스크립트 시작...")
    sys.stdout.flush()

    session_file = os.path.join(_PROJECT_ROOT, "sessions", f"mj_{account_name}.json")

    if not os.path.exists(session_file):
        print(f"[오류] 세션 파일이 없습니다: {session_file}")
        print("먼저 로그인을 진행해 주세요.")
        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-crashpad",
                "--disable-crash-reporter",
                "--disable-gpu",
            ],
            ignore_default_args=["--enable-automation"],
        )
        context = None
        try:
            context = browser.new_context(
                storage_state=session_file,
                user_agent=(
                    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                    "AppleWebKit/537.36 (KHTML, like Gecko) "
                    "Chrome/131.0.0.0 Safari/537.36"
                ),
            )
            page = context.new_page()

            print("미드저니 Organize 페이지 접속 중...")
            page.goto("https://www.midjourney.com/organize", timeout=60000)

            print("'Today' 섹션 탐색 중...")
            today_el = page.locator("text=Today").first
            try:
                today_el.wait_for(state="visible", timeout=30000)
            except PlaywrightTimeout:
                screenshot_path = os.path.join(download_dir, "debug_page.png")
                os.makedirs(download_dir, exist_ok=True)
                page.screenshot(path=screenshot_path)
                print(f"[디버그] 페이지 스크린샷 저장: {screenshot_path}")
                print("오늘 생성한 이미지가 없습니다 (No images found for today).")
                return False

            print("이미지 전체 선택 중...")
            select_btn = page.locator("button", has_text="Select all").first
            select_btn.click(timeout=10000)
            page.wait_for_timeout(3000)

            print("다운로드 버튼 클릭 중...")
            download_btn = page.locator("button", has_text="Download").first
            download_btn.wait_for(state="visible", timeout=10000)

            with page.expect_download(timeout=120000) as download_info:
                download_btn.click()

            dl = download_info.value
            save_path = _get_save_path(download_dir)
            dl.save_as(save_path)
            print(f"다운로드 완료: {save_path}")
            page.wait_for_timeout(3000)
            return True

        except PlaywrightTimeout:
            print("[오류] 시간 초과 — 페이지 로딩 또는 다운로드가 지연되고 있습니다.")
            return False
        except Exception as e:
            print(f"[오류] 실행 중 문제 발생: {e}")
            return False
        finally:
            if context:
                context.close()
            browser.close()
