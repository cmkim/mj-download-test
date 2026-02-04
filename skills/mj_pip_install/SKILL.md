---
name: mj-pip-install
description: 미드저니 워크플로에 필요한 Playwright와 Chromium을 설치합니다.
---

# Playwright + Chromium 설치

`install.py`를 실행하여 Playwright 패키지와 Chromium 브라우저를 설치한다.

## 함수 시그니처

```python
from skills.mj_pip_install.install import main

main()
```

## 동작 흐름
1. `pip install playwright` — Playwright 패키지 설치
2. `python -m playwright install chromium` — Chromium 브라우저 설치

## 결과 보고
- 각 단계의 성공/실패를 사용자에게 보고한다.
- 설치가 모두 완료되면 `mj-login`으로 최초 로그인을 진행하라고 안내한다.
