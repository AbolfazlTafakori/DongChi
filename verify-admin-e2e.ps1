# ==============================================================================
# verify-admin-e2e.ps1: End-to-End Verification of Admin Login and Admin Portal
# ==============================================================================
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " STARTING DONGCHI ADMIN END-TO-END VERIFICATION SUITE    " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$allPassed = $true

# Shared WebSession for maintaining authenticated admin cookie
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

function Invoke-HttpTest {
    param(
        [string]$Name,
        [string]$Method = "GET",
        [string]$Uri,
        [int]$ExpectedStatus,
        [string]$Body = $null,
        [Microsoft.PowerShell.Commands.WebRequestSession]$Session = $null,
        [string]$ExpectedLocationSubstring = $null,
        [hashtable]$Headers = @{}
    )

    Write-Host "`n[$Name] $Method $Uri ..." -ForegroundColor Yellow
    $actualStatus = 0
    $actualLocation = $null
    $content = ""
    $respHeaders = $null

    try {
        $params = @{
            Uri = $Uri
            Method = $Method
            UseBasicParsing = $true
            MaximumRedirection = 0
        }
        if ($Body) {
            $params["Body"] = $Body
            $params["ContentType"] = "application/json"
        }
        if ($Session) {
            $params["WebSession"] = $Session
        }
        if ($Headers.Count -gt 0) {
            $params["Headers"] = $Headers
        }

        $resp = Invoke-WebRequest @params
        $actualStatus = [int]$resp.StatusCode
        $content = $resp.Content
        $respHeaders = $resp.Headers
        if ($resp.Headers -and $resp.Headers["Location"]) {
            $actualLocation = $resp.Headers["Location"]
        }
    }
    catch {
        $ex = $_.Exception
        if ($ex -is [System.Net.WebException] -and $ex.Response) {
            $httpResp = [System.Net.HttpWebResponse]$ex.Response
            $actualStatus = [int]$httpResp.StatusCode
            $actualLocation = $httpResp.Headers["Location"]
            $respHeaders = $httpResp.Headers
            try {
                $stream = $httpResp.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $content = $reader.ReadToEnd()
            } catch {}
        } else {
            Write-Host "  FAILED: Network Exception: $($ex.Message)" -ForegroundColor Red
            return @{ Success = $false; Content = ""; Status = 0; Headers = $null }
        }
    }

    $statusMatch = ($actualStatus -eq $ExpectedStatus)
    $locMatch = $true
    if ($ExpectedLocationSubstring) {
        $locMatch = ($actualLocation -and ($actualLocation -like "*$ExpectedLocationSubstring*"))
    }

    if ($statusMatch -and $locMatch) {
        Write-Host "  PASSED: Status $actualStatus OK $(if ($actualLocation) { "-> Location: $actualLocation" })" -ForegroundColor Green
        return @{ Success = $true; Content = $content; Status = $actualStatus; Headers = $respHeaders }
    } else {
        Write-Host "  FAILED: Expected $ExpectedStatus, Got $actualStatus $(if ($actualLocation) { "-> Location: $actualLocation" })" -ForegroundColor Red
        return @{ Success = $false; Content = $content; Status = $actualStatus; Headers = $respHeaders }
    }
}

# --- TEST 1: GET /admin/login ---
$t1 = Invoke-HttpTest -Name "TEST 1: GET /admin/login" -Uri "http://localhost:3000/admin/login" -ExpectedStatus 200
if ($t1.Success -and $t1.Content.Length -gt 5000) {
    Write-Host "  HTML Content verified (>5000 chars, got $($t1.Content.Length) chars)" -ForegroundColor Green
} else {
    Write-Host "  FAILED: HTML size check failed (got $($t1.Content.Length))" -ForegroundColor Red
    $allPassed = $false
}

# --- TEST 2: GET /admin (Unauthenticated) -> 307 Redirect to /admin/login ---
$t2 = Invoke-HttpTest -Name "TEST 2: GET /admin (Unauthenticated Redirect)" -Uri "http://localhost:3000/admin" -ExpectedStatus 307 -ExpectedLocationSubstring "/admin/login"
if (-not $t2.Success) { $allPassed = $false }

