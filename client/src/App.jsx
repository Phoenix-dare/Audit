// Homepage form is modelled after the main data entry form (Form1) in the Access
// database.  Any UI changes for the landing page should refer to Form1 for field
// names, order and labels so that the web app mirrors the original Access layout.

import { useState, useEffect } from "react";
import {
  createWorkOrder, previewCalculation, getContractors, getBudgets, getWorkOrders, updateBudget,
  updateWorkOrder, getWorkOrder, createContractor, createBudget
} from "./api";
import OfflineBanner from "./OfflineBanner";
import { PRINT_PREVIEW_DOCUMENT } from "./printPreviewDocument";
import "./styles.css";

export default function App() {
  const [view, setView] = useState("form"); // form or list
  const [contractors, setContractors] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);

  const [billForm, setBillForm] = useState({
    billDate: new Date().toISOString().split('T')[0],
    personCompany: "Person",
    contractorId: "",
    billRegisterNo: "",
    budgetId: "",
    nameOfWork: "",
    workOrderNo: "",
    agreementNo: "",
    esasNo: "",
    tsqsNo: "",
    dateOfCompletion: "",
    actualDateOfCompletion: "",
    billAmount: 0,
    baseValue: 0,
    electricityCharges: 0,
    gstToDeduct: 0,
    uptodateBillAmount: 0,
    estimateAmount: 0,
    pac: 0,
    partFinal: "Final",
    fine: "No",
    section: "",
    cc: "I",
    measurementByAE: "",
    measurementByAEE: "",
    mbookNumbers: "",
    pages: "",
    ccpf: "Final",
    ccn: "I",
    coy: "Person",
    ued: "Yes",
    eCharge: 0,
    agdate: "",
    wod: "",
    doc: "",
    adoc: "",
    items: []
  });

  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewPayload, setPreviewPayload] = useState(null);
  const [contractorModalOpen, setContractorModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [newContractorName, setNewContractorName] = useState('');
  const [newBudgetCode, setNewBudgetCode] = useState('');
  const [newBudgetHead, setNewBudgetHead] = useState('');
  const [newBudgetAllocation, setNewBudgetAllocation] = useState(0);
  // search term for bills list
  const [searchTerm, setSearchTerm] = useState('');
  // id of bill currently being edited (if any)
  const [editingId, setEditingId] = useState(null);

  const getPreviewWindow = () => document.getElementById("preview-iframe")?.contentWindow || null;

  const printPreview = () => {
    if (!previewPayload) return;

    const notifyPopupBlocked = () => {
      alert("Please allow pop-ups for this site to print the full-page preview.");
    };

    const printWindow = window.open("", "audit_print_preview");
    if (!printWindow) {
      notifyPopupBlocked();
      return;
    }

    let started = false;
    const startPrint = () => {
      if (started) return;
      started = true;

      const pushPayload = () => {
        // Post payload a few times so the preview listener receives it
        // reliably after document load.
        for (let attempt = 0; attempt < 6; attempt += 1) {
          setTimeout(() => {
            try {
              printWindow.postMessage(previewPayload, "*");
            } catch (error) {
              console.error("popup print postMessage error", error);
            }
          }, attempt * 120);
        }
      };

      const cleanup = () => {
        setTimeout(() => {
          try {
            if (!printWindow.closed) {
              printWindow.close();
            }
          } catch (error) {
            console.error("popup print cleanup error", error);
          }
        }, 250);
      };

      pushPayload();
      setTimeout(() => {
        try {
          printWindow.focus();
          printWindow.print();
        } catch (error) {
          console.error("popup print error", error);
        }
      }, 900);

      try {
        printWindow.addEventListener("afterprint", cleanup, { once: true });
      } catch (error) {
        console.error("popup afterprint attach error", error);
      }
      setTimeout(cleanup, 15000);
    };

    try {
      printWindow.addEventListener("load", startPrint, { once: true });
      printWindow.document.open();
      printWindow.document.write(PRINT_PREVIEW_DOCUMENT);
      printWindow.document.close();
      if (printWindow.document.readyState === "complete") {
        startPrint();
      }
    } catch (error) {
      console.error("popup print setup error", error);
      notifyPopupBlocked();
    }
  };

  useEffect(() => {
    loadMasterData();
  }, []);

  useEffect(() => {
    if (view === "list") {
      loadBills();
    }
  }, [view]);

  // When preview modal opens, post payload to iframe preview
  useEffect(() => {
    if (!previewOpen || !previewPayload) return;
    const tryPost = () => {
      const previewWindow = getPreviewWindow();
      if (previewWindow) {
        try {
          console.log('posting to iframe', previewPayload);
          previewWindow.postMessage(previewPayload, '*');
        } catch (err) {
          console.error('iframe post error', err);
        }
      } else {
        // retry shortly until iframe is available
        setTimeout(tryPost, 200);
      }
    };
    tryPost();
  }, [previewOpen, previewPayload]);

  useEffect(() => {
    if (!previewOpen) return undefined;

    const handlePrintShortcut = (event) => {
      const isPrintShortcut = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "p";
      if (!isPrintShortcut) return;

      event.preventDefault();
      printPreview();
    };

    window.addEventListener("keydown", handlePrintShortcut);
    return () => window.removeEventListener("keydown", handlePrintShortcut);
  }, [previewOpen, previewPayload]);

  useEffect(() => {
    document.body.classList.toggle("preview-print-active", previewOpen);
    return () => document.body.classList.remove("preview-print-active");
  }, [previewOpen]);

  const loadMasterData = async () => {
    try {
      const [c, b] = await Promise.all([
        getContractors(),
        getBudgets()
      ]);
      console.log("Contractors loaded:", c);
      console.log("Budgets loaded:", b);
      setContractors(Array.isArray(c) ? c : []);
      setBudgets(Array.isArray(b) ? b : []);
    } catch (error) {
      console.error("Error loading master data:", error);
      alert("Failed to load master data: " + error.message);
    }
  };

  const submitNewContractor = async () => {
    if (!newContractorName) return alert('Enter contractor name');
    try {
      const created = await createContractor({ name: newContractorName });
      setContractors(prev => [...prev, created]);
      setNewContractorName('');
      setContractorModalOpen(false);
      alert('Contractor added');
    } catch (err) {
      console.error('Create contractor failed', err);
      alert('Failed to create contractor: ' + (err.message || err));
    }
  };

  const submitNewBudget = async () => {
    if (!newBudgetCode || !newBudgetHead) return alert('Fill budget code and head');
    const allocation = Number(newBudgetAllocation || 0);
    try {
      const payload = { code: newBudgetCode, headOfAccount: newBudgetHead, allocation, balance: allocation };
      const created = await createBudget(payload);
      setBudgets(prev => [...prev, created]);
      setNewBudgetCode(''); setNewBudgetHead(''); setNewBudgetAllocation(0);
      setBudgetModalOpen(false);
      alert('Budget head added');
    } catch (err) {
      console.error('Create budget failed', err);
      alert('Failed to create budget: ' + (err.message || err));
    }
  };

  const loadBills = async () => {
    setBillsLoading(true);
    try {
      const data = await getWorkOrders(searchTerm && searchTerm.trim() ? searchTerm.trim() : undefined);
      console.log("Bills loaded:", data);
      setBills(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error loading bills:", error);
      alert("Failed to load bills: " + error.message);
    } finally {
      setBillsLoading(false);
    }
  };

  const filteredBills = (searchTerm || '').trim()
    ? bills.filter(b => {
        const q = (searchTerm || '').toLowerCase();
        return [
          b.agno,
          b.section,
          b.workOrderNo,
          b.nameOfWork,
          String(b.baseAmount || b.ba || ''),
          String(b.coy || ''),
        ].some(v => String(v || '').toLowerCase().includes(q));
      })
    : bills;

  const getContractorName = (contractorId) => {
    const contractor = contractors.find(c => c._id === contractorId);
    return contractor ? contractor.name : "Unknown";
  };

  const openBill = async (bill) => {
    if (!bill) return;
    let full = bill;
    try {
      if (bill._id) {
        full = await getWorkOrder(bill._id);
      }
    } catch (err) {
      console.warn('Failed to fetch full bill, using list item', err);
    }

    // populate form fields from bill object
    setBillForm(prev => ({
      ...prev,
      billRegisterNo: full.agno || full.billRegisterNo || '',
      billDate: full.billDate || prev.billDate,
      contractorId: full.contractorId || '',
      budgetId: full.budgetId || '',
      nameOfWork: full.nameOfWork || '',
      workOrderNo: full.workOrderNo || '',
      agreementNo: full.agreementNo || '',
      actualDateOfCompletion: full.adoc || full.actualDateOfCompletion || '',
      partFinal: full.ccpf || prev.partFinal,
      baseValue: full.baseAmount || full.ba || prev.baseValue,
      billAmount: full.billAmount || prev.billAmount,
      electricityCharges: full.eCharge || prev.electricityCharges,
      pac: full.pac || prev.pac,
      pages: full.pages || prev.pages,
      mbookNumbers: full.mbookNumbers || prev.mbookNumbers,
    }));
    setView('form');
    setEditingId(full._id || null);
    // try to load calculation result if present
    if (full.calculations) setResult(full.calculations);
  };

  const onChange = (e) => {
    const { name, value } = e.target;
    setBillForm((prev) => ({ ...prev, [name]: value }));
  };

  const onPreview = async () => {
    try {
      const payload = {
        cc: billForm.cc,
        ccpf: billForm.partFinal,
        ccn: billForm.ccn,
        coy: billForm.personCompany,
        ued: billForm.fine === "No" ? "Yes" : "No",
        pac: Number(billForm.pac || 0),
        ba: Number(billForm.baseValue || 0),
        baseAmount: Number(billForm.baseValue || 0),
        eCharge: Number(billForm.electricityCharges || 0),
        agdate: billForm.agdate,
        wod: billForm.wod,
        doc: billForm.doc,
        adoc: billForm.actualDateOfCompletion
      };
      console.log("Calculate payload:", payload);
      const data = await previewCalculation(payload);
      console.log("Calculate result:", data);
      setResult(data);
    } catch (error) {
      console.error("Calculate error:", error);
      alert("Calculate Error: " + error.message);
    }
  };

  const openPreview = (template) => {
    const templateAliases = {
      "audit-enfacement": "aes-register",
      "audit-enfacement-sheet-register": "aes-register",
      "audit-notes": "audit-notes",
      "note-to-fo": "audit-enfacement-format"
    };
    const selectedTemplate = templateAliases[template] || template;
    const selectedBudget = budgets.find((b) => b._id === billForm.budgetId);

    const contractor = contractors.find((c) => c._id === billForm.contractorId);
    const contractorName = contractor?.name || getContractorName(billForm.contractorId);
    const payload = {
      billRegisterNo: billForm.billRegisterNo,
      billDate: billForm.billDate,
      contractorName,
      contractorAddress: contractor?.address || "",
      nameOfWork: billForm.nameOfWork,
      section: billForm.section,
      cc: billForm.cc,
      workOrderNo: billForm.workOrderNo,
      workOrderDate: billForm.wod,
      agreementNo: billForm.agreementNo,
      agreementDate: billForm.agdate,
      esasNo: billForm.esasNo,
      tsqsNo: billForm.tsqsNo,
      partFinal: billForm.partFinal,
      actualDateOfCompletion: billForm.actualDateOfCompletion,
      dateOfCompletion: billForm.dateOfCompletion,
      mbookNumbers: billForm.mbookNumbers,
      pages: billForm.pages,
      estimateAmount: Number(billForm.estimateAmount || 0),
      pac: Number(billForm.pac || 0),
      uptoDateBillAmount: Number(billForm.uptodateBillAmount || 0),
      measurementByAE: billForm.measurementByAE,
      measurementByAEE: billForm.measurementByAEE,
      headOfAccount: selectedBudget?.headOfAccount || "",
      budgetCode: selectedBudget?.code || "",
      allocation: Number(selectedBudget?.allocation || 0),
      expenditure: Number(selectedBudget?.expenditure || 0),
      balance: Number(selectedBudget?.balance || 0),
      closingDate: billForm.billDate,
      baseValue: Number(billForm.baseValue || 0),
      billAmount: Number(billForm.billAmount || 0),
      electricityCharges: Number(billForm.electricityCharges || 0),
      // attach calculation results if present
      gst: result?.gst || 0,
      it: result?.it || 0,
      wwc: result?.wwc || 0,
      retention: result?.retention || 0,
      fineExecution: result?.fineagr || 0,
      fineCompletion: result?.fine || 0,
      fineOthers: 0,
      // use computed cheque amount (based on bill amount - deductions)
      chequeAmount: result?.cheque ?? result?.wit ?? 0
    };

    // open modal with iframe preview and pass payload
    setPreviewPayload({ template: selectedTemplate, payload });
    setPreviewOpen(true);

    // modal only (no fallback tab)
  };

  const onSave = async () => {
    if (!billForm.billRegisterNo) {
      alert("Please fill in Bill Register No");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        agno: billForm.billRegisterNo,
        contractorId: billForm.contractorId,
        budgetId: billForm.budgetId,
        ccpf: billForm.partFinal,
        ccn: billForm.ccn,
        coy: billForm.personCompany,
        ued: billForm.fine === "No" ? "Yes" : "No",
        pac: Number(billForm.pac || 0),
        ba: Number(billForm.baseValue || 0),
        baseAmount: Number(billForm.baseValue || 0),
        billAmount: Number(billForm.billAmount || 0),
        uptoDateBillAmount: Number(billForm.uptodateBillAmount || 0),
        eCharge: Number(billForm.electricityCharges || 0),
        agdate: billForm.agdate,
        wod: billForm.wod,
        doc: billForm.doc,
        adoc: billForm.actualDateOfCompletion
      };
      console.log("Save payload:", payload);
      let saved;
      if (editingId) {
        saved = await updateWorkOrder(editingId, payload);
        console.log("Updated work order:", saved);
        alert("Bill Updated Successfully! ID: " + saved._id);
      } else {
        saved = await createWorkOrder(payload);
        console.log("Saved work order:", saved);
        alert("Bill Saved Successfully! ID: " + saved._id);
      }

      // Extract calculations from the response
      const calculations = saved.calculations || saved;
      setResult(calculations);

      // clear form/editing state
      resetForm();
      setEditingId(null);

      // refresh list so the header count and rows are up-to-date
      await loadBills();
      
      // Deduct from selected budget: reduce balance and increase expenditure
      try {
        if (billForm.budgetId && calculations) {
          const budget = budgets.find(b => b._id === billForm.budgetId);
          const netPayable = Number(calculations.wit || calculations.net || 0);
          // if the head has zero allocation we treat it as non‑expendable; leave values at 0
          if (budget && budget.allocation > 0 && netPayable > 0) {
            const newBalance = Math.max(0, (budget.balance || 0) - netPayable);
            const newExpenditure = (budget.expenditure || 0) + netPayable;
            await updateBudget(budget._id, { balance: newBalance, expenditure: newExpenditure });
            // update local state
            setBudgets(prev => prev.map(b => b._id === budget._id ? { ...b, balance: newBalance, expenditure: newExpenditure } : b));
          }
        }
      } catch (err) {
        console.error('Budget update failed', err);
        // don't block the save flow; inform user
        alert('Warning: Budget update failed - ' + (err.message || err));
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Save Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBillForm({
      billDate: new Date().toISOString().split('T')[0],
      personCompany: "Person",
      contractorId: "",
      billRegisterNo: "",
      budgetId: "",
      nameOfWork: "",
      workOrderNo: "",
      agreementNo: "",
      esasNo: "",
      tsqsNo: "",
      dateOfCompletion: "",
      actualDateOfCompletion: "",
      billAmount: 0,
      baseValue: 0,
      electricityCharges: 0,
      gstToDeduct: 0,
      uptodateBillAmount: 0,
      estimateAmount: 0,
      pac: 0,
      partFinal: "Final",
      fine: "No",
      section: "",
      cc: "I",
      measurementByAE: "",
      measurementByAEE: "",
      mbookNumbers: "",
      pages: "",
      ccpf: "Final",
      ccn: "I",
      coy: "Person",
      ued: "Yes",
      eCharge: 0,
      agdate: "",
      wod: "",
      doc: "",
      adoc: "",
      items: []
    });
    setResult(null);
  };

  return (
    <div className="app">
      <OfflineBanner />
      <div className="view-tabs">
        <button 
          className={view === "form" ? "tab-btn active" : "tab-btn"}
          onClick={() => setView("form")}
        >
          New Bill
        </button>
        <button 
          className={view === "list" ? "tab-btn active" : "tab-btn"}
          onClick={() => setView("list")}
        >
          Bill List ({bills.length})
        </button>
      </div>

      {view === "form" && (
        <form className="bill-form">
          <div className="form-header">
            <h1>MAHATMA GANDHI UNIVERSITY</h1>
            <h2>Office of the Divisional Accountant</h2>
            <h3>Bill Data Entry Form</h3>
            <div className="bill-date">
              <label>Bill Date:</label>
              <input type="date" name="billDate" value={billForm.billDate} onChange={onChange} />
            </div>
          </div>

          {/* Form1-aligned layout: Identification */}
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
                <div style={{display:'flex', gap:8}}>
                  <select name="contractorId" value={billForm.contractorId} onChange={onChange}>
                    <option value="">Select Contractor</option>
                    {contractors.map(c => (
                      <option key={c._id} value={c._id}>{c.name}</option>
                    ))}
                  </select>
                  <button type="button" className="btn" onClick={() => setContractorModalOpen(true)}>Add</button>
                </div>
              </div>
              <div className="form-group">
                <label>Section</label>
                <input type="text" name="section" value={billForm.section} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Head of Account</label>
                <div style={{display:'flex', gap:8}}>
                  <select name="budgetId" value={billForm.budgetId} onChange={onChange}>
                    <option value="">Select Budget</option>
                    {budgets.map(b => (
                      <option key={b._id} value={b._id}>{b.code} - {b.headOfAccount} (Bal: ₹{b.balance?.toLocaleString()})</option>
                    ))}
                  </select>
                  <button type="button" className="btn" onClick={() => setBudgetModalOpen(true)}>Add</button>
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
                <textarea name="nameOfWork" value={billForm.nameOfWork} onChange={onChange} rows="2"></textarea>
              </div>
            </div>
          </div>

          {/* Form1-aligned layout: Reference & Completion */}
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
                <input type="date" name="actualDateOfCompletion" value={billForm.actualDateOfCompletion} onChange={onChange} />
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

          {/* Form1-aligned layout: Amounts */}
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
                <input type="number" name="uptodateBillAmount" value={billForm.uptodateBillAmount} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>GST to be Deducted</label>
                <input type="number" name="gstToDeduct" value={billForm.gstToDeduct} onChange={onChange} />
              </div>
              <div className="form-group">
                <label>Electricity Charges</label>
                <input type="number" name="electricityCharges" value={billForm.electricityCharges} onChange={onChange} />
              </div>
            </div>
          </div>

          {/* Form1-aligned layout: Measurement & Book */}
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

          {/* Action Buttons */}
          <div className="form-actions">
            <button type="button" className="btn btn-calculate" onClick={onPreview}>Calculate</button>
            <button type="button" className="btn btn-audit-enfacement" onClick={() => openPreview('aes-register')}>Audit Enfacement Sheet Register</button>
            <button type="button" className="btn btn-audit" onClick={() => openPreview('audit-notes')}>Audit Notes</button>
            <button type="button" className="btn btn-note" onClick={() => openPreview('audit-enfacement-format')}>Note to F.O. / Enfacement Format</button>
            <button type="button" className="btn btn-dsd" onClick={() => openPreview('schedule-formats')}>DSD Schedule</button>
            <button type="button" className="btn btn-payment" onClick={() => openPreview('payment-register')}>Payment Register</button>
            <button type="button" className="btn btn-save" onClick={onSave} disabled={saving}>
              {saving ? "Saving..." : "Save Bill"}
            </button>
          </div>

          {/* Calculation Result */}
          {result && (
            <div className="calculation-result">
              <h4>Calculation Result</h4>
              <div className="result-grid">
                <div className="result-item">
                  <span className="label">GST:</span>
                  <span className="value">₹{result.gst}</span>
                </div>
                <div className="result-item">
                  <span className="label">Income Tax:</span>
                  <span className="value">₹{result.it}</span>
                </div>
                <div className="result-item">
                  <span className="label">WWC:</span>
                  <span className="value">₹{result.wwc}</span>
                </div>
                <div className="result-item">
                  <span className="label">Retention:</span>
                  <span className="value">₹{result.retention}</span>
                </div>
                <div className="result-item">
                  <span className="label">Fine:</span>
                  <span className="value">₹{result.fine}</span>
                </div>
                <div className="result-item">
                  <span className="label">Agreement Fine:</span>
                  <span className="value">₹{result.fineagr}</span>
                </div>
                <div className="result-item highlight">
                  <span className="label">Total Deductions:</span>
                  <span className="value">₹{result.dwoit}</span>
                </div>
                <div className="result-item highlight">
                  <span className="label">Net Payable (WIT):</span>
                  <span className="value">₹{result.wit}</span>
                </div>
              </div>
            </div>
          )}

          {/* Preview modal with iframe */}
          {previewOpen && (
            <div id="preview-print-container" className="preview-modal" onClick={() => setPreviewOpen(false)}>
              <div className="preview-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                  <div>Print Preview</div>
                  <div className="preview-actions">
                    <button className="btn" onClick={printPreview}>Print</button>
                    <button className="btn" onClick={() => setPreviewOpen(false)}>Close</button>
                  </div>
                </div>
                <iframe id="preview-iframe" title="preview" srcDoc={PRINT_PREVIEW_DOCUMENT} onLoad={() => {
              if (previewPayload) {
                console.log('iframe loaded, posting payload onLoad', previewPayload);
                const w = getPreviewWindow();
                if (w) w.postMessage(previewPayload, '*');
              }
            }} />
              </div>
            </div>
          )}

          {/* Add Contractor Modal */}
          {contractorModalOpen && (
            <div className="preview-modal" onClick={() => setContractorModalOpen(false)}>
              <div className="preview-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                  <div>Add Contractor</div>
                  <button className="btn" onClick={() => setContractorModalOpen(false)}>Close</button>
                </div>
                <div style={{padding:12}}>
                  <label style={{display:'block', marginBottom:6}}>Name</label>
                  <input value={newContractorName} onChange={(e)=>setNewContractorName(e.target.value)} style={{width:'100%', padding:8, marginBottom:12}} />
                  <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                    <button className="btn" onClick={() => setContractorModalOpen(false)}>Cancel</button>
                    <button className="btn btn-save" onClick={submitNewContractor}>Add Contractor</button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Add Budget Modal */}
          {budgetModalOpen && (
            <div className="preview-modal" onClick={() => setBudgetModalOpen(false)}>
              <div className="preview-dialog" onClick={(e) => e.stopPropagation()}>
                <div className="preview-header">
                  <div>Add Budget Head</div>
                  <button className="btn" onClick={() => setBudgetModalOpen(false)}>Close</button>
                </div>
                <div style={{padding:12}}>
                  <label style={{display:'block', marginBottom:6}}>Code</label>
                  <input value={newBudgetCode} onChange={(e)=>setNewBudgetCode(e.target.value)} style={{width:'100%', padding:8, marginBottom:8}} />
                  <label style={{display:'block', marginBottom:6}}>Head Of Account</label>
                  <input value={newBudgetHead} onChange={(e)=>setNewBudgetHead(e.target.value)} style={{width:'100%', padding:8, marginBottom:8}} />
                  <label style={{display:'block', marginBottom:6}}>Allocation (₹)</label>
                  <input type="number" value={newBudgetAllocation} onChange={(e)=>setNewBudgetAllocation(e.target.value)} style={{width:'100%', padding:8, marginBottom:12}} />
                  <div style={{display:'flex', gap:8, justifyContent:'flex-end'}}>
                    <button className="btn" onClick={() => setBudgetModalOpen(false)}>Cancel</button>
                    <button className="btn btn-save" onClick={submitNewBudget}>Add Budget</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      )}

      {view === "list" && (
        <div className="bills-list">
          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', gap:12}}>
            <h3 style={{margin:0}}>Saved Bills ({bills.length})</h3>
            <div style={{display:'flex', gap:8, alignItems:'center'}}>
              <input placeholder="Search bills..." value={searchTerm} onChange={(e)=>setSearchTerm(e.target.value)} style={{padding:8}} onKeyDown={(e)=>{ if(e.key==='Enter') loadBills(); }} />
              <button className="btn" onClick={()=>{ loadBills(); }}>Search</button>
              <button className="btn" onClick={async ()=>{ setSearchTerm(''); await loadBills(); }}>Clear</button>
            </div>
          </div>
          {billsLoading && <p>Loading bills...</p>}
          {!billsLoading && bills.length === 0 && (
            <p>No bills saved yet</p>
          )}
          {!billsLoading && filteredBills.length > 0 && (
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
                  <tr key={bill._id} onClick={() => openBill(bill)} style={{cursor:'pointer'}}>
                    <td>{bill.agno}</td>
                    <td>{getContractorName(bill.contractorId)}</td>
                    <td>₹{(bill.baseAmount||bill.ba||0).toLocaleString()}</td>
                    <td>₹{((bill.calculations && bill.calculations.wit) || 0).toLocaleString()}</td>
                    <td>{bill.status || 'Draft'}</td>
                    <td>{bill.createdAt ? new Date(bill.createdAt).toLocaleDateString() : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
