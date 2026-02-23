# Parameters.
param(
    [string]$TaskName = "mj-download-task",
    [ValidateRange(0, 23)]
    [int]$Hour = 13,
    [ValidateRange(0, 59)]
    [int]$Minute = 5
)

# Paths and time.
$scriptPath = Join-Path $PSScriptRoot "run-mj-download.ps1"
$runTime = Get-Date -Hour $Hour -Minute $Minute -Second 0

# Action and trigger.
$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-ExecutionPolicy Bypass -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger `
    -Daily `
    -At $runTime `
    -RandomDelay (New-TimeSpan -Seconds 10)

# Register (overwrite if exists).
Register-ScheduledTask `
    -TaskName $TaskName `
    -Action $action `
    -Trigger $trigger `
    -Force | Out-Null

# Confirmation.
Write-Output ("Registered task '{0}' to run daily at {1:D2}:{2:D2} with random delay up to 10 seconds" -f $TaskName, $Hour, $Minute)
