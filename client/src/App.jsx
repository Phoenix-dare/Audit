import { startTransition, useDeferredValue, useEffect, useState } from "react";
import {
  createBudget,
  createContractor,
  deleteWorkOrder,
  getBudgets,
  getContractors,
  getWorkOrder,
  getWorkOrders,
  previewCalculation,
  syncWorkOrder
} from "./api";
import { calculateAudit } from "./calculateAudit";
import {
  createLocalKey,
  deleteCachedWorkOrder,
  getCachedBudgets,
  getCachedContractors,
  getCachedWorkOrders,
  getMeta,
  getPendingSyncs,
  normalizeCachedWorkOrder,
  removePendingSync,
  replaceCachedWorkOrder,
  saveCachedBudgets,
  saveCachedContractors,
  saveCachedWorkOrders,
  savePendingSync,
  setMeta,
  upsertCachedWorkOrder
} from "./offlineStore";
import { PRINT_PREVIEW_DOCUMENT, buildPrintPreviewDocument } from "./printPreviewDocument";
import SyncStatusBar from "./SyncStatusBar";
import BillFormView from "./BillFormView";
import BillsListView from "./BillsListView";
import useOnlineStatus from "./useOnlineStatus";
import "./styles.css";

const GST_DEDUCTION_THRESHOLD = 250000;
const DEDUCTION_GST_RATE = 0.02;
const BILL_GST_RATE = 0.18;
const LAST_SYNC_META_KEY = "lastSyncAt";

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundTo2 = (value) => Math.round(toNumber(value) * 100) / 100;

const toDateInput = (value) => {
  if (!value) return "";
  const text = String(value);
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const date = new Date(text);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().split("T")[0];
};

const getBillTimestamp = (bill) => {
  const value = bill?.updatedAtLocal || bill?.updatedAt || bill?.createdAt || bill?.billDate;
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
};

const sortBills = (items) => [...items].sort((a, b) => getBillTimestamp(b) - getBillTimestamp(a));

const sameBill = (left, right) => {
  if (!left || !right) return false;
  if (left.localKey && right.localKey && left.localKey === right.localKey) return true;
  if (left.serverId && right.serverId && left.serverId === right.serverId) return true;
  if (left.serverId && right._id && left.serverId === right._id) return true;
  if (right.serverId && left._id && right.serverId === left._id) return true;
  if (left.agno && right.agno && left.agno === right.agno) return true;
  return false;
};

const upsertBillCollection = (items, bill) => {
  const normalized = normalizeCachedWorkOrder(bill);
  const nextItems = items.filter((item) => !sameBill(item, normalized));
  nextItems.unshift(normalized);
  return sortBills(nextItems);
};

const removeBillByLocalKey = (items, localKey) =>
  sortBills(items.filter((item) => item.localKey !== localKey));

const matchesPendingDelete = (bill, entry) => {
  if (!bill || !entry || entry.action !== "delete") return false;
  if (entry.localKey && bill.localKey && entry.localKey === bill.localKey) return true;

  const entryServerId = entry.serverId || entry.payload?.serverId || "";
  if (!entryServerId) return false;

  return bill.serverId === entryServerId || bill._id === entryServerId;
};

const filterQueuedDeletes = (items, pendingEntries) => {
  const pendingDeletes = pendingEntries.filter((entry) => entry.action === "delete");
  if (pendingDeletes.length === 0) return items;
  return items.filter((bill) => !pendingDeletes.some((entry) => matchesPendingDelete(bill, entry)));
};

const mergeBudgetCollection = (currentBudgets, updates) => {
  const merged = [...currentBudgets];
  for (const update of updates) {
    const index = merged.findIndex((budget) => budget._id === update._id);
    if (index >= 0) {
      merged[index] = { ...merged[index], ...update };
    } else {
      merged.push(update);
    }
  }
  return merged.sort((a, b) => String(a.code || "").localeCompare(String(b.code || "")));
};

