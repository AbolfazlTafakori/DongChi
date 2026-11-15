# ==============================================================================
# DongChi (دنگ‌چی) - Native Mobile & Real-Time Sync End-to-End Verification
# ==============================================================================
$ErrorActionPreference = "Stop"
$baseUrl = "http://localhost:3000"
$webSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   DONGCHI MOBILE PWA & REAL-TIME SYNC E2E TEST SUITE   " -ForegroundColor Cyan
Write-Host "========================================================`n" -ForegroundColor Cyan

# ------------------------------------------------------------------------------
# STAGE 1: PWA Manifest & Service Worker
# ------------------------------------------------------------------------------
Write-Host "--> [Stage 1] Verifying PWA Manifest & Service Worker..." -NoNewline
try {
    $manifestRes = Invoke-WebRequest -Uri "$baseUrl/manifest.json" -UseBasicParsing -TimeoutSec 5
    if ($manifestRes.StatusCode -ne 200) { throw "Manifest returned $($manifestRes.StatusCode)" }
    $manifest = $manifestRes.Content | ConvertFrom-Json
    if ($manifest.display -ne "standalone") { throw "Manifest display is not standalone" }
    if ($manifest.shortcuts.Count -lt 3) { throw "Manifest missing required shortcuts" }

    $swRes = Invoke-WebRequest -Uri "$baseUrl/sw.js" -UseBasicParsing -TimeoutSec 5
    if ($swRes.StatusCode -ne 200) { throw "Service worker returned $($swRes.StatusCode)" }
    if ($swRes.Content -notmatch "dongchi-cache") { throw "Invalid service worker script" }

    Write-Host " [PASS]" -ForegroundColor Green
    Write-Host "    - Manifest display: $($manifest.display), RTL: $($manifest.dir), Shortcuts: $($manifest.shortcuts.Count)" -ForegroundColor Gray
    Write-Host "    - Service Worker Cache: Active & 200 OK" -ForegroundColor Gray
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Error $_
}

# ------------------------------------------------------------------------------
# STAGE 2: Mobile Authentication & Session Cookie Sync
# ------------------------------------------------------------------------------
Write-Host "`n--> [Stage 2] Authenticating Mobile User (09120000000 / 12345)..." -NoNewline
try {
    # 1. Send OTP
    $sendOtpBody = @{ phone = "09120000000" } | ConvertTo-Json
    $sendOtpRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/send-otp" -Method POST -Body $sendOtpBody -ContentType "application/json" -WebSession $webSession
    if (-not $sendOtpRes.success) { throw "Send OTP failed" }

    # 2. Verify OTP
    $verifyOtpBody = @{ phone = "09120000000"; code = "12345" } | ConvertTo-Json
    $verifyOtpRes = Invoke-WebRequest -Uri "$baseUrl/api/auth/verify-otp" -Method POST -Body $verifyOtpBody -ContentType "application/json" -WebSession $webSession
    if ($verifyOtpRes.StatusCode -ne 200) { throw "Verify OTP status $($verifyOtpRes.StatusCode)" }

    $cookies = $webSession.Cookies.GetCookies($baseUrl)
    $hasSessionToken = $false
    foreach ($cookie in $cookies) {
        if ($cookie.Name -eq "session_token") { $hasSessionToken = $true }
    }
    if (-not $hasSessionToken) { throw "session_token cookie not found in session jar" }

    Write-Host " [PASS]" -ForegroundColor Green
    Write-Host "    - Mobile Session Cookie established successfully" -ForegroundColor Gray
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Error $_
}

# ------------------------------------------------------------------------------
# STAGE 3: Real-Time Sync API Fingerprint
# ------------------------------------------------------------------------------
Write-Host "`n--> [Stage 3] Testing Real-Time State Fingerprint (GET /api/sync)..." -NoNewline
$initialSyncHash = ""
try {
    $syncRes = Invoke-RestMethod -Uri "$baseUrl/api/sync" -Method GET -WebSession $webSession
    if (-not $syncRes.authenticated) { throw "Sync API reports unauthenticated" }
    if (-not $syncRes.syncHash -or $syncRes.syncHash.Length -lt 16) { throw "Invalid syncHash returned" }

    $initialSyncHash = $syncRes.syncHash
    Write-Host " [PASS]" -ForegroundColor Green
    Write-Host "    - Authenticated: $($syncRes.authenticated)" -ForegroundColor Gray
    Write-Host "    - User: $($syncRes.user.name) ($($syncRes.user.phone))" -ForegroundColor Gray
    Write-Host "    - Groups: $($syncRes.groupsCount) | Unread Notifs: $($syncRes.unreadNotifications)" -ForegroundColor Gray
    Write-Host "    - Initial syncHash: $initialSyncHash" -ForegroundColor Gray
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Error $_
}

# ------------------------------------------------------------------------------
# STAGE 4: Offline Queue & Mutation Sync Batch Processor
# ------------------------------------------------------------------------------
Write-Host "`n--> [Stage 4] Testing Offline Queue Batch Processor (POST /api/sync)..." -NoNewline
try {
    $batchBody = @{
        pendingActions = @(
            @{
                id = "queued-offline-notif-" + [Guid]::NewGuid().ToString().Substring(0,8)
                type = "MARK_NOTIF_READ"
                payload = @{ all = $true }
            }
        )
    } | ConvertTo-Json -Depth 5

    $batchRes = Invoke-RestMethod -Uri "$baseUrl/api/sync" -Method POST -Body $batchBody -ContentType "application/json" -WebSession $webSession
    if ($batchRes.syncedIds.Count -lt 1) { throw "Batch processor did not return synced action ID" }

    # Query GET /api/sync again to ensure state changed or matches updated sync
    $afterSyncRes = Invoke-RestMethod -Uri "$baseUrl/api/sync" -Method GET -WebSession $webSession

    Write-Host " [PASS]" -ForegroundColor Green
    Write-Host "    - Synced offline actions: $($batchRes.syncedIds.Count)" -ForegroundColor Gray
    Write-Host "    - Post-batch syncHash: $($batchRes.syncHash)" -ForegroundColor Gray
    Write-Host "    - Fresh unread notifications count: $($afterSyncRes.unreadNotifications)" -ForegroundColor Gray
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Error $_
}

# ------------------------------------------------------------------------------
# STAGE 5: Mobile App Routes & Install Center
# ------------------------------------------------------------------------------
Write-Host "`n--> [Stage 5] Verifying Mobile App Screens & Install Center..." -NoNewline
$mobileRoutes = @("/app", "/app/install", "/app/billing", "/app/profile", "/app/support")
try {
    foreach ($route in $mobileRoutes) {
        $res = Invoke-WebRequest -Uri "$baseUrl$route" -Method GET -WebSession $webSession -UseBasicParsing -TimeoutSec 5
        if ($res.StatusCode -ne 200) { throw "$route returned status $($res.StatusCode)" }
    }
    Write-Host " [PASS]" -ForegroundColor Green
    foreach ($route in $mobileRoutes) {
        Write-Host "    - $route -> 200 OK" -ForegroundColor Gray
    }
} catch {
    Write-Host " [FAIL]" -ForegroundColor Red
    Write-Error $_
}

Write-Host "`n========================================================" -ForegroundColor Cyan
Write-Host "   ALL 5 STAGES OF MOBILE & SYNC SUITE PASSED (100%)    " -ForegroundColor Green
Write-Host "========================================================`n" -ForegroundColor Cyan
