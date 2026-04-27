import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isSelfOrCoach } from "./auth";

describe("auth helpers", () => {
  it("allows self access for user role", () => {
    assert.equal(isSelfOrCoach({ userId: "U001", role: "user" }, "U001"), true);
  });

  it("blocks other user access for user role", () => {
    assert.equal(isSelfOrCoach({ userId: "U001", role: "user" }, "U999"), false);
  });

  it("allows coach access across users", () => {
    assert.equal(isSelfOrCoach({ userId: "C001", role: "coach" }, "U999"), true);
  });
});
