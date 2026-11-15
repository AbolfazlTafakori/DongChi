# ==============================================================================
# verify-stealth-and-redesign.ps1
# Verification of Stealth Admin Isolation & Redesigned Pages
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " STARTING STEALTH ISOLATION & REDESIGN VERIFICATION       " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$allPassed = $true

# Helper function
function Test-HttpUrl {
    param(
        [string]$Name,
        [string]$Url,
        [int]$ExpectedStatus,
        [string]$ExpectedLocation = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session = $null
    )

    Write-Host "`n[$Name] $Url ..." -ForegroundColor Yellow
    $actualStatus = 0
    $actualLocation = $null
    $content = ""

    try {
        $p = @{
            Uri = $Url
            Method = "GET"
            UseBasicParsing = $true
            MaximumRedirection = 0
        }
        if ($Session) { $p["WebSession"] = $Session }

        $resp = Invoke-WebRequest @p
        $actualStatus = [int]$resp.StatusCode
        $content = $resp.Content
        if ($resp.Headers["Location"]) { $actualLocation = $resp.Headers["Location"] }
    }
    catch {
        $ex = $_.Exception
        if ($ex -is [System.Net.WebException] -and $ex.Response) {
            $r = [System.Net.HttpWebResponse]$ex.Response
            $actualStatus = [int]$r.StatusCode
            $actualLocation = $r.Headers["Location"]
            try {
                $st = $r.GetResponseStream()
                $rd = New-Object System.IO.StreamReader($st)
                $content = $rd.ReadToEnd()
            } catch {}
        } else {
            Write-Host "  FAILED: Network error: $($ex.Message)" -ForegroundColor Red
            return @{ Success = $false; Content = ""; Status = 0 }
        }
    }

    $statusOk = ($actualStatus -eq $ExpectedStatus)
    $locOk = ($null -eq $ExpectedLocation -or ($actualLocation -like "*$ExpectedLocation*"))

    if ($statusOk -and $locOk) {
        Write-Host "  PASSED: Status $actualStatus OK $(if ($actualLocation) { "-> Location: $actualLocation" })" -ForegroundColor Green
        return @{ Success = $true; Content = $content; Status = $actualStatus }
    } else {
        Write-Host "  FAILED: Expected $ExpectedStatus, got $actualStatus $(if ($actualLocation) { "-> Location: $actualLocation" })" -ForegroundColor Red
        return @{ Success = $false; Content = $content; Status = $actualStatus }
    }
}

# --- TEST 1: Home Page (/) ---
$t1 = Test-HttpUrl -Name "TEST 1: GET / (Home Page)" -Url "http://localhost:3000/" -ExpectedStatus 200
if ($t1.Success) {
    if ($t1.Content -match '/admin') {
        Write-Host "  FAILED: Found '/admin' link in public Home Page HTML!" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  PASSED: Zero occurrences of '/admin' found in Home Page HTML." -ForegroundColor Green
    }
} else {
    $allPassed = $false
}

# --- TEST 2: Pricing Page (/pricing) ---
$t2 = Test-HttpUrl -Name "TEST 2: GET /pricing (Pricing Page)" -Url "http://localhost:3000/pricing" -ExpectedStatus 200
if ($t2.Success) {
    if ($t2.Content -match '/admin') {
        Write-Host "  FAILED: Found '/admin' link in public Pricing Page HTML!" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  PASSED: Zero occurrences of '/admin' found in Pricing Page HTML." -ForegroundColor Green
    }
} else {
    $allPassed = $false
}

# --- TEST 3: Login Page (/login) ---
$t3 = Test-HttpUrl -Name "TEST 3: GET /login (Consumer Login)" -Url "http://localhost:3000/login" -ExpectedStatus 200
if (-not $t3.Success) { $allPassed = $false }

