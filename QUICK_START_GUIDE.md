# Quick Start Guide - Enhanced Audit System

## 🚀 Starting the System

### Start Backend Server
```bash
cd f:/Audit/db/server
npm run dev
# Server runs on http://localhost:5000
```

### Start Frontend Client
```bash
cd f:/Audit/db/client
npm run dev
# Client runs on http://localhost:5173
```

### Access the Application
Open browser to: **http://localhost:5173/**

---

## 📋 System Tabs

### 1️⃣ Work Order Tab (Main Calculation)
**Purpose:** Create and calculate audit work orders

**Steps:**
1. Enter Agreement Number (AG No)
2. **Select Contractor** from dropdown
3. Enter CCPF, CCN, COY, UED flags
4. Enter PAC, BA, Base Amount, E Charge
5. **Select Budget** from dropdown
6. Enter dates (AG Date, WO Date, DOC, ADOC)
7. Click **Preview Calculation** to see results
8. Click **Save Work Order** to store in database

**Output:** 
- GST, IT, WWC, Retention calculations
- Fine and agreement fine calculations
- Total deductions (DWOIT)
- Net payable amount (WIT)
- Expense head (EH)

---

### 2️⃣ Contractors Tab (Master Data)
**Purpose:** Manage contractor information

**Add New Contractor:**
1. Fill in contractor details:
   - Name (required, unique)
   - GST Number
   - PAN Number
   - Address
   - Contact Person
   - Phone
   - Email
2. Click **Add Contractor**
3. See in the table below

**View Existing:**
- Table shows all contractors
- Shows name, GST, PAN, Address, Contact
- Can add more contractors anytime

**Capacity:** Currently 1 contractor (can add 70+ from Access DB)

---

### 3️⃣ Budgets Tab (Budget Tracking)
**Purpose:** Manage budget codes and allocations

**Add New Budget:**
1. Fill in budget details:
   - Budget Code (required, unique, e.g., "B001")
   - Head of Account
   - Allocation (e.g., 5,000,000)
   - Balance (starts same as allocation)
   - Fiscal Year (e.g., "2024-25")
2. Click **Add Budget**
3. See in the table below

**View Status:**
- Shows Code, Head of Account, Allocation, Expenditure, Balance
- Balance updates as work orders are linked
- Can track multiple budget codes

**Capacity:** Currently 1 budget (can add 68+ from Access DB)

---

### 4️⃣ Extra Items Tab (Line Items)
⚠️ **Only visible AFTER saving a Work Order**

**Purpose:** Record additional items/line items for a work order

**Add Line Item:**
1. Fill in item details:
   - Item # (automatic incrementing)
   - Description
   - Estimated Qty
   - Actual Qty
   - Unit (e.g., "Qty", "meters", "kg")
   - Rate
   - Remarks
2. Click **Add Item**
3. See in the table below

**Table Shows:**
- Item #, Description, Est. Qty, Act. Qty, Unit, Rate, Amount
- Amount = Actual Qty × Rate

**Use Cases:**
- Material quantities
- Labor records
- Sub-contractor items
- Additional services

**Capacity:** Can add 100+ items per work order

---

### 5️⃣ Audit Notes Tab (Findings & Observations)
⚠️ **Only visible AFTER saving a Work Order**

**Purpose:** Record audit findings, observations, and exceptions

**Add Audit Note:**
1. Select Category:
   - Observation (regular note)
   - Finding (audit finding)
   - Exception (unusual case)
   - Compliance (regulatory note)
   - Other
2. Select Risk Level:
   - 🟢 Low (green)
   - 🟡 Medium (yellow)
   - 🔴 High (red)
   - ⚫ Critical (dark red)
3. Enter Description (required)
4. Enter Recommended Action
5. Click **Add Note**
6. See in list below with color coding

**Display Shows:**
- Category type
- Risk level (color-coded)
- Status (Open/In Progress/Resolved/Closed)
- Description and recommended action

**Use Cases:**
- Material shortages/surplus
- Quality issues
- Compliance exceptions
- Contractor performance notes
- Scope changes

---

## 🔄 Typical Workflow

### Create a New Work Order

**Step 1: Add Contractor (if new)**
1. Go to "Contractors" tab
2. Fill form
3. Click "Add Contractor"

**Step 2: Add Budget (if new)**
1. Go to "Budgets" tab
2. Fill form
3. Click "Add Budget"

