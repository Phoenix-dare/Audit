$dbPath = 'F:\Audit\db\09.10.2024 (1).accdb'

try {
    $conn = New-Object System.Data.OleDb.OleDbConnection
    $conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath"
    $conn.Open()
    
    Write-Host "Successfully connected to database!" -ForegroundColor Green
    
    # Get all tables
    $schemaTable = $conn.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Tables, $null)
    
    Write-Host "`nTables in database:" -ForegroundColor Cyan
    $userTables = @()
    foreach($row in $schemaTable.Rows) {
        $tableName = $row['TABLE_NAME']
        $tableType = $row['TABLE_TYPE']
        
        # Skip system tables
        if (-not $tableName.StartsWith('msys', [System.StringComparison]::OrdinalIgnoreCase)) {
            Write-Host "  ✓ $tableName ($tableType)"
            $userTables += $tableName
        }
    }
    
    # Get columns for each table
    Write-Host "`nTable Schemas:" -ForegroundColor Cyan
    foreach($tbl in $userTables) {
        Write-Host "`n[$tbl]" -ForegroundColor Yellow
        
        $cols = $conn.GetOleDbSchemaTable([System.Data.OleDb.OleDbSchemaGuid]::Columns, @($null, $null, $tbl, $null))
        foreach($col in $cols.Rows) {
            $colName = $col['COLUMN_NAME']
            $colType = $col['DATA_TYPE']
            Write-Host "    - $colName : $colType"
        }
    }
    
    $conn.Close()
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
