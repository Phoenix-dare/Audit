$payload = @{
    ccpf = 'Final'
    ccn = 'I'
    coy = 'Company'
    ued = 'Yes'
    pac = 1000000
    ba = 900000
    baseAmount = 900000
    eCharge = 50000
    agdate = '2024-01-15'
    wod = '2024-02-01'
    doc = '2024-06-01'
    adoc = '2024-08-15'
}

$body = $payload | ConvertTo-Json
Write-Host "Sending request to http://localhost:5000/api/calculate/preview"
Write-Host "Payload: $body"

try {
    $response = Invoke-WebRequest -Uri 'http://localhost:5000/api/calculate/preview' -Method POST -Headers @{'Content-Type'='application/json'} -Body $body -UseBasicParsing
    Write-Host "Response Status: $($response.StatusCode)"
    Write-Host "Response Data:"
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "Error: $_"
}