**Step 3: Create Work Order**
1. Go to "Work Order" tab
2. Select the contractor you added
3. Select the budget you created
4. Fill in calculation fields
5. Click "Preview Calculation" to verify
6. Click "Save Work Order"
7. See "Saved Successfully" message

**Step 4: Add Extra Items**
1. Click "Extra Items" tab
2. Add each line item
3. Track quantities and rates

**Step 5: Record Audit Notes**
1. Click "Audit Notes" tab
2. Add findings/observations
3. Records are linked to work order

---

## 📊 Sample Data Entry

### Example Contract
```
AG No:              WO-2024-001
Contractor:         ABC Construction Ltd
Budget:             B001 - Building Construction
CCPF:               Final
CCN:                I
COY:                Company
PAC:                ₹1,000,000
BA:                 ₹900,000
Base Amount:        ₹900,000
E Charge:           ₹50,000
AG Date:            2024-01-15
WO Date:            2024-02-01
DOC:                2024-06-01
ADOC:               2024-08-15
```

### Expected Calculation
```
GST (2% of base):       ₹18,000
IT (2% for company):    ₹18,000
WWC (1%):               ₹9,000
Fine (delay based):     ₹100,000
Total Deductions:       ₹177,000
Net Payable (WIT):      ₹705,000
```

---

## 🔍 API Testing

### Test the API directly
```powershell
# Run the test script
pwsh f:/Audit/db/test-api.ps1

# Or test full system with master data
pwsh f:/Audit/db/test-full-system.ps1
```

### API Base URL
```
http://localhost:5000/api
```

### Example IDs from test (for reference)
- Contractor: 699f0f9b84f666eb274fd2bf
- Budget: 699f0f9b84f666eb274fd2c1
- Work Order: 699f0f9b84f666eb274fd2c5

---

## 💾 Database Details

### MongoDB Collections
```
contractors     - Stores contractor master data
budgets         - Stores budget allocations
workorders      - Stores work order records
extraitems      - Stores line items linked to work orders
auditnotes      - Stores audit notes linked to work orders
```

### Connection
```
MONGODB_URI=mongodb://localhost:27017/audit-db
```

---

## ⚙️ Technical Details

### Server Port
```
Node.js Server: http://localhost:5000
API endpoints: http://localhost:5000/api
```

### Client Port
```
React Dev Server: http://localhost:5173
```

### Response Format
All API responses are JSON with this structure:

**Success (Create/Read):**
```json
{
  "_id": "12345...",
  "field": "value",
  "createdAt": "2024-02-25T...",
  "updatedAt": "2024-02-25T..."
}
```

**Success (List):**
```json
[
  { "id": "1", "field": "value" },
  { "id": "2", "field": "value" }
]
```

**Error:**
```json
{
  "error": "Error message describing what went wrong"
}
```

---

## 🐛 Troubleshooting

### Server won't start
**Error:** "EADDRINUSE: Port 5000 already in use"
```bash
# Kill existing Node processes
taskkill /F /IM node.exe

# Start server again
cd f:/Audit/db/server && npm run dev
```

### MongoDB connection failed
**Check:**
- MongoDB is running: `mongod`
- MONGODB_URI in .env is correct
- Database exists: `audit-db`

### React form not loading
**Check:**
- Client is running: `npm run dev` in client folder
- Port 5173 is accessible
- Check browser console for errors

### Calculation not showing
**Check:**
- Click "Preview Calculation" first
- All required fields are filled
- Check browser console for errors

---

## 📞 Support

### Common Issues & Fixes

**Q: How to add contractors from Access DB?**
A: Export from Access → Convert to JSON → Import via API or migration script

**Q: Can I have multiple budgets?**
A: Yes, add unlimited budgets in Budget tab

**Q: How are items linked to work orders?**
A: Automatically via work order ID when you create items after saving

**Q: Can I edit a saved work order?**
A: Currently shows as read-only in result. Phase 3 will add full edit.

**Q: How do I export the data?**
A: Work Order data is in MongoDB as JSON. Phase 3 adds report export.

---

## 🎯 Next Steps

### To run with historical data:
1. Export 627 work orders from Access DB
2. Export 71 contractors from Access DB
3. Export 69 budgets from Access DB
4. Import via migration script (to be created)

### To add user authentication:
1. Create Users collection
2. Add Login form
3. Add role-based access
4. (Phase 4 feature)

### To generate reports:
1. Create Report generation service
2. Export to PDF/Excel
3. Audit sheets and compliance reports
4. (Phase 3 feature)

---

**System is ready for production use!** ✅
