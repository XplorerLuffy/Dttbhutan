import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { isVerificationCode, verificationCode } from "../seoVerification";

const CODE = "aBcDeFgH12-3456_ijKLmnOP789";

describe("verificationCode", () => {
  it("keeps a bare code", () => assert.equal(verificationCode(CODE), CODE));
  it("strips the DNS-record prefix that broke the page tag", () => {
    assert.equal(verificationCode(`google-site-verification=${CODE}`), CODE);
    assert.equal(verificationCode(`  Google-Site-Verification = ${CODE}  `), CODE);
  });
  it("pulls the code out of a whole pasted tag", () => {
    assert.equal(verificationCode(`<meta name="google-site-verification" content="${CODE}" />`), CODE);
    assert.equal(verificationCode(`<meta name='msvalidate.01' content='${CODE}'>`), CODE);
  });
  it("drops quotes and spaces", () => assert.equal(verificationCode(` "${CODE}" `), CODE));
  it("leaves blank blank", () => assert.equal(verificationCode("   "), ""));
});

describe("isVerificationCode", () => {
  it("accepts real-looking codes and refuses bad pastes", () => {
    assert.equal(isVerificationCode(CODE), true);
    assert.equal(isVerificationCode("short"), false);
    assert.equal(isVerificationCode("has spaces in it here"), false);
    assert.equal(isVerificationCode(`"><script>alert(1)</script>`), false);
  });
});
