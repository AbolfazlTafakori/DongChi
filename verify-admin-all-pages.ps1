# Additional test for all remaining admin subpages
$adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession

# Auth step
$t4 = Invoke-WebRequest -Uri "http://localhost:3000/api/auth/verify-otp" -Method POST -Body '{"phone":"09120000000","code":"12345"}' -ContentType "application/json" -WebSession $adminSession
if ($t4.Headers["Set-Cookie"] -match 'session_token=([^;]+)') {
    $adminSession.Cookies.Add((New-Object System.Net.Cookie("session_token", $matches[1], "/", "localhost")))
}

$pages = @("/admin/users", "/admin/groups", "/admin/categories", "/admin/billing")
foreach ($p in $pages) {
    $res = Invoke-WebRequest -Uri "http://localhost:3000$p" -WebSession $adminSession -UseBasicParsing -MaximumRedirection 0
    Write-Output "[$p] Status: $($res.StatusCode) OK - Content-Length: $($res.Content.Length)"
}
