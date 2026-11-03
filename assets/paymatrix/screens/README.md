# paymatrix portfolio captures

The active screenshots come from the accepted November 2, 2026 UI review
recorded in PayMatrix commit `73111dd` under `native-android/docs/web-parity/`.
They use the isolated fictional Goa weekend fixture.

- `android-group.png` is the native Compose group panel from
  `web-native-comparison.jpg`.
- `android-home.png` and `android-insights.png` are the dashboard and insights
  panels from `phone-confirmation.jpg`.
- `android-scan.png`, `android-split.png`, and `android-settle.png` are the
  Scan bill, expense detail, and Settle up panels from `phone-confirmation.jpg`.

The panels were cropped out of the review sheets to remove their labels.
The portfolio generator only scales them and adds surrounding copy. The
screens are evidence of the reviewed interface with demo data; they do not
show a production transaction, physical-device test, or Play Store release.
Older raw captures remain here for reference.

To regenerate the homepage previews, thumbnail, case-study frames, and
social image:

```powershell
node scripts/generate-paymatrix-frames.mjs
npm.cmd run images
npm.cmd run build
```
