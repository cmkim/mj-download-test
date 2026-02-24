chcp 65001 > $null
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8
[Console]::InputEncoding = $utf8
$OutputEncoding = $utf8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'

# 현재 시각을 로그 파일에 기록한다.
function Write-TimestampLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "Task Scheduler test at: $timestamp" | Out-File -FilePath $LogPath -Append -Encoding UTF8
}

# node 버전을 확인하여 로그 파일에 기록한다.
function Write-NodeVersionLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    try {
        $nodeVersion = (& node -v 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) {
            "node -v failed: $nodeVersion" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        }
        else {
            "node -v: $nodeVersion" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        }
    }
    catch {
        "node -v error: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
}

# codex 동작을 검증하기 위한 테스트용 함수.
function Invoke-CodexHello {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    try {
        $codexPrompt = "HELLO를 출력해 줘"
        "[codex hello] start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        & codex exec --dangerously-bypass-approvals-and-sandbox $codexPrompt 2>&1 | Tee-Object -FilePath $LogPath -Append | Out-Null
        "codex hello exit code: $LASTEXITCODE" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
    catch {
        "codex hello error: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
}

# 미드저니에서 지정한 계정의 작업물을 다운로드하여 아트 저장소에 업로드한다.
function Invoke-CodexMidjourney {
    param(
        [Parameter(Mandatory = $true)]
        [string]$Account,
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    try {
        $codexPrompt = "미드저니에서 $Account 계정의 작업물을 다운로드해서 아트 저장소에 업로드해 줘"
        "[codex mj] start: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        & codex exec --dangerously-bypass-approvals-and-sandbox $codexPrompt 2>&1 | Tee-Object -FilePath $LogPath -Append | Out-Null
        "codex mj exit code: $LASTEXITCODE" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
    catch {
        "codex mj error: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
}

$targetDir = Join-Path $PSScriptRoot "..\"
Push-Location $targetDir
$logPath = Join-Path (Get-Location) "result.txt"
try {
    Write-TimestampLog -LogPath $logPath
    Write-NodeVersionLog -LogPath $logPath
    Invoke-CodexHello -LogPath $logPath
    Invoke-CodexMidjourney -Account "ace" -LogPath $logPath
    Invoke-CodexMidjourney -Account "art" -LogPath $logPath
}
finally {
    Write-TimestampLog -LogPath $logPath
    Pop-Location
}