const mergeServerBills = (serverBills, cachedBills) => {
  const merged = serverBills.map((serverBill) => {
    const matchingCachedBill = cachedBills.find((candidate) =>
      sameBill(candidate, { _id: serverBill._id, serverId: serverBill._id, agno: serverBill.agno })
    );

    if (matchingCachedBill && matchingCachedBill.syncStatus && matchingCachedBill.syncStatus !== "synced") {
      return normalizeCachedWorkOrder(
        {
          ...serverBill,
          ...matchingCachedBill,
          calculations: matchingCachedBill.calculations || serverBill.calculations
        },
        {
          localKey: matchingCachedBill.localKey,
          serverId: serverBill._id,
          syncStatus: matchingCachedBill.syncStatus
        }
      );
    }

    return normalizeCachedWorkOrder(serverBill, {
      localKey: matchingCachedBill?.localKey || serverBill.localKey || serverBill._id,
      serverId: serverBill._id,
      syncStatus: "synced"
    });
  });

  for (const cachedBill of cachedBills) {
    if (!merged.some((item) => sameBill(item, cachedBill))) {
      merged.push(normalizeCachedWorkOrder(cachedBill));
    }
  }

  return sortBills(merged);
};

const filterBills = (items, query, contractors = []) => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return items;

  const contractorNames = new Map(
    contractors.map((contractor) => [String(contractor?._id || ""), contractor?.name || ""])
  );

  return items.filter((bill) =>
    [
      bill.agno,
      bill.section,
      bill.workOrderNo,
      bill.nameOfWork,
      String(bill.baseAmount || bill.ba || ""),
      String(bill.coy || ""),
      bill.syncStatus,
      contractorNames.get(String(bill.contractorId?._id || bill.contractorId || "")) || ""
    ].some((value) => String(value || "").toLowerCase().includes(normalizedQuery))
  );
};

const formatSyncTime = (value) => {
  if (!value) return "No sync yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No sync yet";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
};

const getSyncStatusLabel = (bill) => {
  switch (bill.syncStatus) {
    case "pending":
      return "Pending Sync";
    case "syncing":
      return "Syncing";
    case "failed":
      return "Sync Failed";
    default:
      return bill.status || "Draft";
  }
};

const getSyncStatusClass = (bill) => {
  switch (bill.syncStatus) {
    case "pending":
      return "status-badge pending";
    case "syncing":
      return "status-badge syncing";
    case "failed":
      return "status-badge failed";
    default:
      return "status-badge synced";
  }
};

