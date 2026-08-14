# Calibration Final Review Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close the final backend review findings for calibration localization, hostile notes, deterministic QR targets, and shared HTML/PDF presentation.

**Architecture:** Keep `CalibrationReportRenderer` as the shared presentation boundary for PDF and HTML verification, export its notes allowlist sanitizer, and add small pure API-contract helpers for response sanitization, QR URL selection, and localized messages. `CalibrationController` will sanitize at both write and JSON response boundaries while preserving endpoint methods, status codes, payload field names, verification UUID paths, and PDF behavior.

**Tech Stack:** TypeScript 4.9, Express 4, Jest/ts-jest, sanitize-html, qrcode, Puppeteer.

## Global Constraints

- Work only in `/root/apps/service-iot` except the requested final report in the frontend ledger directory.
- Preserve endpoint methods, JSON field names, status codes, calculation rules, database schema, generated sample values, and verification UUID paths.
- Use literal golden expectations matching frontend commit `1571c8f` for dates, numbers, standards, places, parameter terminology, and Indonesian copy.
- Write each behavior test first, run it to observe the expected failure, then implement the smallest passing change.
- Commit backend changes with English commit messages.

---

### Task 1: Shared Renderer Golden Contract

**Files:**
- Modify: `src/helpers/CalibrationReportRenderer.test.ts`
- Modify: `src/helpers/CalibrationReportRenderer.ts`
- Modify: `src/views/Calibration_Report.html`

**Interfaces:**
- Produces: `formatIndonesianDate(value)`, `formatCalibrationDateRange(start, end)`, `formatReportNumberValue(value)`, `formatCalibrationStandard(name, value, parameterName, unit)`, `formatReportPlace(value)`, `formatCalibrationParameterName(value)`, and `renderCalibrationReportHtml(template, input)`.

- [ ] Add literal failing golden tests for same-year cross-month range (`10 Agustus–2 September 2026`), cross-year range, invalid `2026-02-31` fallback, `Date` local-calendar handling, null standard fallback with CRM/unit rules, prefix-only place removal with title casing, coefficient comma/two-decimal output, scientific labels, and Indonesian QR alt text.
- [ ] Run `npm test -- --runInBand src/helpers/CalibrationReportRenderer.test.ts` and confirm failures name the missing behavior.
- [ ] Implement strict calendar validation and frontend-compatible formatting without normalizing invalid dates; export the focused formatter helpers and keep all HTML text escaped at render time.
- [ ] Render `Amonia (NH3-N)`, `Nitrat (NO3-N)`, and `Nitrit (NO2-N)` in parameter and water-sample labels, and change image alternatives to professional Indonesian.
- [ ] Re-run the focused renderer tests and keep them green.

### Task 2: Notes Defense in Depth

**Files:**
- Modify: `src/helpers/CalibrationReportRenderer.test.ts`
- Create: `src/helpers/CalibrationApiContract.test.ts`
- Create: `src/helpers/CalibrationApiContract.ts`
- Modify: `src/helpers/CalibrationReportRenderer.ts`
- Modify: `src/controllers/CalibrationController.ts`

**Interfaces:**
- Produces: exported `sanitizeCalibrationNotes(notes)` using the renderer allowlist and `sanitizeCalibrationRecordNotes(record)` for immutable JSON-boundary output.

- [ ] Add failing sanitizer tests using scripts, event attributes, links, styles, and allowed editor tags; assert both direct write sanitization and immutable API response sanitization without a live database.
- [ ] Run the two focused helper suites and confirm the new assertions fail because the sanitizer/response helper is not exported.
- [ ] Export the single allowlist sanitizer, use it before storing `notes`, and apply the record helper to calibration list/detail/update/verification JSON responses so legacy hostile stored notes cannot reach clients.
- [ ] Re-run both focused helper suites and confirm all hostile content is removed while allowed formatting survives.

### Task 3: Deterministic QR Configuration

**Files:**
- Modify: `src/helpers/CalibrationApiContract.test.ts`
- Modify: `src/helpers/CalibrationApiContract.ts`
- Modify: `src/controllers/CalibrationController.ts`
- Modify: `docs/CALIBRATION_API_FRONTEND.md`

**Interfaces:**
- Produces: `getVerificationUrl(req, verificationUuid, env?)`, selecting only authoritative `PUBLIC_CALIBRATION_FRONTEND_URL` or compatibility `PUBLIC_CALIBRATION_BASE_URL`.

- [ ] Add failing tests with hostile `Origin`, `Referer`, forwarded-host, and Host headers, plus missing, local, private, malformed, and valid configured targets.
- [ ] Run `npm test -- --runInBand src/helpers/CalibrationApiContract.test.ts` and confirm request-derived URLs still fail the new contract.
- [ ] Move URL construction to the pure helper, reject missing/non-public configuration with an Indonesian internal error, and remove every request-derived fallback.
- [ ] Update API documentation with precedence, accepted public HTTP(S) requirements, exact paths, and the Indonesian configuration error.
- [ ] Re-run the helper suite and confirm hostile headers cannot alter the literal configured URLs.

### Task 4: Indonesian Calibration API Messages and Authorization

**Files:**
- Modify: `src/helpers/CalibrationApiContract.test.ts`
- Modify: `src/helpers/CalibrationApiContract.ts`
- Create: `src/middlewares/jwtMiddleware.test.ts`
- Modify: `src/middlewares/jwtMiddleware.ts`
- Modify: `src/routes/calibration/index.ts`
- Modify: `src/controllers/CalibrationController.ts`
- Modify: `docs/CALIBRATION_API_FRONTEND.md`

**Interfaces:**
- Produces: `CALIBRATION_MESSAGES`, `CALIBRATION_AUTH_MESSAGES`, and optional localized message overrides in `JwtMiddleware(access, messages?)` while preserving default behavior for unrelated routes.

- [ ] Add failing literal tests for required fields, invalid range, not found, draft-only actions, incomplete standards, calculation failure, approval state, verification absence, successes, and calibration-route authorization responses.
- [ ] Run the focused API-contract and JWT middleware tests and confirm the English strings fail.
- [ ] Replace all user-exposed `CalibrationController` strings with the shared professional Indonesian messages and pass localized authorization messages only from calibration routes.
- [ ] Update every response/error example and table in the calibration API documentation.
- [ ] Re-run the focused tests and confirm status/error-code behavior is unchanged.

### Task 5: Complete Verification and Commit

**Files:**
- Modify: `docs/CALIBRATION_API_FRONTEND.md`
- Create outside backend only as explicitly requested: `/root/apps/oms-fastpec/.superpowers/sdd/2026-08-14-lokalisasi-modul-kalibrasi/final-fix-backend-report.md`

- [ ] Run focused RED/GREEN suites, then all calibration tests with `npm test -- --runInBand --testPathPatterns='Calibration|jwtMiddleware'`.
- [ ] Run the full suite using `npm test -- --runInBand`.
- [ ] Run `npm run build` and confirm TypeScript compilation plus view copying succeeds.
- [ ] Review `git diff --check`, the complete backend diff, remaining English user-visible calibration strings, renderer call sites, and QR request-header references.
- [ ] Commit backend fixes with an English commit message.
- [ ] Write the exact final report containing status, commits, tests, concerns, and verification evidence.
