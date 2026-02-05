"""미드저니 로그인 쿠키 존재 여부 확인."""

import os
import sqlite3
import time

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

# Chromium 타임스탬프는 1601-01-01 기준 마이크로초. Unix epoch과의 차이(초).
_CHROMIUM_EPOCH_OFFSET = 11644473600
_24H_SECONDS = 24 * 60 * 60


def check_login(account_name: str) -> bool:
    """Cookies DB에 미드저니 인증 쿠키가 유효한지 확인하여 반환한다."""
    profile_path = os.path.join(_PROJECT_ROOT, "login_profile", f"mj_{account_name}")
    candidates = [
        os.path.join(profile_path, "Cookies"),
        os.path.join(profile_path, "Default", "Cookies"),
        os.path.join(profile_path, "Default", "Network", "Cookies"),
    ]

    for db_path in candidates:
        if not os.path.exists(db_path):
            continue
        try:
            conn = sqlite3.connect(f"file:{db_path}?mode=ro", uri=True)
            cursor = conn.execute(
                "SELECT MIN(expires_utc) FROM cookies"
                " WHERE name LIKE '%Host-Midjourney.AuthUserToken%'"
                " AND has_expires = 1"
            )
            row = cursor.fetchone()
            conn.close()

            if row[0] is None:
                continue

            expires_unix = row[0] / 1_000_000 - _CHROMIUM_EPOCH_OFFSET
            remaining = expires_unix - time.time()

            if remaining < _24H_SECONDS:
                print(f"[mj_{account_name}] 로그인 정보가 24시간 내에 만료됩니다. 재로그인이 필요합니다.")
                return False

            print(f"[mj_{account_name}] 로그인 정보가 존재합니다.")
            return True
        except sqlite3.Error:
            continue

    print(f"[mj_{account_name}] 로그인 정보가 없습니다.")
    return False
