const roundNearest = (value) => Math.round(Number(value || 0));
const roundTwo = (value) => Math.round(Number(value || 0) * 100) / 100;

const toNumber = (value) => {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
};

const dateDiffDays = (start, end) => {
  if (!start || !end) return 0;
  const s = new Date(start);
  const e = new Date(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((e - s) / msPerDay);
};

export function calculateAudit(input) {
  const ccpf = (input.ccpf || "").trim();
  const coy = (input.coy || input.personCompany || "").trim();
  const ued = (input.ued || "").trim();

  const pac = toNumber(input.pac);
  const incomingBa = toNumber(input.ba);
  const incomingBaseAmount = toNumber(input.baseAmount);
  const incomingBillAmount = toNumber(input.billAmount);
  const eCharge = toNumber(input.eCharge);

  // Keep bill amount and base value in sync:
  // billAmount = base * 1.18 and base = billAmount / 1.18
  let baseAmount = incomingBaseAmount || incomingBa;
  let billAmount = incomingBillAmount;
  if (baseAmount <= 0 && billAmount > 0) {
    baseAmount = roundTwo(billAmount / 1.18);
  }
  if (billAmount <= 0 && baseAmount > 0) {
    billAmount = roundTwo(baseAmount * 1.18);
  }

  let ba = baseAmount;
  let bv = ba - pac;
  if (bv < 0) bv = 0;

  const nlc = ccpf === "Final" ? "Yes" : "Part Bill";

  let gst = 0;
  // GST deduction is 2% only when base value is above 2.5 lakh.
  if (baseAmount > 250000) {
    gst = baseAmount * 0.02;
  }
  gst = roundNearest(gst);

  // Companies: 2% IT. Persons: 1% IT.
  let it = coy === "Company" ? baseAmount * 0.02 : baseAmount * 0.01;
  it = roundNearest(it);

  let wwc = roundNearest(baseAmount * 0.01);

  let retention = ccpf === "Part" ? baseAmount * 0.025 : 0;
  retention = roundNearest(retention);

  let fine = 0;
  const days = dateDiffDays(input.doc, input.adoc);
  if (days > 0 && ccpf === "Final") {
    fine = (0.01 * pac) * Math.floor(days / 7);
  }
  if (days % 7 > 0) {
    fine += 0.01 * pac;
  }
  if (fine > 0.1 * pac) {
    fine = 100000;
  }
  if (ued === "No") {
    fine = 0;
  }
  fine = roundNearest(fine);

  const delay = dateDiffDays(input.wod, input.agdate);
  let fineagr = delay > 14 && ccpf === "Final" ? pac * 0.01 : 0;
  if (fineagr > 0 && fineagr < 1000) {
    fineagr = 1000;
  }
  if (ued === "No") {
    fineagr = 0;
  }
  fineagr = roundNearest(fineagr);

  const dwoit = retention + fineagr + fine + gst + wwc + eCharge + it;
  const wit = roundNearest(billAmount - dwoit);
  const eh = it + wit;
  const cheque = wit;

  return {
    pac,
    ba,
    billAmount: roundNearest(billAmount),
    baseAmount,
    bv,
    nlc,
    days,
    delay,
    gst,
    it,
    wwc,
    retention,
    fine,
    fineagr,
    dwoit,
    wit,
    eh,
    cheque
  };
}
