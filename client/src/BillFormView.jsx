function SimpleModal({ title, open, onClose, children }) {
  if (!open) return null;

  return (
    <div className="preview-modal" onClick={onClose}>
      <div className="preview-dialog modal-dialog" onClick={(event) => event.stopPropagation()}>
        <div className="preview-header">
          <div>{title}</div>
          <button type="button" className="btn" onClick={onClose}>
            Close
          </button>
        </div>
        <div className="modal-content">{children}</div>
      </div>
    </div>
  );
}

export default function BillFormView({
  billForm,
  isEditing,
  onChange,
  onReset,
  contractors,
  budgets,
  contractorModalOpen,
  budgetModalOpen,
  setContractorModalOpen,
  setBudgetModalOpen,
  newContractorName,
  setNewContractorName,
  newContractorType,
  setNewContractorType,
  newBudgetCode,
  setNewBudgetCode,
  newBudgetHead,
  setNewBudgetHead,
  newBudgetAllocation,
  setNewBudgetAllocation,
  onPreview,
  openPreview,
  onSave,
  saving,
  online,
  result,
  formatAmount,
  baseValueForDisplay,
  gst18OnBaseForDisplay,
  billAmountForDisplay,
  previewOpen,
  previewDocument,
  printPreview,
  closePreview,
  submitNewContractor,
  submitNewBudget
}) {
  return (
    <form className="bill-form">
      <div className="form-header">
        <h1>MAHATMA GANDHI UNIVERSITY</h1>
        <h2>Office of the Divisional Accountant</h2>
        <h3>{isEditing ? "Edit Bill Entry" : "Bill Data Entry Form"}</h3>
        {isEditing && (
          <div className="editing-chip">
            Editing Bill: {billForm.billRegisterNo || "Untitled"}
          </div>
        )}
        <div className="bill-date">
          <label>Bill Date:</label>
          <input type="date" name="billDate" value={billForm.billDate} onChange={onChange} />
        </div>
      </div>

      <div className="form-section">
        <h4 className="section-title">Form1 - Identification</h4>
        <div className="form-row">
          <div className="form-group">
            <label>Person/Company</label>
            <select name="personCompany" value={billForm.personCompany} onChange={onChange}>
              <option>Person</option>
              <option>Company</option>
            </select>
          </div>
          <div className="form-group">
            <label>Contractor</label>
            <div className="field-combo">
              <select name="contractorId" value={billForm.contractorId} onChange={onChange}>
                <option value="">Select Contractor</option>
                {contractors.map((contractor) => (
                  <option key={contractor._id} value={contractor._id}>
                    {contractor.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="btn inline-add-btn"
                onClick={() => {
                  setNewContractorType(billForm.personCompany || "Person");
                  setContractorModalOpen(true);
                }}
              >
                Add
              </button>
            </div>
          </div>
          <div className="form-group">
            <label>Section</label>
            <input type="text" name="section" value={billForm.section} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Head of Account</label>
            <div className="field-combo">
              <select name="budgetId" value={billForm.budgetId} onChange={onChange}>
                <option value="">Select Budget</option>
                {budgets.map((budget) => (
                  <option key={budget._id} value={budget._id}>
                    {budget.code} - {budget.headOfAccount} (Bal: ₹{budget.balance?.toLocaleString()})
                  </option>
                ))}
              </select>
              <button type="button" className="btn inline-add-btn" onClick={() => setBudgetModalOpen(true)}>
                Add
              </button>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Bill Register No</label>
            <input type="text" name="billRegisterNo" value={billForm.billRegisterNo} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Work Order Number</label>
            <input type="text" name="workOrderNo" value={billForm.workOrderNo} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>WO Date</label>
            <input type="date" name="wod" value={billForm.wod} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Agreement Number</label>
            <input type="text" name="agreementNo" value={billForm.agreementNo} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>AG Date</label>
            <input type="date" name="agdate" value={billForm.agdate} onChange={onChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group full-width">
            <label>Name of Work</label>
            <textarea name="nameOfWork" value={billForm.nameOfWork} onChange={onChange} rows="2" />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="section-title">Form1 - Reference & Completion</h4>
        <div className="form-row">
          <div className="form-group">
            <label>ES/AS Number</label>
            <input type="text" name="esasNo" value={billForm.esasNo} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>TS/QS Number</label>
            <input type="text" name="tsqsNo" value={billForm.tsqsNo} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Date of Completion (as per agreement)</label>
            <input type="date" name="dateOfCompletion" value={billForm.dateOfCompletion} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Actual Date of Completion</label>
            <input
              type="date"
              name="actualDateOfCompletion"
              value={billForm.actualDateOfCompletion}
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label>DOC</label>
            <input type="date" name="doc" value={billForm.doc} onChange={onChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>CC</label>
            <select name="cc" value={billForm.cc} onChange={onChange}>
              <option>I</option>
              <option>II</option>
              <option>III</option>
              <option>IV</option>
            </select>
          </div>
          <div className="form-group">
            <label>CCN</label>
            <select name="ccn" value={billForm.ccn} onChange={onChange}>
              <option>I</option>
              <option>II</option>
              <option>III</option>
              <option>IV</option>
            </select>
          </div>
          <div className="form-group">
            <label>Part/Final</label>
            <select name="partFinal" value={billForm.partFinal} onChange={onChange}>
              <option>Part</option>
              <option>Final</option>
            </select>
          </div>
          <div className="form-group">
            <label>Fine</label>
            <select name="fine" value={billForm.fine} onChange={onChange}>
              <option>No</option>
              <option>Yes</option>
            </select>
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="section-title">Form1 - Amounts</h4>
        <div className="form-row">
          <div className="form-group">
            <label>PAC</label>
            <input type="number" name="pac" value={billForm.pac} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Bill Amount</label>
            <input type="number" name="billAmount" value={billForm.billAmount} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Base Value</label>
            <input type="number" name="baseValue" value={billForm.baseValue} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Estimate Amount</label>
            <input type="number" name="estimateAmount" value={billForm.estimateAmount} onChange={onChange} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Upto date Bill Amount</label>
            <input
              type="number"
              name="uptodateBillAmount"
              value={billForm.uptodateBillAmount}
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label>GST to be Deducted</label>
            <input type="number" name="gstToDeduct" value={billForm.gstToDeduct} readOnly />
          </div>
          <div className="form-group">
            <label>Electricity Charges</label>
            <input type="number" name="electricityCharges" value={billForm.electricityCharges} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="form-section">
        <h4 className="section-title">Form1 - Measurement & Book</h4>
        <div className="form-row">
          <div className="form-group">
            <label>MBook Numbers</label>
            <input type="text" name="mbookNumbers" value={billForm.mbookNumbers} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Pages</label>
            <input type="text" name="pages" value={billForm.pages} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Measurement by AE</label>
            <input type="date" name="measurementByAE" value={billForm.measurementByAE} onChange={onChange} />
          </div>
          <div className="form-group">
            <label>Measurement by AEE</label>
            <input type="date" name="measurementByAEE" value={billForm.measurementByAEE} onChange={onChange} />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn btn-calculate" onClick={onPreview}>
          Calculate
        </button>
        <button type="button" className="btn btn-audit-enfacement" onClick={() => openPreview("aes-register")}>
          Audit Enfacement Sheet Register
        </button>
        <button type="button" className="btn btn-audit" onClick={() => openPreview("audit-notes")}>
          Audit Notes
        </button>
        <button type="button" className="btn btn-note" onClick={() => openPreview("audit-enfacement-format")}>
          Note to F.O. / Enfacement Format
        </button>
        <button type="button" className="btn btn-dsd" onClick={() => openPreview("schedule-formats")}>
          DSD Schedule
        </button>
        <button type="button" className="btn btn-payment" onClick={() => openPreview("payment-register")}>
          Payment Register
        </button>
        <button type="button" className="btn btn-secondary" onClick={onReset}>
          {isEditing ? "Cancel Edit" : "Reset Form"}
        </button>
        <button type="button" className="btn btn-save" onClick={onSave} disabled={saving}>
          {saving
            ? isEditing
              ? "Updating..."
              : "Saving..."
            : isEditing
              ? online
                ? "Update Bill"
                : "Update Locally"
              : online
                ? "Save Bill"
                : "Save Locally"}
        </button>
      </div>

      {result && (
        <div className="calculation-result">
          <h4>Calculation Result</h4>
          <div className="result-grid">
            <div className="result-item addition">
              <span className="label">Base Value:</span>
              <span className="value">{formatAmount(baseValueForDisplay)}</span>
            </div>
            <div className="result-item addition">
              <span className="label">GST @ 18% (Added):</span>
              <span className="value">{formatAmount(gst18OnBaseForDisplay)}</span>
            </div>
            <div className="result-item addition">
              <span className="label">Bill Amount (Base + GST):</span>
              <span className="value">{formatAmount(billAmountForDisplay)}</span>
            </div>
            <div className="result-item deduction">
              <span className="label">GST:</span>
              <span className="value">{formatAmount(result.gst)}</span>
            </div>
            <div className="result-item deduction">
              <span className="label">Income Tax:</span>
              <span className="value">{formatAmount(result.it)}</span>
            </div>
            <div className="result-item deduction">
              <span className="label">WWC:</span>
              <span className="value">{formatAmount(result.wwc)}</span>
            </div>
            <div className="result-item">
              <span className="label">Retention:</span>
              <span className="value">{formatAmount(result.retention)}</span>
            </div>
            <div className="result-item">
              <span className="label">Fine:</span>
              <span className="value">{formatAmount(result.fine)}</span>
            </div>
            <div className="result-item">
              <span className="label">Agreement Fine:</span>
              <span className="value">{formatAmount(result.fineagr)}</span>
            </div>
            <div className="result-item highlight deduction">
              <span className="label">Total Deductions:</span>
              <span className="value">{formatAmount(result.dwoit)}</span>
            </div>
            <div className="result-item highlight">
              <span className="label">Net Payable (WIT):</span>
              <span className="value">{formatAmount(result.wit)}</span>
            </div>
          </div>
        </div>
      )}

      {previewOpen && (
        <div id="preview-print-container" className="preview-modal" onClick={closePreview}>
          <div className="preview-dialog" onClick={(event) => event.stopPropagation()}>
            <div className="preview-header">
              <div className="preview-title">Preview</div>
              <div className="preview-actions">
                <button type="button" className="btn" onClick={printPreview}>
                  Print / Save PDF
                </button>
                <button type="button" className="btn" onClick={closePreview}>
                  Close
                </button>
              </div>
            </div>
            <iframe id="preview-iframe" title="preview" srcDoc={previewDocument} />
          </div>
        </div>
      )}

      <SimpleModal title="Add Contractor" open={contractorModalOpen} onClose={() => setContractorModalOpen(false)}>
        <label className="modal-label">Name</label>
        <input
          value={newContractorName}
          onChange={(event) => setNewContractorName(event.target.value)}
          className="modal-input"
        />
        <label className="modal-label">Type</label>
        <select value={newContractorType} onChange={(event) => setNewContractorType(event.target.value)} className="modal-input">
          <option>Person</option>
          <option>Company</option>
        </select>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => setContractorModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-save" onClick={submitNewContractor}>
            Add Contractor
          </button>
        </div>
      </SimpleModal>

      <SimpleModal title="Add Budget Head" open={budgetModalOpen} onClose={() => setBudgetModalOpen(false)}>
        <label className="modal-label">Code</label>
        <input value={newBudgetCode} onChange={(event) => setNewBudgetCode(event.target.value)} className="modal-input" />
        <label className="modal-label">Head Of Account</label>
        <input value={newBudgetHead} onChange={(event) => setNewBudgetHead(event.target.value)} className="modal-input" />
        <label className="modal-label">Allocation (₹)</label>
        <input
          type="number"
          value={newBudgetAllocation}
          onChange={(event) => setNewBudgetAllocation(event.target.value)}
          className="modal-input"
        />
        <div className="modal-actions">
          <button type="button" className="btn" onClick={() => setBudgetModalOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-save" onClick={submitNewBudget}>
            Add Budget
          </button>
        </div>
      </SimpleModal>
    </form>
  );
}
