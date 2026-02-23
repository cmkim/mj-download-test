chcp 65001 > $null
$utf8 = [System.Text.UTF8Encoding]::new($false)
[Console]::OutputEncoding = $utf8
[Console]::InputEncoding = $utf8
$OutputEncoding = $utf8
$PSDefaultParameterValues['Out-File:Encoding'] = 'utf8'
$PSDefaultParameterValues['Set-Content:Encoding'] = 'utf8'
$PSDefaultParameterValues['Add-Content:Encoding'] = 'utf8'

function Write-TimestampLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    "Task Scheduler test at: $timestamp" | Out-File -FilePath $LogPath -Append -Encoding UTF8
}

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

function Write-CodexHelloLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    try {
        $codexPrompt = "HELLO를 출력해 줘"
        $codexOutput = (& codex exec --dangerously-bypass-approvals-and-sandbox $codexPrompt 2>&1 | Out-String).Trim()
        if ($LASTEXITCODE -ne 0) {
            "codex exec failed: $codexOutput" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        }
        else {
            "codex exec output: $codexOutput" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        }
        "codex exec exit code: $LASTEXITCODE" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
    catch {
        "codex exec error: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
}

function Write-CodexMidjourneyLog {
    param(
        [Parameter(Mandatory = $true)]
        [string]$LogPath
    )

    try {
        $codexPrompt = "미드저니에서 ace 계정의 작업물을 다운로드해서 아트 저장소에 업로드해 줘"
        "[codex mj] start: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")" | Out-File -FilePath $LogPath -Append -Encoding UTF8
        & codex exec --dangerously-bypass-approvals-and-sandbox $codexPrompt 2>&1 | Tee-Object -FilePath $LogPath -Append | Out-Null
        "codex mj exit code: $LASTEXITCODE" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
    catch {
        "codex mj error: $($_.Exception.Message)" | Out-File -FilePath $LogPath -Append -Encoding UTF8
    }
}

$targetDir = Join-Path $PSScriptRoot "..\"
if (-not (Test-Path -Path $targetDir)) {
    New-Item -ItemType Directory -Path $targetDir -Force | Out-Null
}

Push-Location $targetDir
try {
    $logPath = Join-Path (Get-Location) "result.txt"
    Write-TimestampLog -LogPath $logPath
    Write-NodeVersionLog -LogPath $logPath
    Write-CodexHelloLog -LogPath $logPath
    Write-CodexMidjourneyLog -LogPath $logPath
    # 마지막에 한 번 더 출력함.
    Write-TimestampLog -LogPath $logPath
}
finally {
    Pop-Location
}
