# This script helps identify and terminate processes that might be locking files in the project.
# It specifically targets Metro, Sentry, and Node.js instances that often cause EBUSY errors on Windows.

Write-Host "--- Windows Resource Lock Cleanup ---" -ForegroundColor Cyan

# List common culprits
$culprits = @("node", "metro", "sentry-cli", "java")

foreach ($name in $culprits) {
    Try {
        $procs = Get-Process -Name $name -ErrorAction SilentlyContinue
        if ($procs) {
            Write-Host "Found $($procs.Count) instance(s) of $name. Terminating..." -ForegroundColor Yellow
            $procs | Stop-Process -Force
        }
    } Catch {
        Write-Host "Could not terminate $name. It might already be closed or require Admin privileges." -ForegroundColor Red
    }
}

# Clear watchman if installed
if (Get-Command watchman -ErrorAction SilentlyContinue) {
    Write-Host "Clearing Watchman watches..." -ForegroundColor Cyan
    watchman watch-del-all | Out-Null
}

Write-Host "Cleanup complete. Try your build again." -ForegroundColor Green
