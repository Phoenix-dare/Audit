const roundNearest = (value) => Math.round(Number(value || 0));

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
  const ccn = (input.ccn || "").trim();
  const coy = (input.coy || "").trim();
  const ued = (input.ued || "").trim();

  const pac = toNumber(input.pac);
  let ba = toNumber(input.ba);
  const baseAmount = toNumber(input.baseAmount);
  const eCharge = toNumber(input.eCharge);

  let bv = ba - pac;
  if (bv < 0) bv = 0;
  ba = ba > pac ? pac : ba;

  const nlc = ccpf === "Final" ? "Yes" : "Part Bill";

  let gst = 0;
  // GST 2% deduction if base value exceeds 3.5 lakh OR contractor is a company
  if (baseAmount > 350000 || coy === "Company") {
    gst = baseAmount * 0.02;
  }
  gst = roundNearest(gst);

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

  const dwoit = retention + fineagr + fine + gst + wwc + eCharge;
  // original net payable (base minus all deductions + it)
  const wit = ba - (dwoit + it);
  const eh = it + wit;
  // calculate cheque amount from the actual bill amount entered by user
  const billAmt = toNumber(input.billAmount);
  const cheque = billAmt - (dwoit + it);

  return {
    pac,
    ba,
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
