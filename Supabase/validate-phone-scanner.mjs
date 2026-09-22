import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const productionPath = "Supabase/index.html";
const testPath = "Supabase/test/index.html";
const productionSetupPath = "Supabase/pin-setup.html";
const testSetupPath = "Supabase/test/pin-setup.html";
const productionSource = readFileSync(productionPath, "utf8");
const testSource = readFileSync(testPath, "utf8");
const productionSetupSource = readFileSync(productionSetupPath, "utf8");
const testSetupSource = readFileSync(testSetupPath, "utf8");

function validateInlineJavaScript(source, label){
  const inlineScripts = [...source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map((match) => match[1])
    .filter((script) => script.trim());

  assert.equal(inlineScripts.length, 1, `${label} must contain exactly one inline application script.`);
  new Function(inlineScripts[0]);
}

function requireCommonContract(source, label){
  assert.match(source, /^<!DOCTYPE html>/, `${label} must begin with the HTML doctype.`);
  assert.match(source, /<\/html>\s*$/, `${label} must contain a closing HTML tag.`);
  assert.match(source, /const SUPABASE_URL = "https:\/\/[a-z0-9-]+\.supabase\.co";/, `${label} needs a Supabase project URL.`);
  assert.match(source, /const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_[A-Za-z0-9_-]+";/, `${label} needs a publishable browser key.`);
  assert.match(source, /mobile_validate_pin/);
  assert.match(source, /mobile_get_scanner_session/);
  assert.match(source, /mobile_revoke_scanner_session/);
  assert.match(source, /mobile_get_submitted_today_v2/);
  assert.match(source, /mobile_get_inventory_full_snapshot/);
  assert.match(source, /mobile_get_inventory_changes_since/);
  assert.match(source, /mobile_submit_product_v3/);
  assert.match(source, /mobile_update_submitted_product_v2/);
  assert.doesNotMatch(source, /sb_secret_/i, `${label} must never contain a Supabase secret key.`);
  assert.doesNotMatch(source, /service[_ -]?role/i, `${label} must never contain a service-role key.`);
  assert.doesNotMatch(source, /script\.google\.com\/macros/i, `${label} must never contain an Apps Script deployment URL.`);
  assert.doesNotMatch(source, /const APPS_SCRIPT_URL/i, `${label} must not restore direct browser-to-Apps-Script writes.`);
  validateInlineJavaScript(source, label);
}

function requireSetupContract(source, label){
  assert.match(source, /^<!DOCTYPE html>/, `${label} must begin with the HTML doctype.`);
  assert.match(source, /<meta name="referrer" content="no-referrer">/);
  assert.match(source, /<meta name="robots" content="noindex,nofollow">/);
  assert.match(source, /<h1>Create scanner profile<\/h1>/);
  assert.match(source, /\/functions\/v1\/phone-scanner-pin-setup/);
  assert.doesNotMatch(source, /sb_secret_/i, `${label} must never contain a Supabase secret key.`);
  assert.doesNotMatch(source, /service[_ -]?role/i, `${label} must never contain a service-role key.`);
  assert.doesNotMatch(source, /script\.google\.com\/macros/i, `${label} must never contain an Apps Script URL.`);
  validateInlineJavaScript(source, label);
}

requireCommonContract(productionSource, "Production scanner");
requireCommonContract(testSource, "TEST scanner");
requireSetupContract(productionSetupSource, "Production setup page");
requireSetupContract(testSetupSource, "TEST setup page");

const productionVersion = productionSource.match(
  /<div id="loginVersion">v(\d+\.\d+\.\d+)<\/div>/,
)?.[1];
assert.ok(productionVersion, "Production needs a stable version label.");
assert.ok(
  productionVersion === "1.0.0" || productionVersion === "1.1.0",
  "Production must be either the active v1.0.0 release or the approved v1.1.0 transition.",
);
assert.doesNotMatch(productionSource, /<div id="loginVersion">[^<]*-(?:test|beta|rc)\./i, "Production cannot use a prerelease label.");
assert.match(productionSource, /apple-mobile-web-app-title" content="Product Scanner"/);
assert.doesNotMatch(productionSource, /Product Scanner TEST/);
assert.match(productionSource, /const SUPABASE_URL = "https:\/\/ddupnibnfislntaltckq\.supabase\.co";/, "Production must target Production Supabase.");
assert.doesNotMatch(productionSource, /sdxgdrwvueeqjtimqzbw\.supabase\.co/, "Production cannot target TEST Supabase.");
if (productionVersion === "1.0.0") {
  assert.match(
    productionSource,
    /const ENABLE_SHEETS_DUAL_WRITE = false;/,
    "Active Production v1.0.0 must keep Google Sheets writes disabled.",
  );
  assert.match(
    productionSource,
    /const SHEETS_BRIDGE_URL = "";/,
    "Active Production v1.0.0 must not have a Sheets bridge target.",
  );
} else {
  assert.match(
    productionSource,
    /const ENABLE_SHEETS_DUAL_WRITE = true;/,
    "Production v1.1.0 must keep the approved temporary TEST Sheet compatibility route enabled.",
  );
  assert.match(
    productionSource,
    /const SHEETS_BRIDGE_URL = SUPABASE_URL \+ "\/functions\/v1\/phone-scanner-sheets-sync";/,
    "Production v1.1.0 must route Sheets compatibility writes through its own Production Supabase Edge Function.",
  );
}
assert.match(productionSource, /haggertysInventoryLookupCachePRODUCTION/);
assert.match(productionSource, /haggertysInventoryLookupVersionPRODUCTION/);
assert.match(productionSource, /haggertysInventoryLookupCacheSavedAtPRODUCTION/);
assert.match(productionSource, /haggertysPhotographerColorsPRODUCTION/);
assert.match(productionSource, /haggertysMobileSessionTokenPRODUCTION/);
assert.match(productionSource, /haggertysSheetsOutboxPRODUCTION/);
assert.match(productionSource, /scanPageStatePRODUCTION/);
assert.doesNotMatch(productionSource, /haggertys(?:Inventory|Photographer|Mobile|Sheets)[A-Za-z]*TEST/);
assert.doesNotMatch(productionSource, /scanPageStateTEST/);
assert.match(productionSource, /href="manifest\.json"/);
assert.match(productionSource, /href="icon-180\.png"/);
assert.match(productionSource, /src="haggertys-logo_white\.png"/);

assert.match(testSource, /<div id="loginVersion">v\d+\.\d+\.\d+-test\.\d+<\/div>/, "TEST needs a numbered TEST version label.");
assert.match(testSource, /apple-mobile-web-app-title" content="Product Scanner TEST"/);
assert.match(testSource, /const SUPABASE_URL = "https:\/\/sdxgdrwvueeqjtimqzbw\.supabase\.co";/, "TEST must target TEST Supabase.");
assert.doesNotMatch(testSource, /ddupnibnfislntaltckq\.supabase\.co/, "TEST cannot target Production Supabase.");
assert.match(testSource, /const ENABLE_SHEETS_DUAL_WRITE = true;/, "The accepted TEST compatibility write must remain enabled.");
assert.match(testSource, /const SHEETS_BRIDGE_URL = SUPABASE_URL \+ "\/functions\/v1\/phone-scanner-sheets-sync";/);
assert.match(testSource, /haggertysInventoryLookupCacheTEST/);
assert.match(testSource, /haggertysInventoryLookupVersionTEST/);
assert.match(testSource, /haggertysInventoryLookupCacheSavedAtTEST/);
assert.match(testSource, /haggertysPhotographerColorsTEST/);
assert.match(testSource, /haggertysMobileSessionTokenTEST/);
assert.match(testSource, /haggertysSheetsOutboxTEST/);
assert.match(testSource, /scanPageStateTEST/);
assert.doesNotMatch(testSource, /haggertys(?:Inventory|Photographer|Mobile|Sheets)[A-Za-z]*PRODUCTION/);
assert.doesNotMatch(testSource, /scanPageStatePRODUCTION/);
assert.match(testSource, /href="\.\.\/manifest\.json"/);
assert.match(testSource, /href="\.\.\/icon-180\.png"/);
assert.match(testSource, /src="\.\.\/haggertys-logo_white\.png"/);

assert.match(productionSetupSource, /<p class="small">v\d+\.\d+\.\d+<\/p>/);
assert.match(productionSetupSource, /const PRODUCTION_SUPABASE_URL = "https:\/\/ddupnibnfislntaltckq\.supabase\.co";/);
assert.match(productionSetupSource, /const PRODUCTION_PUBLISHABLE_KEY = "sb_publishable_[A-Za-z0-9_-]+";/);
assert.match(productionSetupSource, /PRODUCTION_SUPABASE_URL \+ "\/functions\/v1\/phone-scanner-pin-setup"/);
assert.doesNotMatch(productionSetupSource, /sdxgdrwvueeqjtimqzbw\.supabase\.co|TEST_SUPABASE_URL|TEST_PUBLISHABLE_KEY/);

assert.match(testSetupSource, /<p class="small">v\d+\.\d+\.\d+-test\.\d+<\/p>/);
assert.match(testSetupSource, /const TEST_SUPABASE_URL = "https:\/\/sdxgdrwvueeqjtimqzbw\.supabase\.co";/);
assert.match(testSetupSource, /const TEST_PUBLISHABLE_KEY = "sb_publishable_[A-Za-z0-9_-]+";/);
assert.match(testSetupSource, /TEST_SUPABASE_URL \+ "\/functions\/v1\/phone-scanner-pin-setup"/);
assert.doesNotMatch(testSetupSource, /ddupnibnfislntaltckq\.supabase\.co|PRODUCTION_SUPABASE_URL|PRODUCTION_PUBLISHABLE_KEY/);

const productionUrl = productionSource.match(/const SUPABASE_URL = "([^"]+)";/)?.[1];
const testUrl = testSource.match(/const SUPABASE_URL = "([^"]+)";/)?.[1];
const productionKey = productionSource.match(/const SUPABASE_PUBLISHABLE_KEY = "([^"]+)";/)?.[1];
const testKey = testSource.match(/const SUPABASE_PUBLISHABLE_KEY = "([^"]+)";/)?.[1];

assert.notEqual(productionUrl, testUrl, "TEST and Production Supabase URLs must be different.");
assert.notEqual(productionKey, testKey, "TEST and Production publishable keys must be different.");

console.log("Phone Scanner TEST and Production validation passed.");
console.log(
  productionVersion === "1.1.0"
    ? "Production v1.1.0 uses its own authenticated Edge Function for the approved temporary TEST Sheet route; browser targets and secrets remain isolated."
    : "Production v1.0.0 keeps Sheets writes disabled while the v1.1.0 transition files are prepared.",
);
