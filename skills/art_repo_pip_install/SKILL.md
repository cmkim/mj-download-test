---
name: art-repo-pip-install
description: Playwright, Chromium, Google API 클라이언트 패키지를 설치합니다. 최초 환경 설정 시 사용합니다.
---

# 환경 패키지 설치

`install.py`를 실행하여 Playwright, Chromium 브라우저, Google API 클라이언트 패키지를 설치한다.

## 함수 시그니처

```python
from skills.art_repo_pip_install.install import main

main()
```

## 동작 흐름
1. `pip install playwright` — Playwright 패키지 설치
2. `python -m playwright install chromium` — Chromium 브라우저 설치
3. `pip install google-api-python-client google-auth-httplib2 google-auth-oauthlib` — Google API 클라이언트 패키지 설치

## 결과 보고
- 각 단계의 성공/실패를 사용자에게 보고한다.
- 설치가 모두 완료되면 Playwright 기반 스킬을 사용할 수 있다고 안내한다.
