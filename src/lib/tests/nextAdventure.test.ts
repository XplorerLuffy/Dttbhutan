import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { bookingTimeline, countdown, pickNextBooking, waitProgress, type NextBooking } from "../nextAdventure";

const d = (s: string) => new Date(s);
const base = (o: Partial<NextBooking> = {}): NextBooking => ({
  id: "b", status: "CONFIRMED", startDate: d("2027-03-14T00:00:00Z"), endDate: d("2027-03-22T00:00:00Z"),
  createdAt: d("2026-10-24T05:00:00Z"), updatedAt: d("2026-10-25T05:00:00Z"), totalPrice: 100000, payment: null, ...o,
});
const pay = (status: "PENDING" | "PAID" | "FAILED" | "REFUNDED") => ({ status, amount: 100000, method: "BANK_TRANSFER", createdAt: d("2026-10-26T00:00:00Z"), updatedAt: d("2026-11-01T00:00:00Z") });

describe("pickNextBooking", () => {
  const now = d("2026-11-20T00:00:00Z");
  it("is the soonest confirmed trip not yet over", () => {
    const a = base({ id: "a", startDate: d("2027-05-01Z"), endDate: d("2027-05-05Z") });
    const b = base({ id: "b" });
    assert.equal(pickNextBooking([a, b], now)?.id, "b");
  });
  it("ignores pending, cancelled, completed and finished trips", () => {
    const list = [base({ status: "PENDING" }), base({ status: "CANCELLED" }), base({ status: "COMPLETED" }), base({ endDate: d("2026-11-01Z") })];
    assert.equal(pickNextBooking(list, now), null);
  });
  it("none for an empty list", () => assert.equal(pickNextBooking([], now), null));
});

describe("countdown", () => {
  const s = d("2027-03-14T00:00:00Z"), e = d("2027-03-22T00:00:00Z");
  it("counts calendar days in Bhutan", () => {
    assert.equal(countdown(s, e, d("2026-11-19T10:00:00Z")).text, "115 days to go");
  });
  it("singular, today and under way never go negative", () => {
    assert.equal(countdown(s, e, d("2027-03-13T03:00:00Z")).text, "1 day to go");
    assert.equal(countdown(s, e, d("2027-03-14T03:00:00Z")).kind, "today");
    assert.equal(countdown(s, e, d("2027-03-16T03:00:00Z")).kind, "underway");
  });
  it("uses the Bhutan date, not UTC (19:00 UTC is already tomorrow there)", () => {
    assert.equal(countdown(s, e, d("2027-03-13T19:00:00Z")).kind, "today");
  });
});

describe("waitProgress", () => {
  it("is clamped between 0 and 1", () => {
    const c = d("2026-10-01Z"), s = d("2027-01-01Z");
    assert.equal(waitProgress(c, s, d("2026-09-01Z")), 0);
    assert.equal(waitProgress(c, s, d("2027-02-01Z")), 1);
    const mid = waitProgress(c, s, d("2026-11-16T12:00:00Z"));
    assert.ok(mid > 0.45 && mid < 0.55);
  });
});

describe("bookingTimeline", () => {
  const st = (b: NextBooking) => bookingTimeline(b).map((x) => x.state).join(",");
  it("confirmed, no payment record: choose a method next", () => assert.equal(st(base()), "done,current,upcoming,upcoming,upcoming"));
  it("method chosen, unpaid: payment is the current step with the amount", () => {
    const t = bookingTimeline(base({ payment: pay("PENDING") }));
    assert.equal(t.map((x) => x.state).join(), "done,done,current,upcoming,upcoming");
    assert.equal(t[2].detail, "Nu. 100,000 due");
    assert.equal(t[2].actionable, true);
  });
  it("paid: three steps done, documents still upcoming", () => {
    const t = bookingTimeline(base({ payment: pay("PAID") }));
    assert.equal(t.map((x) => x.state).join(), "done,done,done,upcoming,upcoming");
    assert.equal(t[2].title, "Payment Received");
  });
  it("failed payment is a problem state", () => assert.equal(bookingTimeline(base({ payment: pay("FAILED") }))[2].state, "problem"));
  it("a pending booking is waiting for confirmation", () => assert.equal(st(base({ status: "PENDING" })), "current,upcoming,upcoming,upcoming,upcoming"));
});
