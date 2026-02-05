"""Playwright 및 Chromium 브라우저 설치 스크립트."""

import subprocess
import sys


def main():
    print("1/2  Playwright 패키지 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])

    print("2/2  Chromium 브라우저 설치 중...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])

    print("설치 완료. mj-download 스킬로 이미지를 다운로드할 수 있습니다.")


if __name__ == "__main__":
    main()
