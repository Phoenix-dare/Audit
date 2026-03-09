$dbPath = 'F:\Audit\db\09.10.2024 (1).accdb'

try {
    $access = New-Object -ComObject Access.Application
    $access.Visible = $false
    $db = $access.DBEngine.OpenDatabase($dbPath)
    
    Write-Host "===== COMPLETE DATABASE OBJECTS =====" -ForegroundColor Cyan
    
    # Get Forms
    Write-Host "`n[FORMS]" -ForegroundColor Yellow
    $formCount = 0
    foreach($form in $db.Containers["Forms"].Documents) {
        Write-Host "  ✓ $($form.Name)"
        $formCount++
    }
    Write-Host "Total Forms: $formCount"
    
    # Get Reports
    Write-Host "`n[REPORTS]" -ForegroundColor Yellow
    $reportCount = 0
    foreach($report in $db.Containers["Reports"].Documents) {
        Write-Host "  ✓ $($report.Name)"
        $reportCount++
    }
    Write-Host "Total Reports: $reportCount"
    
    # Get Modules (VBA code)
    Write-Host "`n[MODULES (VBA Code)]" -ForegroundColor Yellow
    $moduleCount = 0
    foreach($module in $db.Containers["Modules"].Documents) {
        Write-Host "  ✓ $($module.Name)"
        $moduleCount++
    }
    Write-Host "Total Modules: $moduleCount"
    
    $db.Close()
    $access.Quit()
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