# --- TEST 3: POST /api/auth/send-otp ---
$t3Body = '{"phone":"09120000000"}'
$t3 = Invoke-HttpTest -Name "TEST 3: POST /api/auth/send-otp" -Method "POST" -Uri "http://localhost:3000/api/auth/send-otp" -Body $t3Body -ExpectedStatus 200
if (-not $t3.Success) { $allPassed = $false }

# --- TEST 4: POST /api/auth/verify-otp with adminSession ---
$t4Body = '{"phone":"09120000000","code":"12345"}'
$t4 = Invoke-HttpTest -Name "TEST 4: POST /api/auth/verify-otp" -Method "POST" -Uri "http://localhost:3000/api/auth/verify-otp" -Body $t4Body -ExpectedStatus 200 -Session $adminSession
$userRole = ""
try {
    $json = $t4.Content | ConvertFrom-Json
    $userRole = $json.user.role
} catch {}
if ($t4.Success -and $userRole -eq "ADMIN") {
    Write-Host "  Role verified as ADMIN in response payload!" -ForegroundColor Green
} else {
    Write-Host "  FAILED: Role is not ADMIN (Got: '$userRole')" -ForegroundColor Red
    $allPassed = $false
}

# Ensure session_token cookie is attached to $adminSession
$cookieVal = $null
if ($t4.Headers -and $t4.Headers["Set-Cookie"]) {
    $setCookie = $t4.Headers["Set-Cookie"]
    if ($setCookie -match 'session_token=([^;]+)') {
        $cookieVal = $matches[1]
        Write-Host "  Extracted session_token from Set-Cookie header." -ForegroundColor Green
        $cookie = New-Object System.Net.Cookie("session_token", $cookieVal, "/", "localhost")
        $adminSession.Cookies.Add($cookie)
    }
}

# --- TEST 5: GET /admin (Authenticated with adminSession) -> 200 OK ---
$t5 = Invoke-HttpTest -Name "TEST 5: GET /admin (Authenticated Admin)" -Uri "http://localhost:3000/admin" -ExpectedStatus 200 -Session $adminSession
if (-not $t5.Success) { $allPassed = $false }

# --- TEST 6: GET /api/admin/stats (Authenticated with adminSession) -> 200 OK & JSON ---
$t6 = Invoke-HttpTest -Name "TEST 6: GET /api/admin/stats (Authenticated)" -Uri "http://localhost:3000/api/admin/stats" -ExpectedStatus 200 -Session $adminSession
$statsValid = $false
try {
    $statsJson = $t6.Content | ConvertFrom-Json
    if ($null -ne $statsJson.totalUsers -and $null -ne $statsJson.totalExpensesVolume) {
        $statsValid = $true
        Write-Host "  Valid JSON stats verified: totalUsers=$($statsJson.totalUsers), totalGroups=$($statsJson.totalGroups), revenue=$($statsJson.totalSuccessfulRevenue)" -ForegroundColor Green
    }
} catch {}
if (-not $statsValid) {
    Write-Host "  FAILED: Invalid stats payload returned" -ForegroundColor Red
    $allPassed = $false
}

# --- TEST 7: GET /admin/logs (Authenticated with adminSession) -> 200 OK ---
$t7 = Invoke-HttpTest -Name "TEST 7: GET /admin/logs (Authenticated Admin)" -Uri "http://localhost:3000/admin/logs" -ExpectedStatus 200 -Session $adminSession
if (-not $t7.Success) { $allPassed = $false }

Write-Host "`n==========================================================" -ForegroundColor Cyan
if ($allPassed) {
    Write-Host " ALL 7 TESTS PASSED WITH 200 OK / 307 STATUS CODES!        " -ForegroundColor Green
} else {
    Write-Host " SOME TESTS FAILED! CHECK OUTPUT ABOVE.                   " -ForegroundColor Red
    exit 1
}
Write-Host "==========================================================" -ForegroundColor Cyan
