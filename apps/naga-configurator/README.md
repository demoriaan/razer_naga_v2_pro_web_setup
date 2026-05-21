# Razer Naga V2 Pro Web Setup

Unofficial browser-only WebHID setup tool for Razer Naga V2 Pro on-board
side-button bindings.

This project is not affiliated with, endorsed by, or supported by Razer. Razer
and Naga are used only to identify the compatible mouse model.

## Use Online

Open the latest GitHub Pages deployment:

<https://demoriaan.github.io/razer_naga_v2_pro_web_setup/>

## Preview

![Desktop preview](../../docs/previews/naga-configurator.png)

<details>
<summary>Mobile layout preview</summary>

Mobile browsers are not a supported WebHID target for this hardware workflow.
This screenshot only checks that the page layout remains readable on narrow
screens.

![Mobile preview](../../docs/previews/naga-configurator-mobile.png)

</details>

## Browser Compatibility

This tool needs WebHID. That means it only works in compatible desktop
Chromium-family browsers over HTTPS or localhost.

Known good targets:

- Chromium desktop
- Google Chrome desktop
- Microsoft Edge desktop
- Opera desktop, if WebHID is enabled in that build

Known unsupported targets:

- Firefox
- Safari
- iOS/iPadOS browsers
- Android browsers for this desktop HID workflow
- Opening `index.html` directly from `file://`

Linux users may also need udev/hidraw permissions so the browser can open the
Razer HID interface. Close VM USB passthrough, Synapse-in-VM sessions, and other
tools that might own the receiver before connecting from the browser.

## How To Use

1. Open the online tool in Chromium, Chrome, or Edge.
2. Connect the Razer Naga V2 Pro receiver or cable and power on the mouse.
3. Click `Connect Naga` and select the Razer Naga V2 Pro in the browser device
   picker.
4. Select the side plate that is physically mounted: 2-button, 6-button, or
   12-button.
5. Click `Read current settings` and inspect the readback. This also creates a
   local in-tab backup for the selected plate.
6. Leave rows as `Keep current`, choose individual bindings, or click the
   recommended preset for the selected plate.
7. Confirm that the mounted side plate matches the selected layout.
8. Confirm that you understand the tool writes to the mouse's on-board profile.
9. Click `Write selected bindings`.
10. Test the physical buttons in your target application.

If a write produces the wrong result, use `Write backup back` in the same tab to
restore the latest local backup for the selected side plate. `Export latest
backup` saves that backup as JSON for inspection or record keeping.

## Supported Side Plates

- **2-button plate:** front/forward is `0x05`, rear/back is `0x04`; the default
  preset maps them to forward/back.
- **6-button plate:** buttons `0x50`-`0x55`; the default preset maps side 1-4
  to `F13`-`F16` and side 5-6 to forward/back.
- **12-button plate:** buttons `0x40`-`0x4b`; the compatibility preset uses
  `F13`-`F19`, `Ctrl+Shift+Alt+8/9/0`, and `F23`-`F24`, avoiding `F20`-`F22`.

The mouse does not expose a validated side-plate detection report yet. Always
select the mounted side plate manually before reading or writing.

## What It Can Set

- Keyboard keys, including `F13`-`F24`
- Optional modifiers: none, Ctrl, Shift, Alt, Ctrl+Shift+Alt, Meta
- Mouse clicks and wheel directions
- Forward/back
- Disabled buttons
- Double-click
- Media controls
- DPI/profile cycle actions
- Scroll-wheel mode toggle

Hypershift and macros are intentionally not included in this normal-binding
release.

## Privacy And Safety

- Static HTML/CSS/JS only; no backend is required.
- No analytics, telemetry, CDN, or third-party runtime requests.
- HID reads and writes stay inside the browser tab.
- The tool writes to the mouse's on-board profile only after explicit
  confirmation.
- A local backup is read before writes so the current tab can write it back.

## Local Development

From the repository root:

```bash
./packaging/scripts/verify-naga-configurator-site.sh
```

For manual hardware testing:

```bash
python3 -m http.server 8000 --directory apps/naga-configurator
```

Then open `http://127.0.0.1:8000/` in a compatible browser, connect the mouse,
read the mounted side plate, write a harmless test binding, and verify readback
plus a physical button press.

## Release Gate

Pushes run the static smoke test. The GitHub Pages deployment is manual and
requires `hardware_validated=true` after a real Naga read/write/readback test.
