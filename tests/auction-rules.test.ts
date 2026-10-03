import assert from "node:assert/strict";
import test from "node:test";
import { profileEligibility, rulesFor } from "../lib/eligibility";
import { listingSchema, validateListing } from "../lib/listing";

const employee = { employeeId: "FFCL-123", status: "ACTIVE", employmentStatus: "ACTIVE", jobGrade: "M3", department: "Technology", location: "Lagos" };

test("profile restrictions give a reason before bidding", () => {
  assert.equal(profileEligibility(rulesFor({ minimumGrade: "M4" }), employee).eligible, false);
  assert.match(profileEligibility(rulesFor({ departments: ["Finance"] }), employee).reason, /Finance/);
  assert.match(profileEligibility(rulesFor({ locations: ["Abuja"] }), employee).reason, /Abuja/);
  assert.equal(profileEligibility(rulesFor({}), { ...employee, status: "SUSPENDED" }).eligible, false);
  assert.equal(profileEligibility(rulesFor({}), { ...employee, employmentStatus: "LEFT" }).eligible, false);
  assert.equal(profileEligibility(rulesFor({ minimumGrade: "M3" }), employee).eligible, true);
  assert.equal(profileEligibility(rulesFor({ minimumGrade: "M3" }), { ...employee, jobGrade: "EXCO" }).eligible, true);
});

test("listing rejects invalid dates, missing asset provenance and incomplete lots", () => {
  const values = listingSchema.parse({ title: "Office desks", category: "Furniture", description: "Several approved office desks", condition: "Good", location: "Lagos", assetTag: "FF-1", photoKeys: [], pickupRules: "Collect with ID", paymentRules: "Transfer by deadline", startingPrice: 1000, bidIncrement: 100, startsAt: "2026-10-03T10:00:00.000Z", endsAt: "2026-10-04T10:00:00.000Z", paymentDeadline: "2026-10-06T10:00:00.000Z", pickupDeadline: "2026-10-12T10:00:00.000Z" });
  assert.equal(validateListing(values, "staff"), null);
  assert.match(validateListing({ ...values, endsAt: values.startsAt }, "staff") ?? "", /chronological/);
  assert.match(validateListing({ ...values, assetTag: null }, "staff") ?? "", /asset tag/);
  assert.match(validateListing({ ...values, isLot: true }, "staff") ?? "", /lots/);
  assert.match(validateListing({ ...values, photoKeys: ["uploads/another/file.jpg"] }, "staff") ?? "", /belong/);
});
