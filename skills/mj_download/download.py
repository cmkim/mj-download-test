"""미드저니 Organize 페이지에서 오늘 이미지를 일괄 다운로드."""

import os
import time
from datetime import date
from playwright.sync_api import sync_playwright, TimeoutError as PlaywrightTimeout

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
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


def download(account_name: str, download_dir: str = DEFAULT_DOWNLOAD_DIR):
    """세션 JSON으로 미드저니에 접속하여 오늘 이미지를 zip으로 다운로드한다."""
    session_file = os.path.join(_PROJECT_ROOT, "sessions", f"mj_{account_name}.json")

    with sync_playwright() as p:
        browser = p.chromium.launch(
            headless=False,
            args=[
                "--disable-blink-features=AutomationControlled",
                "--disable-crashpad",
                "--disable-crash-reporter",
                "--disable-gpu",
            ],
        )
        context = browser.new_context(storage_state=session_file)
        page = context.new_page()

        try:
            print("미드저니 Organize 페이지 접속 중...")
            page.goto("https://www.midjourney.com/organize", timeout=60000)
            page.wait_for_load_state("load")
            time.sleep(3)

            print("'Today' 섹션 탐색 중...")
            today_el = page.locator("text=Today").first
            if not today_el.is_visible(timeout=10000):
                print("오늘 생성한 이미지가 없습니다 (No images found for today).")
                return

            print("이미지 전체 선택 중...")
            select_btn = page.locator("button", has_text="Select all").first
            select_btn.click(timeout=10000)
            time.sleep(1)

            print("다운로드 버튼 클릭 중...")
            download_btn = page.locator("button", has_text="Download").first
            download_btn.wait_for(state="visible", timeout=10000)

            with page.expect_download(timeout=60000) as download_info:
                download_btn.click()

            dl = download_info.value
            save_path = _get_save_path(download_dir)
            dl.save_as(save_path)
            print(f"다운로드 완료: {save_path}")

        except PlaywrightTimeout:
            print("[오류] 시간 초과 — 페이지 로딩 또는 다운로드가 지연되고 있습니다.")
        except Exception as e:
            print(f"[오류] 실행 중 문제 발생: {e}")
        finally:
            context.close()
            browser.close()
