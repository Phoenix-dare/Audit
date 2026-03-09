$dbPath = 'F:\Audit\db\09.10.2024 (1).accdb'

$conn = New-Object System.Data.OleDb.OleDbConnection
$conn.ConnectionString = "Provider=Microsoft.ACE.OLEDB.12.0;Data Source=$dbPath"
$conn.Open()

Write-Host "===== DATABASE SUMMARY =====" -ForegroundColor Cyan

# Sample queries to understand data
$queries = @(
    @{Name="Budget Overview"; SQL="SELECT COUNT(*) as Count FROM Budget"},
    @{Name="Contractors"; SQL="SELECT COUNT(*) as Count FROM Contractor"},
    @{Name="Work Orders"; SQL="SELECT COUNT(*) as Count FROM [work]"},
    @{Name="Extra Items"; SQL="SELECT COUNT(*) as Count FROM [Extra Item]"},
    @{Name="Sample Work Record Fields"; SQL="SELECT TOP 1 agno, ccpf, pac, ba, gst, it, wwc, retention, fine, fineagr, dwoit, wit, eh FROM [work]"}
)

foreach($q in $queries) {
    Write-Host "`n[$($q.Name)]" -ForegroundColor Yellow
    
    $cmd = $conn.CreateCommand()
    $cmd.CommandText = $q.SQL
    $reader = $cmd.ExecuteReader()
    
    while ($reader.Read()) {
        for ($i = 0; $i -lt $reader.FieldCount; $i++) {
            $fieldName = $reader.GetName($i)
            $fieldValue = $reader.GetValue($i)
            Write-Host "  $fieldName : $fieldValue"
        }
    }
    $reader.Close()
}

$conn.Close()

Write-Host "`n===== UNDERSTANDING DATA STRUCTURE =====" -ForegroundColor Cyan
Write-Host @"

MAIN TABLES IN DATABASE:
1. Contractor (71 records)
   - Stores contractor master data with GST, PAN, Address

2. Budget (69 records)
   - Budget codes linked to Head of Accounts
   - Tracks Allocation and Balance

3. work (627 records)
   - Main transaction table for work orders/agreements
   - Stores all calculation fields (gst, it, wwc, retention, fine, fineagr, dwoit, wit, eh)
   - Links to contractors, budgets, and extra items

4. Extra Item (824 records)
   - Additional items for work orders beyond main items
   - Tracks estimated vs actual quantities

5. Head_of_Account (2 records)
   - Master list of account heads for budget classification

FORMS/INTERFACES (18 total):
- Form1 / Copy Of Form1 - Main data entry
- Extra Item / Extra Item1 - Additional items management
- Details, List, Dialog - Various view modes
- work subform / work subform1 - Linked forms
- Media - Media attachments?

REPORTS (14 total):
- Audit Enfacement sheet - Main audit report
- AUDIT NOTES - Detailed audit notes report
- Extra Item - Extra items report  
- Payment Register - Payment tracking
- Schedule for GST - GST schedule/breakup
- AES Register - Asset Entitlement/Expense Register

KEY FINDINGS:
✓ Core audit calculations implemented
✓ Budget tracking and balance maintenance
✓ Multi-party contractor management
✓ Line item tracking with Extra Items
✓ Multiple reporting formats including GST and Payment schedules
✓ Form-based data entry with subforms
✓ Advanced reporting (Audit Notes, Enfacement sheets)
"@

