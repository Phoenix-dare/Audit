$dbPath = 'F:\Audit\db\09.10.2024 (1).accdb'

try {
    # Use Access COM object to get more detailed information
    $access = New-Object -ComObject Access.Application
    $access.Visible = $false
    
    # Open database
    $db = $access.DBEngine.OpenDatabase($dbPath)
    
    Write-Host "===== DATABASE STRUCTURE =====" -ForegroundColor Cyan
    
    # List all objects
    Write-Host "`n[TABLES]" -ForegroundColor Yellow
    foreach($doc in $db.TableDefs) {
        if (-not $doc.Name.StartsWith('msys', [System.StringComparison]::OrdinalIgnoreCase)) {
            $recordCount = $doc.RecordCount
            Write-Host "  $($doc.Name) (Records: $recordCount)"
        }
    }
    
    Write-Host "`n[QUERIES]" -ForegroundColor Yellow
    foreach($doc in $db.QueryDefs) {
        Write-Host "  $($doc.Name)"
        Write-Host "    SQL: $($doc.SQL.Substring(0, [Math]::Min(100, $doc.SQL.Length)))..."
    }
    
    $db.Close()
    $access.Quit()
    
    Write-Host "`n===== EXAMINING MAIN TABLE (work) =====" -ForegroundColor Cyan
    
    # Reconnect with OLEDB for detailed column inspection
    $conn = New-Object System.Data.OleDb.OleDbConnection
    $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath"
    $conn.Open()
    
    # Get work table details
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = "SELECT TOP 0 * FROM [work]"
    $reader = $cmd.ExecuteReader()
    $schema = $reader.GetSchemaTable()
    
    Write-Host "`nColumns with descriptions:" -ForegroundColor Green
    foreach($col in $schema.Rows) {
        $colName = $col['ColumnName']
        $colType = $col['DataType'].Name
        Write-Host "  $colName : $colType"
    }
    
    $conn.Close()
    
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    Write-Host $_.ErrorDetails -ForegroundColor Red
}
