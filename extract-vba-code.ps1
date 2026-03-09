$dbPath = 'F:\Audit\db\09.10.2024 (1).accdb'

try {
    $access = New-Object -ComObject Access.Application
    $access.Visible = $false
    $db = $access.DBEngine.OpenDatabase($dbPath)
    
    Write-Host "===== VBA MODULES CONTENT =====" -ForegroundColor Cyan
    
    foreach($module in $db.Containers["Modules"].Documents) {
        Write-Host "`n[MODULE: $($module.Name)]" -ForegroundColor Yellow
        
        # Get the VBA project
        $project = $access.VBE.VBProjects($db.Name)
        
        foreach($vbModule in $project.VBComponents) {
            if ($vbModule.Name -eq $module.Name) {
                $codeModule = $vbModule.CodeModule
                $lines = $codeModule.CountOfLines
                
                # Get first 50 lines to show function signatures
                $code = ""
                for ($i = 1; $i -le [Math]::Min(50, $lines); $i++) {
                    $code += $codeModule.Lines($i, 1) + "`n"
                }
                
                # Extract function signatures
                $functions = @()
                $code -split "`n" | ForEach-Object {
                    if ($_ -match '^\s*(Public|Private|Function|Sub|Const)\s+') {
                        $functions += $_
                    }
                }
                
                foreach($fn in $functions) {
                    Write-Host "  $fn"
                }
                
                Write-Host "  (Total lines in module: $lines)"
            }
        }
    }
    
    $db.Close()
    $access.Quit()
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
