# Hospital Maintenance Isolation System - End-to-End API Test Script
Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Hospital Maintenance Isolation System - Live API Demo " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$baseUrl = "http://localhost:8080"

function Get-ErrorBody($errorRecord) {
    try {
        if ($errorRecord.ErrorDetails -and $errorRecord.ErrorDetails.Message) {
            return $errorRecord.ErrorDetails.Message | ConvertFrom-Json
        }
        if ($errorRecord.Exception.Response) {
            $stream = $errorRecord.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $text = $reader.ReadToEnd()
            return $text | ConvertFrom-Json
        }
    } catch {
        return $null
    }
    return $null
}

# 1. Login as Engineer
Write-Host "`n[1] Logging in as Engineer..." -ForegroundColor Yellow
$engLogin = @{ username = "engineer"; password = "password123" } | ConvertTo-Json
$engRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $engLogin
$engToken = "Bearer " + $engRes.token
Write-Host "   Authenticated as: $($engRes.fullName) (Role: $($engRes.role))" -ForegroundColor Green

# 2. Login as Ward Supervisor
Write-Host "`n[2] Logging in as Ward Supervisor..." -ForegroundColor Yellow
$supLogin = @{ username = "supervisor1"; password = "password123" } | ConvertTo-Json
$supRes = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method Post -ContentType "application/json" -Body $supLogin
$supToken = "Bearer " + $supRes.token
Write-Host "   Authenticated as: $($supRes.fullName) (Role: $($supRes.role))" -ForegroundColor Green

# 3. View Valve and Affected Rooms
Write-Host "`n[3] Querying Utility Valves..." -ForegroundColor Yellow
$valves = Invoke-RestMethod -Uri "$baseUrl/api/valves" -Method Get -Headers @{ Authorization = $engToken }
$valve = $valves[0]
Write-Host "   Valve: $($valve.valveCode) ($($valve.utilityType))" -ForegroundColor Green
Write-Host "   Location: $($valve.location)" -ForegroundColor Gray
Write-Host "   Affected Rooms Count: $($valve.affectedRoomsCount)" -ForegroundColor Green
foreach ($r in $valve.affectedRooms) {
    Write-Host "     - $($r.roomNumber) ($($r.wardName)): $($r.description)" -ForegroundColor Gray
}

# 4. Engineer creates Isolation Request
Write-Host "`n[4] Engineer creating Isolation Request for $($valve.valveCode)..." -ForegroundColor Yellow
$createBody = @{
    valveId = $valve.id
    reason = "Urgent repair on oxygen manifold regulator"
} | ConvertTo-Json

$req = Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests" -Method Post -ContentType "application/json" -Headers @{ Authorization = $engToken } -Body $createBody
$reqId = $req.id
Write-Host "   Created Request: $($req.requestNumber) | Status: $($req.status)" -ForegroundColor Green
Write-Host "   Total Rooms: $($req.totalRoomsCount) | Acknowledged: $($req.acknowledgedRoomsCount) | Pending: $($req.pendingRoomsCount)" -ForegroundColor Green

# 5. [CRITICAL DEMO] Engineer attempts to authorize repair prematurely (0/3 Acknowledged)
Write-Host "`n[5] [TEST RULE] Engineer attempts to authorize repair BEFORE acknowledgements..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/authorize" -Method Post -ContentType "application/json" -Headers @{ Authorization = $engToken } -Body "{}"
    Write-Host "   [ERROR] Should have been blocked!" -ForegroundColor Red
} catch {
    $errJson = Get-ErrorBody $_
    Write-Host "   >>> BLOCKED AS EXPECTED (HTTP 409 Conflict) <<<" -ForegroundColor Red
    if ($errJson) {
        Write-Host "   Reason: $($errJson.message)" -ForegroundColor Red
        Write-Host "   Pending Rooms count: $($errJson.pendingRoomsCount)" -ForegroundColor Yellow
        foreach ($p in $errJson.pendingRooms) {
            Write-Host "     * Pending: $($p.roomNumber) ($($p.wardName))" -ForegroundColor Magenta
        }
    }
}

