# paymatrix portfolio captures

Captured on 2026-10-20 from the local PayMatrix checkout at commit
`10f6f798eba9e2d6919e681fc720b947ed6e8bea`, also verified as GitHub `main`
on the capture date. These are real UI components populated with fictional data.
They demonstrate appearance, not production transactions or physical-device behavior.

- `dark-home.png`, `dark-expense-split.png`, `dark-members.png`: current
  Kotlin/Compose UI captured by the existing `ExperienceScreensTest` synthetic
  fixture on the PaymatrixUpiHandoff20261018 emulator, Android API 36.
- `upi-light.png`: current `UpiQrModal` captured by
  `UpiHandoffTest.lightDialogKeepsPaymentAndExplicitConfirmationReachable`.
  The recipient is a test placeholder. No UPI app was opened and no settlement
  was submitted. Both selected capture tests passed against 2.5.0-dev.
- `web-home.png`, `web-scanner.png`: current React `Dashboard`, `Header`,
  `BottomNav`, and `BillScannerModal`, rendered by Vite at a 412 × 915 browser
  viewport. An isolated local fixture supplies fictional Redux state and stubs
  `expenseService.getSummary`; it does not sign in or write financial data.
  The scanner was opened through its real Scan receipt button. No bill was sent
  to the OCR service. These captures show current local source, not a verified
  deployed session.

Raw screenshots are preserved. `scripts/generate-paymatrix-frames.mjs` only
crops the Android test harness label (top 94 pixels), scales screenshots, and
places them beside explanatory text. App text and financial values are never
painted over. The frame footers explicitly label fictional demo data and the
web/Android surface. The UPI frame is a mobile dialog capture.

To regenerate all portfolio assets:

```powershell
node scripts/generate-paymatrix-frames.mjs
npm.cmd run images
npm.cmd run build
```

The outputs cover homepage preview, project thumbnail, carousel, responsive
case-study frames, PNG fallbacks, and the project Open Graph image.
