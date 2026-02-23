chcp 65001 > $null
[Console]::InputEncoding  = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
$OutputEncoding           = [System.Text.UTF8Encoding]::new($false)

$FNM_PATH = "$HOME\.local\share\fnm"
if (Test-Path $FNM_PATH) {
    # PATH에 fnm 경로 추가
    $env:PATH = "$FNM_PATH;$env:PATH"
    # fnm 환경 활성화
    fnm env --use-on-cd --shell powershell | Out-String | Invoke-Expression
}
