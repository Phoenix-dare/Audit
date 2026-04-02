export default function BillsListView({
  bills,
  filteredBills,
  billsLoading,
  searchTerm,
  setSearchTerm,
  onRefresh,
  onClear,
  onOpenBill,
  getContractorName,
  getSyncStatusClass,
  getSyncStatusLabel
}) {
  return (
    <div className="bills-list">
      <div className="list-toolbar">
        <h3>Saved Bills ({bills.length})</h3>
        <div className="list-toolbar-actions">
          <input
            className="list-search"
            placeholder="Search bills..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                onRefresh();
              }
            }}
          />
          <button className="btn" onClick={onRefresh}>
            Refresh
          </button>
          <button className="btn" onClick={onClear}>
            Clear
          </button>
        </div>
      </div>

      {billsLoading && <p>Loading bills...</p>}
      {!billsLoading && bills.length === 0 && <p>No bills saved yet</p>}
      {!billsLoading && filteredBills.length > 0 && (
        <div className="bills-table-wrap">
          <table className="bills-table">
            <thead>
              <tr>
                <th>Bill Reg No</th>
                <th>Contractor</th>
                <th>Base Amount</th>
                <th>Net Payable</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.map((bill) => (
                <tr key={bill.localKey || bill._id} onClick={() => onOpenBill(bill)}>
                  <td>{bill.agno}</td>
                  <td>{getContractorName(bill.contractorId)}</td>
                  <td>₹{(bill.baseAmount || bill.ba || 0).toLocaleString()}</td>
                  <td>₹{((bill.calculations && bill.calculations.wit) || 0).toLocaleString()}</td>
                  <td>
                    <span className={getSyncStatusClass(bill)}>{getSyncStatusLabel(bill)}</span>
                  </td>
                  <td>
                    {bill.billDate
                      ? new Date(bill.billDate).toLocaleDateString("en-IN")
                      : bill.createdAt
                        ? new Date(bill.createdAt).toLocaleDateString("en-IN")
                        : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
