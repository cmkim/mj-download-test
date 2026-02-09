"""미드저니 로그인 세션 유효성 확인."""

import json
import os
import time

_PROJECT_ROOT = os.path.dirname(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
)

_24H_SECONDS = 24 * 60 * 60


def check_login(account_name: str) -> bool:
    """세션 JSON에 유효한 미드저니 인증 쿠키가 있는지 확인하여 반환한다."""
    session_file = os.path.join(
        _PROJECT_ROOT, "sessions", f"mj_{account_name}.json"
    )

    if not os.path.exists(session_file):
        print(f"[mj_{account_name}] 로그인 정보가 없습니다.")
        return False

    try:
        with open(session_file) as f:
            state = json.load(f)
    except (json.JSONDecodeError, OSError):
        print(f"[mj_{account_name}] 세션 파일을 읽을 수 없습니다.")
        return False

    for cookie in state.get("cookies", []):
        if "AuthUserToken" not in cookie.get("name", ""):
            continue
        expires = cookie.get("expires", 0)
        remaining = expires - time.time()
        if remaining < _24H_SECONDS:
            print(f"[mj_{account_name}] 로그인 정보가 24시간 내에 만료됩니다. 재로그인이 필요합니다.")
            return False
        print(f"[mj_{account_name}] 로그인 정보가 존재합니다.")
        return True

    print(f"[mj_{account_name}] 로그인 정보가 없습니다.")
    return False
