import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ageOn,
  blankDraft,
  detailsMismatch,
  draftToDetails,
  resizeTravelers,
  roomOfTraveler,
  travelerDetailsSchema,
  validateDraft,
  type TravelerDraft,
} from "../travelerDetails";

const rooms = [{ adults: 2, beds: 1 }];
const good = (): TravelerDraft => ({
  travelers: [
    { firstName: "Pema", lastName: "Dorji", dateOfBirth: "1985-06-15", nationality: "Bhutan", gender: "F", dietary: "" },
    { firstName: "Jean-Luc", lastName: "O'Neil", dateOfBirth: "1980-01-02", nationality: "France", gender: "", dietary: "Vegetarian" },
  ],
  email: "pema@example.com",
  phone: "+975 17 123 456",
  emergencyName: "",
  emergencyPhone: "",
  requests: "",
  acceptedTerms: true,
  paymentMethod: "",
});

describe("ageOn", () => {
  const today = new Date("2026-11-20T10:00:00Z");
  it("counts whole years and honours the birthday", () => {
    assert.equal(ageOn("2008-11-20", today), 18);
    assert.equal(ageOn("2008-11-21", today), 17);
    assert.equal(ageOn("1985-06-15", today), 41);
  });
});

describe("validateDraft", () => {
  it("accepts a complete, valid party", () => {
    assert.deepEqual(validateDraft(good(), rooms), {});
  });
  it("requires names and rejects characters that are not part of a name", () => {
    const d = good();
    d.travelers[0].firstName = "";
    d.travelers[1].lastName = "Smith<script>";
    const e = validateDraft(d, rooms);
    assert.match(e["travelers.0.firstName"], /required/);
    assert.match(e["travelers.1.lastName"], /letters, spaces/);
  });
  it("accepts accents, hyphens and apostrophes in names", () => {
    const d = good();
    d.travelers[0].firstName = "Zoë";
    d.travelers[0].lastName = "Núñez-O’Brien";
    assert.deepEqual(validateDraft(d, rooms), {});
  });
  it("checks the date of birth: real, not in the future, adult, sane", () => {
    const d = good();
    d.travelers[0].dateOfBirth = "2026-02-30";
    d.travelers[1].dateOfBirth = "2015-01-01";
    let e = validateDraft(d, rooms);
    assert.match(e["travelers.0.dateOfBirth"], /valid date/);
    assert.match(e["travelers.1.dateOfBirth"], /18 or over/);
    d.travelers[0].dateOfBirth = "1800-01-01";
    d.travelers[1].dateOfBirth = "";
    e = validateDraft(d, rooms);
    assert.ok(e["travelers.0.dateOfBirth"]);
    assert.ok(e["travelers.1.dateOfBirth"]);
  });
  it("needs a nationality from the list", () => {
    const d = good();
    d.travelers[0].nationality = "";
    d.travelers[1].nationality = "Narnia";
    const e = validateDraft(d, rooms);
    assert.ok(e["travelers.0.nationality"]);
    assert.ok(e["travelers.1.nationality"]);
  });
  it("checks email and phone", () => {
    const d = good();
    d.email = "not-an-email";
    d.phone = "abc";
    const e = validateDraft(d, rooms);
    assert.match(e["contact.email"], /valid email/);
    assert.match(e["contact.phone"], /phone/);
  });
  it("treats the emergency contact as all-or-nothing", () => {
    const d = good();
    d.emergencyName = "Karma";
    let e = validateDraft(d, rooms);
    assert.ok(e["emergency.phone"]);
    d.emergencyPhone = "+975 77 000 111";
    assert.deepEqual(validateDraft(d, rooms), {});
    d.emergencyName = "";
    e = validateDraft(d, rooms);
    assert.ok(e["emergency.name"]);
  });
  it("reports the emergency-contact problem together with other problems, not only after them", () => {
    const d = good();
    d.travelers[0].firstName = "";
    d.emergencyName = "Karma";
    const e = validateDraft(d, rooms);
    assert.ok(e["travelers.0.firstName"]);
    assert.ok(e["emergency.phone"]);
  });
  it("needs the terms accepted", () => {
    const d = good();
    d.acceptedTerms = false;
    assert.ok(validateDraft(d, rooms)["acceptedTerms"]);
  });
  it("caps the length of free text", () => {
    const d = good();
    d.requests = "x".repeat(1001);
    d.travelers[0].dietary = "y".repeat(201);
    const e = validateDraft(d, rooms);
    assert.ok(e["requests"]);
    assert.ok(e["travelers.0.dietary"]);
  });
  it("requires one traveler entry per adult in the rooms", () => {
    const d = good();
    d.travelers.pop();
    assert.ok(validateDraft(d, rooms)["travelers"]);
  });
});

describe("server-side schema", () => {
  it("parses the same payload the form builds, trimming and defaulting optional fields", () => {
    const r = travelerDetailsSchema.safeParse(draftToDetails({ ...good(), requests: "  Window seat  " }, rooms));
    assert.equal(r.success, true);
    if (r.success) {
      assert.equal(r.data.requests, "Window seat");
      assert.equal(r.data.travelers[0].dietary, "");
    }
  });
  it("accepts the three payment methods and nothing else", () => {
    for (const m of ["BANK_TRANSFER", "MOBILE_WALLET", "CASH"]) {
      assert.equal(travelerDetailsSchema.safeParse(draftToDetails({ ...good(), paymentMethod: m }, rooms)).success, true, m);
    }
    assert.equal(travelerDetailsSchema.safeParse(draftToDetails({ ...good(), paymentMethod: "CARD" }, rooms)).success, false);
    assert.equal(travelerDetailsSchema.safeParse(draftToDetails({ ...good(), paymentMethod: "" }, rooms)).success, true, "not chosen yet is allowed by the schema; the screen requires it");
  });
  it("rejects an oversized room layout", () => {
    const bad = draftToDetails(good(), [{ adults: 9, beds: 1 }]);
    assert.equal(travelerDetailsSchema.safeParse(bad).success, false);
  });
  it("detailsMismatch compares travelers and rooms with the booking", () => {
    const parsed = travelerDetailsSchema.parse(draftToDetails(good(), rooms));
    assert.equal(detailsMismatch(parsed, 2, 1), null);
    assert.match(detailsMismatch(parsed, 3, 1) ?? "", /number of travelers/);
    assert.match(detailsMismatch(parsed, 2, 2) ?? "", /number of rooms/);
  });
});

describe("helpers", () => {
  it("resizeTravelers keeps typed rows when the party changes", () => {
    const d = good();
    assert.equal(resizeTravelers(d, 2), d);
    assert.equal(resizeTravelers(d, 1).travelers[0].firstName, "Pema");
    const grown = resizeTravelers(d, 3);
    assert.equal(grown.travelers.length, 3);
    assert.equal(grown.travelers[1].firstName, "Jean-Luc");
    assert.equal(grown.travelers[2].firstName, "");
    assert.equal(blankDraft(2).travelers.length, 2);
  });
  it("roomOfTraveler maps travelers to their rooms in order", () => {
    assert.deepEqual(roomOfTraveler([{ adults: 2 }, { adults: 1 }, { adults: 2 }]), [1, 1, 2, 3, 3]);
  });
});
