"""Playwright, Chromium 브라우저 및 Google API 클라이언트 설치 스크립트."""

import subprocess
import sys


def main():
    print("1/3  Playwright 패키지 설치 중...")
    subprocess.check_call([sys.executable, "-m", "pip", "install", "playwright"])

    print("2/3  Chromium 브라우저 설치 중...")
    subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])

    print("3/3  Google API 클라이언트 패키지 설치 중...")
    subprocess.check_call([
        sys.executable, "-m", "pip", "install",
        "google-api-python-client", "google-auth-httplib2", "google-auth-oauthlib",
    ])

    print("설치 완료. 이제 Playwright 기반 스킬을 사용할 수 있습니다.")


if __name__ == "__main__":
    main()