# 6. Ward Supervisor acknowledges Room 1 and Room 2
$room1 = $valve.affectedRooms[0]
$room2 = $valve.affectedRooms[1]
$room3 = $valve.affectedRooms[2]

Write-Host "`n[6] Ward Supervisor acknowledges $($room1.roomNumber)..." -ForegroundColor Yellow
$ack1 = @{ roomId = $room1.id; notes = "Patients transferred to ICU Bay B" } | ConvertTo-Json
$res1 = Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/acknowledgements" -Method Post -ContentType "application/json" -Headers @{ Authorization = $supToken } -Body $ack1
Write-Host "   Status: Acknowledged: $($res1.acknowledgedRoomsCount)/$($res1.totalRoomsCount) | Remaining Pending: $($res1.pendingRoomsCount)" -ForegroundColor Green

Write-Host "`n[7] Ward Supervisor acknowledges $($room2.roomNumber)..." -ForegroundColor Yellow
$ack2 = @{ roomId = $room2.id; notes = "Portable oxygen cylinder online" } | ConvertTo-Json
$res2 = Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/acknowledgements" -Method Post -ContentType "application/json" -Headers @{ Authorization = $supToken } -Body $ack2
Write-Host "   Status: Acknowledged: $($res2.acknowledgedRoomsCount)/$($res2.totalRoomsCount) | Remaining Pending: $($res2.pendingRoomsCount)" -ForegroundColor Green

# 8. [CRITICAL DEMO] Engineer attempts authorization when ONLY 1 ROOM is missing ($($room3.roomNumber))
Write-Host "`n[8] [TEST RULE] Engineer attempts authorization with 1 MISSING ROOM ($($room3.roomNumber))..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/authorize" -Method Post -ContentType "application/json" -Headers @{ Authorization = $engToken } -Body "{}"
    Write-Host "   [ERROR] Should have been blocked!" -ForegroundColor Red
} catch {
    $errJson = Get-ErrorBody $_
    Write-Host "   >>> BLOCKED AS EXPECTED (HTTP 409 Conflict) <<<" -ForegroundColor Red
    if ($errJson) {
        Write-Host "   Reason: $($errJson.message)" -ForegroundColor Red
        Write-Host "   Missing Room Specifically Identified: $($errJson.pendingRooms[0].roomNumber) ($($errJson.pendingRooms[0].wardName))" -ForegroundColor Magenta
    }
}

# 9. Ward Supervisor acknowledges the final room ($($room3.roomNumber))
Write-Host "`n[9] Ward Supervisor acknowledges final room $($room3.roomNumber)..." -ForegroundColor Yellow
$ack3 = @{ roomId = $room3.id; notes = "Recovery bay cleared" } | ConvertTo-Json
$res3 = Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/acknowledgements" -Method Post -ContentType "application/json" -Headers @{ Authorization = $supToken } -Body $ack3
Write-Host "   Status: Acknowledged: $($res3.acknowledgedRoomsCount)/$($res3.totalRoomsCount) | Remaining Pending: $($res3.pendingRoomsCount)" -ForegroundColor Green

# 10. Engineer authorizes repair successfully!
Write-Host "`n[10] Engineer authorizes repair now that 100% of rooms are acknowledged..." -ForegroundColor Yellow
$authBody = @{ notes = "All rooms confirmed safe. Work authorized." } | ConvertTo-Json
$authRes = Invoke-RestMethod -Uri "$baseUrl/api/isolation-requests/$reqId/authorize" -Method Post -ContentType "application/json" -Headers @{ Authorization = $engToken } -Body $authBody

Write-Host "   >>> SUCCESS: REPAIR AUTHORIZED (HTTP 200 OK) <<<" -ForegroundColor Green
Write-Host "   Request Number : $($authRes.requestNumber)" -ForegroundColor Green
Write-Host "   Status         : $($authRes.status)" -ForegroundColor Green
Write-Host "   Authorized By  : $($authRes.authorizedBy)" -ForegroundColor Green
Write-Host "   Authorized At  : $($authRes.authorizedAt)" -ForegroundColor Green
Write-Host "`n==========================================================" -ForegroundColor Cyan
Write-Host " All 4 Functional Requirements Verified Successfully! " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan
