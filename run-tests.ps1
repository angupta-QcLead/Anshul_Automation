<#
Dynamic run-tests.ps1 (updated)
- Does NOT hard-abort when cucumber fails: it captures exit code, converts JSON -> JUnit, submits to Testmo, then exits with original cucumber exit code.
- Preserves your original CLI arguments and behavior (Features, FeatureLine, Tag, ScenarioName, Attachments).
#>

param(
  [string] $ProjectId    = "14",
  [string] $InstanceUrl  = "https://rightsline.testmo.net",
  [string[]] $Features   = @(),     # list of feature file paths, e.g. tests/features/ScopeA.feature
  [string] $FeatureLine  = "",      # single "file:line" (runs one scenario exactly)
  [string] $ScenarioName = "",      # regex for --name (Cucumber)
  [string] $Tag          = "",      # cucumber tag expression e.g. "@smoke"
  [string] $StepsGlob    = "tests/steps/**/*.js",
  [string] $ResultsDir   = "results",
  [string] $RunName      = "Local Cucumber run",
  [switch] $UploadAttachments       # upload results/attachments/* if present
)

# --- sanity checks ---
if (-not $env:TESTMO_TOKEN) {
  Write-Error "TESTMO_TOKEN environment variable is not set. Set it and re-run, e.g.: `$env:TESTMO_TOKEN = 'testmo_api_xxx'"
  exit 1
}

if (-not $Features -and -not $FeatureLine -and -not $ScenarioName -and -not $Tag) {
  Write-Error "No target provided. Use -Features, -FeatureLine, -ScenarioName or -Tag."
  exit 1
}

# ensure results dir
if (-not (Test-Path $ResultsDir)) { New-Item -ItemType Directory -Path $ResultsDir | Out-Null }

# cleanup previous outputs
Get-ChildItem -Path $ResultsDir -Filter "*cucumber*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue
Get-ChildItem -Path $ResultsDir -Filter "*test-results*" -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# build cucumber args
$cukeArgs = @()

if ($FeatureLine) {
  $cukeArgs += $FeatureLine
} elseif ($Features.Count -gt 0) {
  foreach ($f in $Features) { if ($f -ne "") { $cukeArgs += $f } }
} else {
  # default features folder if nothing else selected
  $cukeArgs += "tests/features"
}

$cukeArgs += "--require"
$cukeArgs += $StepsGlob
$cukeArgs += "--format"
$cukeArgs += "json:$ResultsDir/cucumber.json"

if ($ScenarioName) {
  $cukeArgs += "--name"
  $cukeArgs += $ScenarioName
}
if ($Tag) {
  $cukeArgs += "--tags"
  $cukeArgs += $Tag
}

# echo final command for confirmation
Write-Host "Cucumber command:" ("npx " + ($cukeArgs -join " "))

# 1) Run cucumber (use call operator so npx.cmd runs on Windows)
Write-Host "Running cucumber..."
& npx @cukeArgs
$cukeExit = $LASTEXITCODE
Write-Host "Cucumber finished with exit code: $cukeExit"

# 2) Convert JSON -> scenario-level JUnit XML
$jsonPath = Join-Path $ResultsDir "cucumber.json"
$xmlPath  = Join-Path $ResultsDir "test-results.xml"

if (-not (Test-Path $jsonPath)) {
  Write-Warning "Expected cucumber json not found at $jsonPath - will create an empty results file for submission."
  "<testsuites tests='0' failures='0'></testsuites>" | Out-File -FilePath $xmlPath -Encoding utf8
} else {
  Write-Host "Converting JSON -> JUnit XML..."
  if (Test-Path "tools/cucumber-to-junit.js") {
    node tools/cucumber-to-junit.js $jsonPath $xmlPath
  } else {
    # fallback: use cucumber-junit via npx (step-level conversion)
    try {
      Get-Content $jsonPath -Raw | npx cucumber-junit | Out-File -FilePath $xmlPath -Encoding utf8
    } catch {
      Write-Warning "Fallback conversion failed: $_"
      # produce minimal xml instead of failing entirely
      "<testsuites tests='0' failures='0'></testsuites>" | Out-File -FilePath $xmlPath -Encoding utf8
    }
  }
}

if (-not (Test-Path $xmlPath)) {
  Write-Warning "JUnit XML not created at $xmlPath; creating minimal xml to allow submission."
  "<testsuites tests='0' failures='0'></testsuites>" | Out-File -FilePath $xmlPath -Encoding utf8
} else {
  Write-Host "Created $xmlPath"
}

# 3) Submit to Testmo (always attempt, even if cucumber failed)
$timestamp = (Get-Date -Format 'yyyy-MM-dd_HHmmss')
$runNameFull = "$RunName - $timestamp"
Write-Host "Submitting results to Testmo (project $ProjectId) as '$runNameFull'..."

$testmoArgs = @(
  "automation:run:submit",
  "--source", "cucumber-js",
  "--name", $runNameFull,
  "--project-id", $ProjectId,
  "--instance", $InstanceUrl,
  "--results", $xmlPath
)

# attachments
if ($UploadAttachments) {
  $attachDir = Join-Path $ResultsDir "attachments"
  if (Test-Path $attachDir) {
    $attachPattern = Join-Path $attachDir "*"
    $testmoArgs += "--attachments"
    $testmoArgs += $attachPattern
    Write-Host "Will upload attachments from: $attachPattern (if present)"
  } else {
    Write-Host "No attachments directory found; skipping attachment upload."
  }
}

# ensure token is available in env for the child process
# testmo CLI can accept --token but we leave token in env for security (uncomment next line to pass token explicitly)
# $testmoArgs += "--token"; $testmoArgs += $env:TESTMO_TOKEN

# execute testmo (call operator so Windows executes correct binary)
& testmo @testmoArgs
$tmExit = $LASTEXITCODE
if ($tmExit -ne 0) {
  Write-Warning "testmo CLI returned exit code $tmExit"
} else {
  Write-Host "Testmo submission complete (exit $tmExit)"
}

# 4) Exit with original cucumber code so CI knows pass/fail
Write-Host "Exiting with original cucumber exit code: $cukeExit"
exit $cukeExit
