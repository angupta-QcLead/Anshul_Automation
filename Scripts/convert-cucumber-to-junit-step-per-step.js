// scripts/convert-cucumber-to-junit-step-per-step.js
const fs = require("fs");
const path = require("path");

const argv = process.argv.slice(2);
const inPath = argv[0] || path.join(process.cwd(), "results", "cucumber.json");
const outPath = argv[1] || path.join(process.cwd(), "results", "cucumber.xml");

function escapeXmlAttr(s) {
  if (s === undefined || s === null) return "";
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function normalizeForXml(s) {
  if (s === undefined || s === null) return "";
  return String(s).replace(/\\/g, "/");
}

function cdataSafe(s) {
  if (s === undefined || s === null) return "";
  const str = String(s);
  return "<![CDATA[" + str.replace(/]]>/g, "]]]]><![CDATA[>") + "]]>";
}

if (!fs.existsSync(inPath)) {
  console.error(`Input file not found: ${inPath}`);
  process.exit(1);
}

let raw;
try {
  raw = fs.readFileSync(inPath, "utf8");
} catch (err) {
  console.error("Failed to read input file:", err.message);
  process.exit(1);
}

let features = [];
try {
  features = JSON.parse(raw);
  if (!Array.isArray(features)) features = [features];
} catch (err) {
  console.error("Failed to parse cucumber JSON:", err.message);
  process.exit(1);
}

let totalTests = 0;
let totalFailures = 0;
let suitesXml = "";

features.forEach((feature) => {
  const featureNameRaw = feature.name || feature.uri || "Unnamed Feature";
  const featureName = normalizeForXml(featureNameRaw);
  const elements = feature.elements || [];
  const suiteTestCases = [];

  elements.forEach((element) => {
    if (!element || !element.type) return;
    const isScenario =
      element.type === "scenario" ||
      element.type === "scenario_outline" ||
      element.keyword === "Scenario";
    if (!isScenario) return;

    const scenarioNameRaw = element.name || "Unnamed Scenario";
    const scenarioName = normalizeForXml(scenarioNameRaw);
    const featureUri = normalizeForXml(feature.uri || featureNameRaw);
    const scenarioLine = (element.location && element.location.line) || element.line || "";
    const scenarioId = scenarioLine ? `${featureUri}:${scenarioLine}` : featureUri;

    const steps = element.steps || [];
    steps.forEach((step) => {
      totalTests++;
      const stepTextRaw = `${step.keyword || ""}${step.name || ""}`.trim();
      const stepText = normalizeForXml(stepTextRaw);
      const result = step.result || {};
      const status = (result.status || "unknown").toLowerCase();
      const error = result.error_message || result.message || "";
      let duration = 0;
      if (result && result.duration) {
        const d = Number(result.duration);
        if (!Number.isNaN(d)) {
          // cucumber durations often in nanoseconds
          duration = d / 1e9;
        }
      }

      // classname contains feature+scenario so you can still group in Testmo by classname
      const classname = `${scenarioId}::${escapeXmlAttr(scenarioName)}`;

      let tc = `    <testcase classname="${escapeXmlAttr(classname)}" name="${escapeXmlAttr(stepText)}" time="${duration.toFixed(3)}">\n`;

      if (status === "failed" || status === "error") {
        totalFailures++;
        const msg = escapeXmlAttr(error || "Step failed");
        // put the step text into the failure message attribute, and the stack/trace in CDATA
        tc += `      <failure message="${escapeXmlAttr(stepText)}">${cdataSafe(msg)}</failure>\n`;
      } else if (status === "skipped" || status === "pending" || status === "undefined") {
        // represent skipped as <skipped/>
        tc += `      <skipped message="${escapeXmlAttr(status)}"/>\n`;
      }

      // system-out contains some context: scenario name + step status + any error text
      const systemOutContent = `Feature: ${featureNameRaw}\nScenario: ${scenarioNameRaw}\nStep: ${stepTextRaw}\nStatus: ${status}${error ? "\n\n" + error : ""}`;
      tc += `      <system-out>${cdataSafe(systemOutContent)}</system-out>\n`;
      tc += `    </testcase>\n`;

      suiteTestCases.push(tc);
    });
  });

  const failuresInSuite = suiteTestCases.filter((s) => s.includes("<failure")).length;
  const suiteXml = `  <testsuite name="${escapeXmlAttr(featureName)}" tests="${suiteTestCases.length}" failures="${failuresInSuite}">\n${suiteTestCases.join("")}  </testsuite>\n`;
  suitesXml += suiteXml;
});

const finalXml = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites tests="${totalTests}" failures="${totalFailures}">\n${suitesXml}</testsuites>\n`;

fs.writeFileSync(outPath, finalXml, { encoding: "utf8" });
console.log(`Wrote JUnit XML -> ${outPath} (tests: ${totalTests}, failures: ${totalFailures})`);
process.exit(0);
