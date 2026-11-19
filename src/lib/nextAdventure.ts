/**
 * Logic behind the dashboard's "Your next adventure" card and its booking
 * progress timeline. Pure, so it can be tested without a database.
 */
export type NextBooking = {
  id: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
  updatedAt: Date;
  totalPrice: number;
  payment: { status: "PENDING" | "PAID" | "REFUNDED" | "FAILED"; amount: number; method: string; createdAt: Date; updatedAt: Date } | null;
};

const DAY = 86_400_000;
const BHUTAN_OFFSET = 6 * 3_600_000;

/** Midnight (as a UTC timestamp) of the calendar day a moment falls on in Bhutan. */
function bhutanDay(d: Date): number {
  return Math.floor((d.getTime() + BHUTAN_OFFSET) / DAY) * DAY;
}

/** The soonest confirmed booking that has not ended. Pending bookings are not an "adventure" yet. */
export function pickNextBooking<T extends NextBooking>(bookings: T[], now: Date = new Date()): T | null {
  const cands = bookings.filter((b) => b.status === "CONFIRMED" && b.endDate.getTime() >= now.getTime());
  cands.sort((a, b) => a.startDate.getTime() - b.startDate.getTime());
  return cands[0] ?? null;
}

export type Countdown =
  | { kind: "days"; days: number; text: string }
  | { kind: "today"; text: string }
  | { kind: "underway"; text: string };

/** Whole calendar days until departure (Bhutan days); never negative. */
export function countdown(start: Date, end: Date, now: Date = new Date()): Countdown {
  const days = Math.round((bhutanDay(start) - bhutanDay(now)) / DAY);
  if (days > 1) return { kind: "days", days, text: `${days} days to go` };
  if (days === 1) return { kind: "days", days: 1, text: "1 day to go" };
  if (days === 0) return { kind: "today", text: "Departs today" };
  return { kind: "underway", text: "Your trip is under way" };
}

/**
 * How far through the wait from booking to departure we are, 0-1. It is only a
 * time measure, not a checklist of preparation steps.
 */
export function waitProgress(createdAt: Date, start: Date, now: Date = new Date()): number {
  const total = start.getTime() - createdAt.getTime();
  if (total <= 0) return 1;
  return Math.min(1, Math.max(0, (now.getTime() - createdAt.getTime()) / total));
}

export type StepState = "done" | "current" | "upcoming" | "problem";
export type TimelineStep = { key: string; title: string; detail: string; state: StepState; date?: Date; actionable?: boolean };

const METHOD: Record<string, string> = { BANK_TRANSFER: "bank transfer", MOBILE_WALLET: "mobile wallet", CASH: "cash" };

/**
 * Five steps from the booking's real state. The site records one payment per
 * booking (a chosen method, then paid or not), with no deposit, due date or
 * document upload, so:
 *  - step 2 is "payment method chosen" (a payment record exists);
 *  - step 3 is the payment itself — paid, failed, or waiting;
 *  - steps 4 and 5 stay upcoming: nothing in the system tracks them.
 */
export function bookingTimeline(b: NextBooking): TimelineStep[] {
  const confirmed = b.status === "CONFIRMED" || b.status === "COMPLETED";
  const p = b.payment;
  const paid = p?.status === "PAID";
  const steps: TimelineStep[] = [];

  steps.push({
    key: "confirmed",
    title: "Booking Confirmed",
    detail: confirmed ? "Confirmed by DTT Bhutan" : "Waiting for confirmation",
    state: confirmed ? "done" : "current",
    date: confirmed ? b.updatedAt : undefined,
  });

  steps.push({
    key: "method",
    title: "Payment Method Chosen",
    detail: p ? `By ${METHOD[p.method] ?? p.method.toLowerCase()}` : "Choose how you will pay",
    state: p ? "done" : confirmed ? "current" : "upcoming",
    date: p?.createdAt,
  });

  const amount = p?.amount ?? b.totalPrice;
  const money = `Nu. ${Math.round(amount).toLocaleString("en-US")}`;
  if (paid) {
    steps.push({ key: "payment", title: "Payment Received", detail: money, state: "done", date: p!.updatedAt });
  } else if (p?.status === "FAILED") {
    steps.push({ key: "payment", title: "Payment Failed", detail: `${money} · please contact us`, state: "problem", actionable: true });
  } else if (p?.status === "REFUNDED") {
    steps.push({ key: "payment", title: "Payment Refunded", detail: money, state: "problem", date: p.updatedAt });
  } else {
    steps.push({
      key: "payment",
      title: "Complete Payment",
      detail: `${money} due`,
      state: confirmed && p ? "current" : "upcoming",
      actionable: confirmed && Boolean(p),
    });
  }

  steps.push({ key: "documents", title: "Travel Documents", detail: "Prepare your permits and travel documents", state: "upcoming" });
  steps.push({ key: "ready", title: "Ready for Departure", detail: "Final briefing and trip updates", state: "upcoming" });
  return steps;
}