const buildInitialBillForm = () => ({
  billDate: new Date().toISOString().split("T")[0],
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

const buildCalculationPayload = (form) => ({
  cc: form.cc,
  ccpf: form.partFinal,
  ccn: form.ccn,
  coy: form.personCompany,
  ued: form.fine === "No" ? "Yes" : "No",
  pac: Number(form.pac || 0),
  ba: Number(form.baseValue || 0),
  baseAmount: Number(form.baseValue || 0),
  billAmount: Number(form.billAmount || 0),
  eCharge: Number(form.electricityCharges || 0),
  agdate: form.agdate,
  wod: form.wod,
  doc: form.doc || form.dateOfCompletion,
  adoc: form.actualDateOfCompletion || form.adoc
});

const buildWorkOrderPayload = (form) => ({
  agno: form.billRegisterNo,
  billRegisterNo: form.billRegisterNo,
  billDate: form.billDate,
  personCompany: form.personCompany,
  contractorId: form.contractorId,
  budgetId: form.budgetId,
  nameOfWork: form.nameOfWork,
  workOrderNo: form.workOrderNo,
  agreementNo: form.agreementNo,
  esasNo: form.esasNo,
  tsqsNo: form.tsqsNo,
  dateOfCompletion: form.dateOfCompletion || form.doc,
  actualDateOfCompletion: form.actualDateOfCompletion || form.adoc,
  section: form.section,
  cc: form.cc,
  measurementByAE: form.measurementByAE,
  measurementByAEE: form.measurementByAEE,
  mbookNumbers: form.mbookNumbers,
  pages: form.pages,
  estimateAmount: Number(form.estimateAmount || 0),
  ccpf: form.partFinal,
  ccn: form.ccn,
  coy: form.personCompany,
  ued: form.fine === "No" ? "Yes" : "No",
  partFinal: form.partFinal,
  fine: form.fine,
  pac: Number(form.pac || 0),
  ba: Number(form.baseValue || 0),
  baseAmount: Number(form.baseValue || 0),
  baseValue: Number(form.baseValue || 0),
  billAmount: Number(form.billAmount || 0),
  gstToDeduct: Number(form.gstToDeduct || 0),
  uptoDateBillAmount: Number(form.uptodateBillAmount || 0),
  electricityCharges: Number(form.electricityCharges || 0),
  eCharge: Number(form.electricityCharges || 0),
  agdate: form.agdate,
  wod: form.wod,
  doc: form.doc || form.dateOfCompletion,
  adoc: form.actualDateOfCompletion || form.adoc
});

export default function App() {
  const online = useOnlineStatus();
  const [view, setView] = useState("form");
  const [contractors, setContractors] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [bills, setBills] = useState([]);
  const [billsLoading, setBillsLoading] = useState(false);
  const [billForm, setBillForm] = useState(buildInitialBillForm);
  const [result, setResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(PRINT_PREVIEW_DOCUMENT);
  const [contractorModalOpen, setContractorModalOpen] = useState(false);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [newContractorName, setNewContractorName] = useState("");
  const [newContractorType, setNewContractorType] = useState("Person");
  const [newBudgetCode, setNewBudgetCode] = useState("");
  const [newBudgetHead, setNewBudgetHead] = useState("");
  const [newBudgetAllocation, setNewBudgetAllocation] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [syncState, setSyncState] = useState("idle");
  const [syncMessage, setSyncMessage] = useState("Ready");
  const [lastSyncAt, setLastSyncAt] = useState("");
  const [liteMode, setLiteMode] = useState(false);

  const deferredSearchTerm = useDeferredValue(searchTerm);
  const pendingSyncCount = bills.filter((bill) => bill.syncStatus && bill.syncStatus !== "synced").length;
  const filteredBills = filterBills(bills, deferredSearchTerm || "", contractors);
  const isEditing = Boolean(editingId);

  const applyBillState = (nextBills) => {
    const sortedBills = sortBills(nextBills);
    startTransition(() => setBills(sortedBills));
    return sortedBills;
  };

  const closePreview = () => {
    setPreviewOpen(false);
    setPreviewDocument(PRINT_PREVIEW_DOCUMENT);
  };

  const printPreview = () => {
    if (!previewOpen) return;
    const previewWindow = document.getElementById("preview-iframe")?.contentWindow || null;
    if (!previewWindow) {
      alert("Preview is still loading. Please try again.");
      return;
    }

    try {
      previewWindow.focus();
      previewWindow.print();
    } catch (error) {
      console.error("iframe print setup error", error);
      alert("Unable to open the print dialog. Please retry.");
    }
  };

  const getContractorName = (contractorId) => {
    const normalizedId = contractorId?._id || contractorId;
    const contractor = contractors.find((candidate) => candidate._id === normalizedId);
    return contractor ? contractor.name : "Unknown";
  };

  const loadMasterData = async ({ silent = false } = {}) => {
    try {
      const [contractorData, budgetData] = await Promise.all([getContractors(), getBudgets()]);
      const nextContractors = Array.isArray(contractorData) ? contractorData : [];
      const nextBudgets = Array.isArray(budgetData) ? budgetData : [];
      await Promise.all([saveCachedContractors(nextContractors), saveCachedBudgets(nextBudgets)]);
      startTransition(() => {
        setContractors(nextContractors);
        setBudgets(nextBudgets);
      });
      return { contractors: nextContractors, budgets: nextBudgets };
    } catch (error) {
      console.error("Error loading master data:", error);
      const [cachedContractors, cachedBudgets] = await Promise.all([
        getCachedContractors(),
        getCachedBudgets()
      ]);
      if (cachedContractors.length || cachedBudgets.length) {
        startTransition(() => {
          setContractors(cachedContractors);
          setBudgets(cachedBudgets);
        });
        if (!silent) setSyncMessage("Using locally cached contractor and budget data.");
        return { contractors: cachedContractors, budgets: cachedBudgets };
      }
      if (!silent) alert("Failed to load master data: " + error.message);
      throw error;
    }
  };

  const loadBills = async ({ silent = false } = {}) => {
    setBillsLoading(true);
    try {
      const [remoteBills, cachedBills, pendingEntries] = await Promise.all([
        getWorkOrders(),
        getCachedWorkOrders(),
        getPendingSyncs()
      ]);
      const mergedBills = mergeServerBills(Array.isArray(remoteBills) ? remoteBills : [], cachedBills);
      const visibleBills = filterQueuedDeletes(mergedBills, pendingEntries);
      await saveCachedWorkOrders(visibleBills);
      applyBillState(visibleBills);
      return visibleBills;
    } catch (error) {
      console.error("Error loading bills:", error);
      const [cachedBills, pendingEntries] = await Promise.all([getCachedWorkOrders(), getPendingSyncs()]);
      const visibleBills = filterQueuedDeletes(sortBills(cachedBills), pendingEntries);
      if (visibleBills.length) {
        applyBillState(visibleBills);
        if (!silent) setSyncMessage("Showing locally saved bills.");
        return visibleBills;
      }
      if (!silent) alert("Failed to load bills: " + error.message);
      return [];
    } finally {
      setBillsLoading(false);
    }
  };

  const syncPendingWorkOrders = async ({ manual = false } = {}) => {
    if (!online) {
      if (manual) {
        alert("You are offline. The saved bills will sync when the connection returns.");
      }
      return { syncedCount: 0 };
    }

    if (syncState === "syncing") {
      return { syncedCount: 0 };
    }

    const pendingEntries = await getPendingSyncs();
    if (pendingEntries.length === 0) {
      if (manual) {
        await Promise.all([loadMasterData({ silent: true }), loadBills({ silent: true })]);
      }
      setSyncState("idle");
      setSyncMessage("All changes are already synced.");
      return { syncedCount: 0 };
    }

    setSyncState("syncing");
    setSyncMessage(`Syncing ${pendingEntries.length} change${pendingEntries.length === 1 ? "" : "s"}...`);

    let syncedCount = 0;
    let workingBills = filterQueuedDeletes(sortBills(await getCachedWorkOrders()), pendingEntries);
    let workingBudgets = await getCachedBudgets();

    for (const entry of pendingEntries.sort((left, right) => {
      const leftTime = new Date(left.queuedAt || 0).getTime();
      const rightTime = new Date(right.queuedAt || 0).getTime();
      return leftTime - rightTime;
    })) {
      if (entry.action === "delete") {
        try {
          const response = entry.serverId ? await deleteWorkOrder(entry.serverId) : { budgetUpdates: [] };
          workingBills = removeBillByLocalKey(workingBills, entry.localKey);
          await deleteCachedWorkOrder(entry.localKey);
          await removePendingSync(entry.localKey);

          if (Array.isArray(response.budgetUpdates) && response.budgetUpdates.length > 0) {
            workingBudgets = mergeBudgetCollection(workingBudgets, response.budgetUpdates);
            await saveCachedBudgets(workingBudgets);
            startTransition(() => setBudgets(workingBudgets));
          }

          applyBillState(workingBills);
          syncedCount += 1;
        } catch (error) {
          console.error("Delete sync failed:", error);
          setSyncState("error");
          setSyncMessage(error.message || "Delete sync failed.");
          if (manual) {
            alert("Delete sync failed: " + (error.message || error));
          }
          return { syncedCount, error };
        }
        continue;
      }

      const currentBill = workingBills.find((bill) => bill.localKey === entry.localKey);
      if (currentBill) {
        const syncingBill = normalizeCachedWorkOrder(currentBill, { syncStatus: "syncing" });
        workingBills = upsertBillCollection(workingBills, syncingBill);
        await upsertCachedWorkOrder(syncingBill);
        applyBillState(workingBills);
      }

      try {
        const response = await syncWorkOrder(entry.payload);
        const syncedBill = normalizeCachedWorkOrder(response.workOrder, {
          localKey: entry.localKey,
          serverId: response.workOrder._id,
          syncStatus: "synced"
        });

        workingBills = upsertBillCollection(workingBills, syncedBill);
        await replaceCachedWorkOrder(entry.localKey, syncedBill);
        await removePendingSync(entry.localKey);

        if (Array.isArray(response.budgetUpdates) && response.budgetUpdates.length > 0) {
          workingBudgets = mergeBudgetCollection(workingBudgets, response.budgetUpdates);
          await saveCachedBudgets(workingBudgets);
          startTransition(() => setBudgets(workingBudgets));
        }

        applyBillState(workingBills);
        syncedCount += 1;
      } catch (error) {
        console.error("Sync failed:", error);
        if (currentBill) {
          const failedBill = normalizeCachedWorkOrder(currentBill, { syncStatus: "failed" });
          workingBills = upsertBillCollection(workingBills, failedBill);
          await upsertCachedWorkOrder(failedBill);
          applyBillState(workingBills);
        }
        setSyncState("error");
        setSyncMessage(error.message || "Sync failed.");
        if (manual) {
          alert("Sync failed: " + (error.message || error));
        }
        return { syncedCount, error };
      }
    }

    const syncTime = new Date().toISOString();
    await setMeta(LAST_SYNC_META_KEY, syncTime);
    setLastSyncAt(syncTime);
    setSyncState("idle");
    setSyncMessage(
      syncedCount > 0
        ? `Synced ${syncedCount} change${syncedCount === 1 ? "" : "s"}.`
        : "All changes are already synced."
    );
    await Promise.all([loadMasterData({ silent: true }), loadBills({ silent: true })]);
    return { syncedCount };
  };

  useEffect(() => {
    const hydrate = async () => {
      try {
        const [cachedContractors, cachedBudgets, cachedBills, cachedLastSyncAt, pendingEntries] =
          await Promise.all([
            getCachedContractors(),
            getCachedBudgets(),
            getCachedWorkOrders(),
            getMeta(LAST_SYNC_META_KEY),
            getPendingSyncs()
          ]);
        const visibleBills = filterQueuedDeletes(sortBills(cachedBills), pendingEntries);

        startTransition(() => {
          if (cachedContractors.length) setContractors(cachedContractors);
          if (cachedBudgets.length) setBudgets(cachedBudgets);
          if (visibleBills.length) setBills(visibleBills);
        });
        if (cachedLastSyncAt) {
          setLastSyncAt(cachedLastSyncAt);
        }
      } catch (error) {
        console.warn("Offline cache hydrate failed", error);
      }

      await Promise.all([loadMasterData({ silent: true }), loadBills({ silent: true })]);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (view === "list") {
      loadBills({ silent: true });
    }
  }, [view]);

  useEffect(() => {
    if (!online) {
      setSyncMessage("Offline mode: local saves will sync later.");
      return;
    }
    syncPendingWorkOrders();
  }, [online]);

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
  }, [previewOpen]);

  useEffect(() => {
    document.body.classList.toggle("preview-print-active", previewOpen);
    return () => document.body.classList.remove("preview-print-active");
  }, [previewOpen]);

  useEffect(() => {
    const lowMemory =
      typeof navigator !== "undefined" &&
      ((navigator.deviceMemory && navigator.deviceMemory <= 4) ||
        (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4));
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nextLiteMode = Boolean(lowMemory || prefersReducedMotion);
    setLiteMode(nextLiteMode);
    document.body.classList.toggle("reduced-effects", nextLiteMode);
    return () => document.body.classList.remove("reduced-effects");
  }, []);

  const submitNewContractor = async () => {
    if (!newContractorName) return alert("Enter contractor name");
    if (!online) {
      alert("New contractors can be added once you are back online.");
      return;
    }

    try {
      const created = await createContractor({
        name: newContractorName,
        entityType: newContractorType
      });
      const nextContractors = [...contractors, created].sort((left, right) =>
        String(left.name || "").localeCompare(String(right.name || ""))
      );
      await saveCachedContractors(nextContractors);
      startTransition(() => setContractors(nextContractors));
      setNewContractorName("");
      setNewContractorType(billForm.personCompany || "Person");
      setContractorModalOpen(false);
      setSyncMessage("Contractor added.");
    } catch (error) {
      console.error("Create contractor failed", error);
      alert("Failed to create contractor: " + (error.message || error));
    }
  };

  const submitNewBudget = async () => {
    if (!newBudgetCode || !newBudgetHead) return alert("Fill budget code and head");
    if (!online) {
      alert("New budget heads can be added once you are back online.");
      return;
    }

    const allocation = Number(newBudgetAllocation || 0);
    try {
      const payload = {
        code: newBudgetCode,
        headOfAccount: newBudgetHead,
        allocation,
        balance: allocation
      };
      const created = await createBudget(payload);
      const nextBudgets = mergeBudgetCollection(budgets, [created]);
      await saveCachedBudgets(nextBudgets);
      startTransition(() => setBudgets(nextBudgets));
      setNewBudgetCode("");
      setNewBudgetHead("");
      setNewBudgetAllocation(0);
      setBudgetModalOpen(false);
      setSyncMessage("Budget head added.");
    } catch (error) {
      console.error("Create budget failed", error);
      alert("Failed to create budget: " + (error.message || error));
    }
  };

  const openBill = async (bill) => {
    if (!bill) return;

    let full = bill;
    const remoteId = bill.serverId || (String(bill._id || "").startsWith("work-order:") ? "" : bill._id);
    if (remoteId && online) {
      try {
        const fetched = await getWorkOrder(remoteId);
        full = normalizeCachedWorkOrder(fetched, {
          localKey: bill.localKey,
          serverId: fetched._id,
          syncStatus: bill.syncStatus || "synced"
        });
      } catch (error) {
        console.warn("Failed to fetch full bill, using cached item", error);
      }
    }

    setBillForm((prev) => {
      const baseValue = toNumber(full.baseValue ?? full.baseAmount ?? full.ba ?? prev.baseValue);
      const savedBillAmount = toNumber(full.billAmount);
      const billAmount =
        savedBillAmount > 0 ? savedBillAmount : roundTo2(baseValue * (1 + BILL_GST_RATE));
      const gstToDeduct =
        toNumber(full.gstToDeduct) ||
        (baseValue > GST_DEDUCTION_THRESHOLD ? roundTo2(baseValue * DEDUCTION_GST_RATE) : 0);

      return {
        ...prev,
        billDate: toDateInput(full.billDate) || prev.billDate,
        personCompany: full.personCompany || full.coy || prev.personCompany,
        contractorId: full.contractorId?._id || full.contractorId || "",
        billRegisterNo: full.agno || full.billRegisterNo || "",
        budgetId: full.budgetId?._id || full.budgetId || "",
        nameOfWork: full.nameOfWork || "",
        workOrderNo: full.workOrderNo || "",
        agreementNo: full.agreementNo || "",
        esasNo: full.esasNo || "",
        tsqsNo: full.tsqsNo || "",
        dateOfCompletion: toDateInput(full.dateOfCompletion || full.doc),
        actualDateOfCompletion: toDateInput(full.actualDateOfCompletion || full.adoc),
        billAmount,
        baseValue,
        electricityCharges: toNumber(full.electricityCharges ?? full.eCharge),
        gstToDeduct,
        uptodateBillAmount: toNumber(full.uptodateBillAmount ?? full.uptoDateBillAmount),
        estimateAmount: toNumber(full.estimateAmount),
        pac: toNumber(full.pac),
        partFinal: full.partFinal || full.ccpf || prev.partFinal,
        fine: full.fine || (full.ued === "No" ? "Yes" : "No"),
        section: full.section || "",
        cc: full.cc || prev.cc,
        measurementByAE: toDateInput(full.measurementByAE),
        measurementByAEE: toDateInput(full.measurementByAEE),
        mbookNumbers: full.mbookNumbers || "",
        pages: full.pages || "",
        ccpf: full.ccpf || full.partFinal || prev.ccpf,
        ccn: full.ccn || prev.ccn,
        coy: full.coy || full.personCompany || prev.coy,
        ued: full.ued || prev.ued,
        eCharge: toNumber(full.eCharge ?? full.electricityCharges),
        agdate: toDateInput(full.agdate),
        wod: toDateInput(full.wod),
        doc: toDateInput(full.doc || full.dateOfCompletion),
        adoc: toDateInput(full.adoc || full.actualDateOfCompletion),
        items: Array.isArray(full.items) ? full.items : prev.items
      };
    });

    setView("form");
    setEditingId(full.localKey || full.serverId || full._id || null);
    setResult(full.calculations || calculateAudit(full));
  };

  const onChange = (event) => {
    const { name, value } = event.target;
    setBillForm((prev) => {
      const next = { ...prev, [name]: value };

      if (name === "baseValue") {
        const baseValue = toNumber(value);
        next.billAmount = roundTo2(baseValue * (1 + BILL_GST_RATE));
        next.gstToDeduct =
          baseValue > GST_DEDUCTION_THRESHOLD ? roundTo2(baseValue * DEDUCTION_GST_RATE) : 0;
      }

      if (name === "billAmount") {
        const billAmount = toNumber(value);
        const baseValue = roundTo2(billAmount / (1 + BILL_GST_RATE));
        next.baseValue = baseValue;
        next.gstToDeduct =
          baseValue > GST_DEDUCTION_THRESHOLD ? roundTo2(baseValue * DEDUCTION_GST_RATE) : 0;
      }

      if (name === "personCompany") {
        next.coy = value;
      }

      if (name === "partFinal") {
        next.ccpf = value;
      }

      if (name === "fine") {
        next.ued = value === "No" ? "Yes" : "No";
      }

      if (name === "electricityCharges") {
        next.eCharge = toNumber(value);
      }

      if (name === "actualDateOfCompletion") {
        next.adoc = value;
      }

      if (name === "dateOfCompletion") {
        next.doc = value;
      }

      return next;
    });
  };

  const runCalculation = async (form) => {
    const payload = buildCalculationPayload(form);

    if (!online) {
      const offlineCalculation = calculateAudit(payload);
      setResult(offlineCalculation);
      setSyncMessage("Calculated locally while offline.");
      return offlineCalculation;
    }

    try {
      const data = await previewCalculation(payload);
      setResult(data);
      return data;
    } catch (error) {
      console.error("Calculate error:", error);
      const offlineCalculation = calculateAudit(payload);
      setResult(offlineCalculation);
      setSyncMessage("Used local calculation because the server was unavailable.");
      return offlineCalculation;
    }
  };

  const onPreview = async () => {
    try {
      await runCalculation(billForm);
    } catch (error) {
      console.error("Preview calculation failed", error);
      alert("Calculate Error: " + error.message);
    }
  };

  const openPreview = async (template) => {
    const templateAliases = {
      "audit-enfacement": "aes-register",
      "audit-enfacement-sheet-register": "aes-register",
      "audit-notes": "audit-notes",
      "note-to-fo": "audit-enfacement-format"
    };
    const selectedTemplate = templateAliases[template] || template;
    const selectedBudget = budgets.find((budget) => budget._id === billForm.budgetId);
    const contractor = contractors.find((candidate) => candidate._id === billForm.contractorId);

    let previewResult = result;
    if (!previewResult) {
      previewResult = await runCalculation(billForm);
    }

    const contractorName = contractor?.name || getContractorName(billForm.contractorId);
    const payload = {
      billRegisterNo: billForm.billRegisterNo,
      billDate: billForm.billDate,
      personCompany: billForm.personCompany,
      coy: billForm.personCompany,
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
      gst: previewResult?.gst ?? Number(billForm.gstToDeduct || 0),
      it: previewResult?.it || 0,
      wwc: previewResult?.wwc || 0,
      retention: previewResult?.retention || 0,
      fineExecution: previewResult?.fineagr || 0,
      fineCompletion: previewResult?.fine || 0,
      fineOthers: 0,
      chequeAmount: previewResult?.cheque ?? previewResult?.wit ?? 0
    };

    const nextPreview = { template: selectedTemplate, payload };
    setPreviewDocument(buildPrintPreviewDocument(nextPreview));
    setPreviewOpen(true);
  };

  const onSave = async () => {
    if (!billForm.billRegisterNo) {
      alert("Please fill in Bill Register No");
      return;
    }

    setSaving(true);
    try {
      const payload = buildWorkOrderPayload(billForm);
      const calculations = result || calculateAudit(payload);
      const existingBill = bills.find((bill) => bill.localKey === editingId) || null;
      const localKey = existingBill?.localKey || editingId || createLocalKey("work-order");
      const localRecord = normalizeCachedWorkOrder(
        {
          ...(existingBill || {}),
          ...payload,
          calculations,
          status: existingBill?.status || "Draft",
          createdAt: existingBill?.createdAt || new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          localKey,
          serverId: existingBill?.serverId || "",
          syncStatus: online ? "syncing" : "pending"
        }
      );

      await upsertCachedWorkOrder(localRecord);
      applyBillState(upsertBillCollection(bills, localRecord));
      await savePendingSync(
        localKey,
        {
          ...payload,
          serverId: existingBill?.serverId || ""
        },
        {
          action: "upsert",
          serverId: existingBill?.serverId || ""
        }
      );

      setResult(calculations);
      resetForm();

      if (online) {
        const syncResult = await syncPendingWorkOrders();
        if (syncResult.error) {
          alert("Bill saved locally. Sync failed and will retry later.");
        } else {
          alert(existingBill ? "Bill updated and synced." : "Bill saved and synced.");
        }
      } else {
        setSyncMessage("Bill saved locally and queued for sync.");
        alert("Bill saved locally. Use Sync when you are back online.");
      }
    } catch (error) {
      console.error("Save error:", error);
      alert("Save Error: " + error.message);
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setBillForm(buildInitialBillForm());
    setResult(null);
    setEditingId(null);
  };

  const startNewBill = () => {
    resetForm();
    setView("form");
  };

  const onDeleteBill = async (bill) => {
    if (!bill) return;

    const localKey = bill.localKey || bill.serverId || bill._id || "";
    const serverId = bill.serverId || (String(bill._id || "").startsWith("work-order:") ? "" : bill._id);
    const billLabel = bill.agno || bill.billRegisterNo || "this bill";
    const confirmMessage = serverId
      ? online
        ? `Delete ${billLabel}? This will remove the bill and roll back its budget usage.`
        : `Delete ${billLabel} locally? It will be removed from the server once sync succeeds.`
      : `Delete the local draft ${billLabel}? This cannot be undone.`;

    if (!window.confirm(confirmMessage)) {
      return;
    }

    try {
      if (serverId) {
        await savePendingSync(
          localKey,
          { serverId },
          {
            action: "delete",
            serverId
          }
        );
      } else {
        await removePendingSync(localKey);
      }

      await deleteCachedWorkOrder(localKey);
      applyBillState(removeBillByLocalKey(bills, localKey));

      if ([localKey, serverId, bill._id].filter(Boolean).includes(editingId)) {
        resetForm();
      }

      if (!serverId) {
        setSyncMessage("Local draft deleted.");
        return;
      }

      if (online) {
        const syncResult = await syncPendingWorkOrders();
        if (syncResult.error) {
          alert("Bill removed locally. Delete sync failed and will retry later.");
        } else {
          setSyncMessage("Bill deleted.");
          alert("Bill deleted.");
        }
      } else {
        setSyncMessage("Bill removed locally and queued for deletion.");
        alert("Bill removed locally. It will delete from the server when you are back online.");
      }
    } catch (error) {
      console.error("Delete error:", error);
      alert("Delete Error: " + (error.message || error));
    }
  };

  const baseValueForDisplay = toNumber(result?.baseAmount ?? billForm.baseValue);
  const gst18OnBaseForDisplay = roundTo2(baseValueForDisplay * BILL_GST_RATE);
  const billAmountForDisplay = toNumber(result?.billAmount ?? billForm.billAmount);
  const formatAmount = (value) => `₹${Math.round(toNumber(value)).toLocaleString("en-IN")}`;

  return (
    <div className="app">
      <SyncStatusBar
        online={online}
        pendingSyncCount={pendingSyncCount}
        liteMode={liteMode}
        syncState={syncState}
        syncMessage={syncMessage}
        lastSyncLabel={formatSyncTime(lastSyncAt)}
        onSync={() => syncPendingWorkOrders({ manual: true })}
      />

      <div className="view-tabs">
        <button className={view === "form" ? "tab-btn active" : "tab-btn"} onClick={() => setView("form")}>
          {isEditing ? "Editing Bill" : "New Bill"}
        </button>
        <button className={view === "list" ? "tab-btn active" : "tab-btn"} onClick={() => setView("list")}>
          Bill List ({bills.length})
        </button>
      </div>

      {view === "form" ? (
        <BillFormView
          billForm={billForm}
          isEditing={isEditing}
          onChange={onChange}
          onReset={startNewBill}
          contractors={contractors}
          budgets={budgets}
          contractorModalOpen={contractorModalOpen}
          budgetModalOpen={budgetModalOpen}
          setContractorModalOpen={setContractorModalOpen}
          setBudgetModalOpen={setBudgetModalOpen}
          newContractorName={newContractorName}
          setNewContractorName={setNewContractorName}
          newContractorType={newContractorType}
          setNewContractorType={setNewContractorType}
          newBudgetCode={newBudgetCode}
          setNewBudgetCode={setNewBudgetCode}
          newBudgetHead={newBudgetHead}
          setNewBudgetHead={setNewBudgetHead}
          newBudgetAllocation={newBudgetAllocation}
          setNewBudgetAllocation={setNewBudgetAllocation}
          onPreview={onPreview}
          openPreview={openPreview}
          onSave={onSave}
          saving={saving}
          online={online}
          result={result}
          formatAmount={formatAmount}
          baseValueForDisplay={baseValueForDisplay}
          gst18OnBaseForDisplay={gst18OnBaseForDisplay}
          billAmountForDisplay={billAmountForDisplay}
          previewOpen={previewOpen}
          previewDocument={previewDocument}
          printPreview={printPreview}
          closePreview={closePreview}
          submitNewContractor={submitNewContractor}
          submitNewBudget={submitNewBudget}
        />
      ) : (
        <BillsListView
          bills={bills}
          filteredBills={filteredBills}
          billsLoading={billsLoading}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onRefresh={() => loadBills({ silent: true })}
          onClear={async () => {
            setSearchTerm("");
            await loadBills({ silent: true });
          }}
          onOpenBill={openBill}
          onDeleteBill={onDeleteBill}
          getContractorName={getContractorName}
          getSyncStatusClass={getSyncStatusClass}
          getSyncStatusLabel={getSyncStatusLabel}
        />
      )}
    </div>
  );
}
