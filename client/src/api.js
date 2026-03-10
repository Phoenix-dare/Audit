const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:5000/api";

// ============= WORK ORDERS =============
export async function previewCalculation(payload) {
  const res = await fetch(`${API_BASE}/calculate/preview`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Calculation failed");
  return res.json();
}

export async function createWorkOrder(payload) {
  const res = await fetch(`${API_BASE}/work-orders`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create failed");
  return res.json();
}

export async function getWorkOrders(q) {
  const url = q ? `${API_BASE}/work-orders?q=${encodeURIComponent(q)}` : `${API_BASE}/work-orders`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Fetch failed");
  return res.json();
}

export async function getWorkOrder(id) {
  const res = await fetch(`${API_BASE}/work-orders/${id}`);
  if (!res.ok) throw new Error('Fetch work order failed');
  return res.json();
}

export async function updateWorkOrder(id, payload) {
  const res = await fetch(`${API_BASE}/work-orders/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Update failed");
  return res.json();
}

// ============= CONTRACTORS =============
export async function getContractors() {
  const res = await fetch(`${API_BASE}/contractors`);
  if (!res.ok) throw new Error("Fetch contractors failed");
  return res.json();
}

export async function getContractor(id) {
  const res = await fetch(`${API_BASE}/contractors/${id}`);
  if (!res.ok) throw new Error("Fetch contractor failed");
  return res.json();
}

export async function createContractor(payload) {
  const res = await fetch(`${API_BASE}/contractors`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create contractor failed");
  return res.json();
}

export async function updateContractor(id, payload) {
  const res = await fetch(`${API_BASE}/contractors/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Update contractor failed");
  return res.json();
}

// ============= BUDGETS =============
export async function getBudgets() {
  const res = await fetch(`${API_BASE}/budgets`);
  if (!res.ok) throw new Error("Fetch budgets failed");
  return res.json();
}

export async function getBudget(id) {
  const res = await fetch(`${API_BASE}/budgets/${id}`);
  if (!res.ok) throw new Error("Fetch budget failed");
  return res.json();
}

export async function createBudget(payload) {
  const res = await fetch(`${API_BASE}/budgets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create budget failed");
  return res.json();
}

export async function updateBudget(id, payload) {
  const res = await fetch(`${API_BASE}/budgets/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Update budget failed");
  return res.json();
}

// ============= EXTRA ITEMS =============
export async function getExtraItems() {
  const res = await fetch(`${API_BASE}/extra-items`);
  if (!res.ok) throw new Error("Fetch items failed");
  return res.json();
}

export async function getWorkOrderItems(workOrderId) {
  const res = await fetch(`${API_BASE}/extra-items/work/${workOrderId}`);
  if (!res.ok) throw new Error("Fetch items failed");
  return res.json();
}

export async function createExtraItem(payload) {
  const res = await fetch(`${API_BASE}/extra-items`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create item failed");
  return res.json();
}

export async function createBatchExtraItems(workOrderId, items) {
  const res = await fetch(`${API_BASE}/extra-items/batch/${workOrderId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(items)
  });
  if (!res.ok) throw new Error("Create items failed");
  return res.json();
}

export async function updateExtraItem(id, payload) {
  const res = await fetch(`${API_BASE}/extra-items/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Update item failed");
  return res.json();
}

export async function deleteExtraItem(id) {
  const res = await fetch(`${API_BASE}/extra-items/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Delete item failed");
  return res.json();
}

// ============= AUDIT NOTES =============
export async function getAuditNotes() {
  const res = await fetch(`${API_BASE}/audit-notes`);
  if (!res.ok) throw new Error("Fetch notes failed");
  return res.json();
}

export async function getWorkOrderNotes(workOrderId) {
  const res = await fetch(`${API_BASE}/audit-notes/work/${workOrderId}`);
  if (!res.ok) throw new Error("Fetch notes failed");
  return res.json();
}

export async function createAuditNote(payload) {
  const res = await fetch(`${API_BASE}/audit-notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Create note failed");
  return res.json();
}

export async function updateAuditNote(id, payload) {
  const res = await fetch(`${API_BASE}/audit-notes/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("Update note failed");
  return res.json();
}

export async function deleteAuditNote(id) {
  const res = await fetch(`${API_BASE}/audit-notes/${id}`, {
    method: "DELETE"
  });
  if (!res.ok) throw new Error("Delete note failed");
  return res.json();
}