# --- TEST 4: App Route (/app Unauthenticated Redirect) ---
$t4 = Test-HttpUrl -Name "TEST 4: GET /app (Unauthenticated)" -Url "http://localhost:3000/app" -ExpectedStatus 307 -ExpectedLocation "/login"
if (-not $t4.Success) { $allPassed = $false }

# --- TEST 5: Direct Admin Login Route (/admin/login) ---
$t5 = Test-HttpUrl -Name "TEST 5: GET /admin/login (Direct Back-Office Portal)" -Url "http://localhost:3000/admin/login" -ExpectedStatus 200
if (-not $t5.Success) { $allPassed = $false }

# --- TEST 6: Direct Admin Protected Route (/admin Unauthenticated Redirect) ---
$t6 = Test-HttpUrl -Name "TEST 6: GET /admin (Unauthenticated Redirect to /admin/login)" -Url "http://localhost:3000/admin" -ExpectedStatus 307 -ExpectedLocation "/admin/login"
if (-not $t6.Success) { $allPassed = $false }

# --- TEST 7: Authenticated Admin Session on /admin ---
Write-Host "`n[TEST 7: Admin Session Flow] ..." -ForegroundColor Yellow
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$otpSend = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp" -Method POST -Body '{"phone":"09120000000"}' -ContentType "application/json" -UseBasicParsing
$otpVerify = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" -Method POST -Body '{"phone":"09120000000","code":"12345"}' -ContentType "application/json" -WebSession $adminSession -UseBasicParsing

if ($otpVerify.Headers["Set-Cookie"] -match 'session_token=([^;]+)') {
    $adminSession.Cookies.Add((New-Object System.Net.Cookie("session_token", $matches[1], "/", "localhost")))
}

$adminPage = Test-HttpUrl -Name "GET /admin (With Authenticated Admin Session)" -Url "http://localhost:3000/admin" -ExpectedStatus 200 -Session $adminSession
if (-not $adminPage.Success) { $allPassed = $false }

$adminStats = Test-HttpUrl -Name "GET /api/admin/stats (With Authenticated Admin Session)" -Url "http://localhost:3000/api/admin/stats" -ExpectedStatus 200 -Session $adminSession
if (-not $adminStats.Success) { $allPassed = $false }

# --- TEST 8: Authenticated User Session on /app (Verify AppShell has ZERO /admin links) ---
Write-Host "`n[TEST 8: Authenticated Consumer /app & AppShell Isolation] ..." -ForegroundColor Yellow
$userSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
$uOtpSend = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/send-otp" -Method POST -Body '{"phone":"09121111111"}' -ContentType "application/json" -UseBasicParsing
$uOtpVerify = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" -Method POST -Body '{"phone":"09121111111","code":"12345"}' -ContentType "application/json" -WebSession $userSession -UseBasicParsing

if ($uOtpVerify.Headers["Set-Cookie"] -match 'session_token=([^;]+)') {
    $userSession.Cookies.Add((New-Object System.Net.Cookie("session_token", $matches[1], "/", "localhost")))
}

$userApp = Test-HttpUrl -Name "GET /app (With Authenticated Consumer Session)" -Url "http://localhost:3000/app" -ExpectedStatus 200 -Session $userSession
if ($userApp.Success) {
    if ($userApp.Content -match 'href="/admin"') {
        Write-Host "  FAILED: Found 'href=/admin' in consumer /app HTML!" -ForegroundColor Red
        $allPassed = $false
    } else {
        Write-Host "  PASSED: Zero 'href=/admin' found in consumer /app HTML." -ForegroundColor Green
    }
} else {
    $allPassed = $false
}

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL TESTS PASSED! ZERO ADMIN LEAKS & 200/307 STATUS OK!  " -ForegroundColor Green
} else {
    Write-Host " SOME TESTS FAILED! CHECK OUTPUT ABOVE.                   " -ForegroundColor Red
    exit 1
}
Write-Host "==========================================================" -ForegroundColor Cyan
