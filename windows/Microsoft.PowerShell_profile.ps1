# 1. 윈도우 기본 콘솔 환경을 UTF-8로 강제 변경 (안내 메시지 숨김)
chcp 65001 > $null

# 2. BOM이 없는 순수한 UTF-8 인코딩 세팅
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding           = [System.Text.UTF8Encoding]::new($false)

# 3. 파워쉘 명령어(Out-File 등)로 파일을 저장할 때도 기본값을 UTF-8로 고정
$PSDefaultParameterValues['*:Encoding'] = 'utf8'

# nodejs 버전 선택을 위한 fnm 설정
$FNM_PATH = "$HOME\.local\share\fnm"
if (Test-Path $FNM_PATH) {
    # PATH에 fnm 경로 추가
    $env:PATH = "$FNM_PATH;$env:PATH"
    # fnm 환경 활성화
    fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
}
