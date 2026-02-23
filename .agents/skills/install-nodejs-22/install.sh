#!/bin/bash
# install.sh - Node.js 22 환경 자동 설정 스크립트

set -e  # 에러 발생 시 중단

echo "Node.js 22 환경 설정 시작..."
echo ""

# 1. fnm 확인 및 설치
if command -v fnm &> /dev/null; then
  echo "✓ fnm이 이미 설치되어 있습니다."
else
  echo "✗ fnm이 설치되어 있지 않습니다."
  echo "fnm 설치 중..."

  curl -fsSL https://fnm.vercel.app/install | bash

  # fnm PATH 추가 (현재 세션용)
  export PATH="$HOME/.local/share/fnm:$PATH"
  eval "$(fnm env --use-on-cd)"

  echo "✓ fnm이 설치되었습니다."
  echo ""
  echo "⚠️  셸 설정이 업데이트되었습니다. 터미널을 재시작하거나 다음 명령을 실행하세요:"

  # 사용 중인 셸 감지
  if [ -n "$ZSH_VERSION" ]; then
    echo "  source ~/.zshrc"
  elif [ -n "$BASH_VERSION" ]; then
    echo "  source ~/.bashrc"
  else
    echo "  source ~/.bashrc  # 또는 source ~/.zshrc"
  fi

  echo ""
  echo "설정 후 이 스크립트를 다시 실행하여 Node.js 22를 설치하세요."
  exit 0
fi

# 2. Node.js 22 확인 및 설치
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$NODE_VERSION" -ge 22 ]; then
    echo "✓ Node.js $NODE_VERSION가 이미 설치되어 있습니다."
  else
    echo "✗ Node.js 버전이 $NODE_VERSION입니다. 22로 업그레이드합니다."
    fnm install 22
    fnm use 22
    fnm default 22  # 기본 버전으로 설정
    echo "✓ Node.js 22가 설치되었습니다."
  fi
else
  echo "✗ Node.js가 설치되어 있지 않습니다."
  echo "Node.js 22 설치 중..."
  fnm install 22
  fnm use 22
  fnm default 22  # 기본 버전으로 설정
  echo "✓ Node.js 22가 설치되었습니다."
fi

# 3. pnpm 확인 및 활성화
echo ""
if command -v pnpm &> /dev/null; then
  echo "✓ pnpm이 이미 활성화되어 있습니다."
else
  echo "✗ pnpm이 활성화되어 있지 않습니다."
  echo "pnpm 활성화 중 (corepack)..."

  # OS 감지
  if [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]] || [[ "$OSTYPE" == "win32" ]]; then
    # Windows (Git Bash)
    echo ""
    echo "⚠️  Windows 환경입니다."
    echo "관리자 권한으로 새 터미널(cmd 또는 PowerShell)을 열어 다음 명령을 실행하세요:"
    echo "  corepack enable"
    echo ""
    echo "실행 후 pnpm이 활성화됩니다."
  else
    # macOS/Linux
    echo "sudo 권한이 필요합니다."
    sudo corepack enable
    echo "✓ pnpm이 활성화되었습니다."
  fi
fi

echo ""
echo "======================================"
echo "환경 설정이 완료되었습니다!"
echo "======================================"
echo ""
echo "설치 확인:"
echo "  fnm --version   # fnm 버전"
echo "  node --version  # v22.x.x"
echo "  pnpm --version  # pnpm 버전"
echo ""
echo "프로젝트 시작:"
echo "  cd /path/to/project"
echo "  fnm use         # .nvmrc 기반 자동 전환"
echo "  pnpm install    # 의존성 설치"
