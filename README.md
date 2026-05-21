# Razer Naga V2 Pro Configurator

Unofficial, static browser-only WebHID configurator for validated Razer Naga V2
Pro on-board side-button bindings.

This project is not affiliated with, endorsed by, or supported by Razer. Razer
and Naga are used only to identify the compatible mouse model.

## Scope

- Runs from static HTML/CSS/JS; no backend is required.
- Talks to the mouse through `navigator.hid` after an explicit browser device
  picker grant.
- Exposes the 2-button side plate's expected rear/front IDs: `0x04` and
  `0x05`.
- Exposes the validated 6-button side plate: `side1=0x50` through
  `side6=0x55`.
- Exposes the 12-button side plate protocol range: `pad1=0x40` through
  `pad12=0x4b`.
- Provides guarded presets for forward/back on the 2-button plate,
  `F13`-`F16` plus forward/back on the 6-button plate, and a 12-button
  compatibility preset that avoids `F20`-`F22`.
- Starts every button row as `Keep current`; presets only load draft changes
  after the user explicitly clicks the preset button.
- Does not auto-detect the mounted side plate. The known safe readback command
  reads stored button functions, not the currently installed physical plate, so
  the user must select the mounted plate before reading or writing.
- Requires a mounted-plate confirmation and an on-board write confirmation
  before any write. Before writing, the page reads the selected plate and keeps
  a local JSON backup that can be exported or written back to the mouse.
- Supports normal on-board button functions for keyboard keys, mouse buttons,
  disabled buttons, double-click, media/consumer controls, DPI/profile cycling,
  and scroll-wheel mode toggle. Hypershift and macros are intentionally not in
  this first normal-binding slice.

The 2-button storage range and physical press order are validated: the
front/forward button is `0x05`, and the rear/back button is `0x04`. The
12-button storage range, write path and physical button order are validated.

## Local Smoke Test

```bash
./packaging/scripts/verify-naga-configurator-site.sh
```

For a manual hardware test:

```bash
python3 -m http.server 8000 --directory apps/naga-configurator
```

Then open `http://127.0.0.1:8000/` in Chromium, Chrome or Edge, connect the
mouse, read the mounted side plate, write a harmless test binding, and verify
readback plus a physical button press.

## Browser Requirements

WebHID requires a secure context. GitHub Pages HTTPS and localhost are valid
contexts. Linux users may still need udev/hidraw permissions so Chromium can
open the selected Razer HID interface.

The page performs a local compatibility check. Unsupported browsers get a
prominent block notice and platform-specific recommendations. On Linux and
Windows, Chromium is recommended alongside Chrome because it keeps the same
WebHID capability with less Google integration.

## GitHub Pages Release Gate

Pulls and pushes run the static configurator smoke test through the Pages
workflow. Deployment is manual: run `Deploy Naga Configurator` with
`hardware_validated=true` only after the manual hardware test above has passed.
This keeps CI from publishing a change that only passed browser simulation but
was never validated against the real Naga feature-report path.
