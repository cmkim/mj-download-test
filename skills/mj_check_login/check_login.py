"""미드저니 로그인 쿠키 파일 존재 여부 확인."""

import os

_PROJECT_ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def check_login(account_name: str) -> bool:
    """프로필 디렉토리 내 쿠키 파일 존재 여부를 확인하여 반환한다."""
    profile_path = os.path.join(_PROJECT_ROOT, "login_profile", f"mj_{account_name}")
    candidates = [
        os.path.join(profile_path, "Cookies"),
        os.path.join(profile_path, "Default", "Cookies"),
        os.path.join(profile_path, "Default", "Network", "Cookies"),
    ]
    result = any(os.path.exists(path) for path in candidates)
    if result:
        print(f"[mj_{account_name}] 로그인 정보가 존재합니다.")
    else:
        print(f"[mj_{account_name}] 로그인 정보가 없습니다.")
    return result
