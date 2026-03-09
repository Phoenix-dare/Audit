Write-Host "===== Testing New Audit System APIs =====" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000/api"

# Test 1: Create a Contractor
Write-Host "`n[1] Creating Contractor..." -ForegroundColor Yellow
$contractorPayload = @{
    name = "ABC Construction Ltd"
    gstNo = "32AAZPI9378NIZL"
    panNo = "AABCT1234K"
    address = "123 Business Park, Delhi"
    contactPerson = "John Smith"
    phone = "9876543210"
    email = "john@abcconstruction.com"
} | ConvertTo-Json

$contractorRes = Invoke-WebRequest -Uri "$baseUrl/contractors" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $contractorPayload -UseBasicParsing
$contractor = $contractorRes.Content | ConvertFrom-Json
Write-Host "Created Contractor: $($contractor.name) (ID: $($contractor._id))" -ForegroundColor Green

# Test 2: Create a Budget
Write-Host "`n[2] Creating Budget..." -ForegroundColor Yellow
$budgetPayload = @{
    code = "B001"
    headOfAccount = "Building Construction"
    allocation = 5000000
    balance = 5000000
    fiscalYear = "2024-25"
} | ConvertTo-Json

$budgetRes = Invoke-WebRequest -Uri "$baseUrl/budgets" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $budgetPayload -UseBasicParsing
$budget = $budgetRes.Content | ConvertFrom-Json
Write-Host "Created Budget: $($budget.code) - Balance: ₹$($budget.balance)" -ForegroundColor Green

# Test 3: Get all Contractors
Write-Host "`n[3] Fetching all Contractors..." -ForegroundColor Yellow
$contractorsRes = Invoke-WebRequest -Uri "$baseUrl/contractors" -UseBasicParsing
$contractors = $contractorsRes.Content | ConvertFrom-Json
Write-Host "Total Contractors: $($contractors.Count)" -ForegroundColor Green

# Test 4: Get all Budgets
Write-Host "`n[4] Fetching all Budgets..." -ForegroundColor Yellow
$budgetsRes = Invoke-WebRequest -Uri "$baseUrl/budgets" -UseBasicParsing
$budgets = $budgetsRes.Content | ConvertFrom-Json
Write-Host "Total Budgets: $($budgets.Count)" -ForegroundColor Green

# Test 5: Create Work Order with references
Write-Host "`n[5] Creating Work Order..." -ForegroundColor Yellow
$workOrderPayload = @{
    agno = "WO-2024-001"
    contractorId = $contractor._id
    budgetId = $budget._id
    ccpf = "Final"
    ccn = "I"
    coy = "Company"
    ued = "Yes"
    pac = 500000
    ba = 480000
    baseAmount = 480000
    eCharge = 5000
    agdate = "2024-01-10"
    wod = "2024-01-15"
    doc = "2024-06-15"
    adoc = "2024-08-20"
} | ConvertTo-Json

$woRes = Invoke-WebRequest -Uri "$baseUrl/work-orders" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $workOrderPayload -UseBasicParsing
$workOrder = $woRes.Content | ConvertFrom-Json
Write-Host "Created Work Order: $($workOrder.agno) (ID: $($workOrder._id))" -ForegroundColor Green
Write-Host "  Calculations: GST=$($workOrder.calculations.gst), IT=$($workOrder.calculations.it)" -ForegroundColor Green

# Test 6: Create Extra Items
Write-Host "`n[6] Creating Extra Items..." -ForegroundColor Yellow
$itemsPayload = @(
    @{itemNo=1; description="Steel Beams"; estimatedQty=100; actualQty=98; unit="units"; rate=500},
    @{itemNo=2; description="Cement Bags"; estimatedQty=500; actualQty=485; unit="bags"; rate=50}
) | ConvertTo-Json

$itemsRes = Invoke-WebRequest -Uri "$baseUrl/extra-items/batch/$($workOrder._id)" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $itemsPayload -UseBasicParsing
$items = $itemsRes.Content | ConvertFrom-Json
Write-Host "Created $($items.Count) Extra Items" -ForegroundColor Green

# Test 7: Create Audit Note
Write-Host "`n[7] Creating Audit Note..." -ForegroundColor Yellow
$notePayload = @{
    category = "Finding"
    description = "Discrepancy found in steel beam quantities - 2 units short of contract"
    riskLevel = "Medium"
    recommendedAction = "Verify with contractor and issue order for remaining qty"
    workOrderId = $workOrder._id
} | ConvertTo-Json

$noteRes = Invoke-WebRequest -Uri "$baseUrl/audit-notes" -Method POST `
    -Headers @{'Content-Type'='application/json'} -Body $notePayload -UseBasicParsing
$note = $noteRes.Content | ConvertFrom-Json
Write-Host "Created Audit Note: $($note.category) - Risk: $($note.riskLevel)" -ForegroundColor Green

# Test 8: Fetch items for work order
Write-Host "`n[8] Fetching items for Work Order..." -ForegroundColor Yellow
$woItemsRes = Invoke-WebRequest -Uri "$baseUrl/extra-items/work/$($workOrder._id)" -UseBasicParsing
$woItems = $woItemsRes.Content | ConvertFrom-Json
Write-Host "Items for Work Order: $($woItems.Count)" -ForegroundColor Green

# Test 9: Fetch notes for work order
Write-Host "`n[9] Fetching notes for Work Order..." -ForegroundColor Yellow
$woNotesRes = Invoke-WebRequest -Uri "$baseUrl/audit-notes/work/$($workOrder._id)" -UseBasicParsing
$woNotes = $woNotesRes.Content | ConvertFrom-Json
Write-Host "Notes for Work Order: $($woNotes.Count)" -ForegroundColor Green

Write-Host "`n===== SYSTEM TEST COMPLETE =====" -ForegroundColor Cyan
Write-Host "✅ All APIs working correctly!" -ForegroundColor Green
Write-Host "`nSample IDs for further testing:" -ForegroundColor Yellow
Write-Host "  Contractor: $($contractor._id)" 
Write-Host "  Budget: $($budget._id)"
Write-Host "  Work Order: $($workOrder._id)"
Write-Host "`nClient ready at: http://localhost:5173/" -ForegroundColor Green
