(() => {
  "use strict";

  const REPORT_LEN = 90;
  const NAGA_VENDOR_ID = 0x1532;
  const NAGA_PRODUCT_IDS = [0x00a7, 0x00a8];
  const PROFILE_DEFAULT = 0x01;
  const HYPERSHIFT_NORMAL = 0x00;
  const FEATURE_REPORT_ID = 0x00;
  const WRITE_SETTLE_MS = 140;
  const VERIFY_RETRY_MS = 250;
  const VERIFY_ATTEMPTS = 6;
  const ACTIVE_PLATE_STORAGE_KEY = "naga-v2-pro-active-plate";
  const SIDE_PLATES = {
    naga2: {
      id: "naga2",
      label: "2-button side plate",
      status: "validated",
      buttonRange: "Buttons 0x04-0x05",
      presetLabel: "Apply forward/back preset",
      validation:
        "Readback and physical press capture validated: front/forward is 0x05, rear/back is 0x04.",
      buttons: [
        { id: "naga2Front", label: "Front / Forward", code: 0x05, preset: "mouse:forward" },
        { id: "naga2Rear", label: "Rear / Back", code: 0x04, preset: "mouse:backward" },
      ],
    },
    naga6: {
      id: "naga6",
      label: "6-button side plate",
      status: "validated",
      buttonRange: "Buttons 0x50-0x55",
      presetLabel: "Apply F13-F16 + forward/back",
      validation:
        "Readback, write, power-cycle persistence, F13-F16 and forward/back buttons validated.",
      buttons: [
        { id: "side1", label: "Side 1", code: 0x50, preset: "F13" },
        { id: "side2", label: "Side 2", code: 0x51, preset: "F14" },
        { id: "side3", label: "Side 3", code: 0x52, preset: "F15" },
        { id: "side4", label: "Side 4", code: 0x53, preset: "F16" },
        { id: "side5", label: "Side 5", code: 0x54, preset: "mouse:forward" },
        { id: "side6", label: "Side 6", code: 0x55, preset: "mouse:backward" },
      ],
    },
    naga12: {
      id: "naga12",
      label: "12-button side plate",
      status: "validated",
      buttonRange: "Buttons 0x40-0x4b",
      presetLabel: "Apply compatibility preset",
      validation:
        "Readback, writes and physical button order validated. The default preset avoids F20-F22 because those keys can be unreliable in target apps.",
      buttons: [
        { id: "pad1", label: "Pad 1", code: 0x40, preset: "F13" },
        { id: "pad2", label: "Pad 2", code: 0x41, preset: "F14" },
        { id: "pad3", label: "Pad 3", code: 0x42, preset: "F15" },
        { id: "pad4", label: "Pad 4", code: 0x43, preset: "F16" },
        { id: "pad5", label: "Pad 5", code: 0x44, preset: "F17" },
        { id: "pad6", label: "Pad 6", code: 0x45, preset: "F18" },
        { id: "pad7", label: "Pad 7", code: 0x46, preset: "F19" },
        {
          id: "pad8",
          label: "Pad 8",
          code: 0x47,
          preset: "8",
          presetModifier: "ctrl+shift+alt",
        },
        {
          id: "pad9",
          label: "Pad 9",
          code: 0x48,
          preset: "9",
          presetModifier: "ctrl+shift+alt",
        },
        {
          id: "pad10",
          label: "Pad 10",
          code: 0x49,
          preset: "0",
          presetModifier: "ctrl+shift+alt",
        },
        { id: "pad11", label: "Pad 11", code: 0x4a, preset: "F23" },
        { id: "pad12", label: "Pad 12", code: 0x4b, preset: "F24" },
      ],
    },
  };
  const KEYS = {
    A: 0x04,
    B: 0x05,
    C: 0x06,
    D: 0x07,
    E: 0x08,
    F: 0x09,
    G: 0x0a,
    H: 0x0b,
    I: 0x0c,
    J: 0x0d,
    K: 0x0e,
    L: 0x0f,
    M: 0x10,
    N: 0x11,
    O: 0x12,
    P: 0x13,
    Q: 0x14,
    R: 0x15,
    S: 0x16,
    T: 0x17,
    U: 0x18,
    V: 0x19,
    W: 0x1a,
    X: 0x1b,
    Y: 0x1c,
    Z: 0x1d,
    1: 0x1e,
    2: 0x1f,
    3: 0x20,
    4: 0x21,
    5: 0x22,
    6: 0x23,
    7: 0x24,
    8: 0x25,
    9: 0x26,
    0: 0x27,
    F1: 0x3a,
    F2: 0x3b,
    F3: 0x3c,
    F4: 0x3d,
    F5: 0x3e,
    F6: 0x3f,
    F7: 0x40,
    F8: 0x41,
    F9: 0x42,
    F10: 0x43,
    F11: 0x44,
    F12: 0x45,
    F13: 0x68,
    F14: 0x69,
    F15: 0x6a,
    F16: 0x6b,
    F17: 0x6c,
    F18: 0x6d,
    F19: 0x6e,
    F20: 0x6f,
    F21: 0x70,
    F22: 0x71,
    F23: 0x72,
    F24: 0x73,
  };
  const KEY_NAMES = Object.fromEntries(
    Object.entries(KEYS).map(([name, code]) => [code, name]),
  );
  const MODIFIERS = {
    none: 0x00,
    ctrl: 0x01,
    shift: 0x02,
    alt: 0x04,
    "ctrl+shift+alt": 0x07,
    meta: 0x08,
  };
  const MODIFIER_NAMES = {
    0x00: "none",
    0x01: "LCTRL",
    0x02: "LSHIFT",
    0x04: "LALT",
    0x07: "LCTRL+LSHIFT+LALT",
    0x08: "LGUI",
  };
  const STATUS_NAMES = {
    0x00: "new",
    0x01: "busy",
    0x02: "successful",
    0x03: "failure",
    0x04: "timeout",
    0x05: "not-supported",
  };
  const FN_CLASSES = {
    0x00: "disabled",
    0x01: "mouse",
    0x02: "keyboard",
    0x06: "dpi-switch",
    0x07: "profile-switch",
    0x0a: "consumer",
    0x0b: "double-click",
    0x0c: "hypershift-toggle",
    0x0d: "keyboard-turbo",
    0x12: "scroll-mode-toggle",
  };
  const MOUSE_NAMES = {
    0x01: "left",
    0x02: "right",
    0x03: "middle",
    0x04: "backward",
    0x05: "forward",
    0x09: "wheel-up",
    0x0a: "wheel-down",
    0x68: "wheel-left",
    0x69: "wheel-right",
  };
  const MOUSE_FUNCTIONS = {
    "mouse:left": {
      name: "Mouse: Left click",
      fnClass: 0x01,
      data: [0x01],
    },
    "mouse:right": {
      name: "Mouse: Right click",
      fnClass: 0x01,
      data: [0x02],
    },
    "mouse:middle": {
      name: "Mouse: Middle click",
      fnClass: 0x01,
      data: [0x03],
    },
    "mouse:forward": {
      name: "Mouse: Forward",
      fnClass: 0x01,
      data: [0x05],
    },
    "mouse:backward": {
      name: "Mouse: Back",
      fnClass: 0x01,
      data: [0x04],
    },
    "mouse:wheel-up": {
      name: "Mouse: Wheel up",
      fnClass: 0x01,
      data: [0x09],
    },
    "mouse:wheel-down": {
      name: "Mouse: Wheel down",
      fnClass: 0x01,
      data: [0x0a],
    },
    "mouse:wheel-left": {
      name: "Mouse: Wheel left",
      fnClass: 0x01,
      data: [0x68],
    },
    "mouse:wheel-right": {
      name: "Mouse: Wheel right",
      fnClass: 0x01,
      data: [0x69],
    },
  };
  const EXTRA_FUNCTIONS = {
    disabled: {
      name: "Disable button",
      fnClass: 0x00,
      data: [],
    },
    "double:left": {
      name: "Double click: Left",
      fnClass: 0x0b,
      data: [0x01],
    },
    "double:right": {
      name: "Double click: Right",
      fnClass: 0x0b,
      data: [0x02],
    },
    "double:middle": {
      name: "Double click: Middle",
      fnClass: 0x0b,
      data: [0x03],
    },
    "media:play-pause": {
      name: "Media: Play/Pause",
      fnClass: 0x0a,
      data: [0x00, 0xcd],
    },
    "media:next": {
      name: "Media: Next track",
      fnClass: 0x0a,
      data: [0x00, 0xb5],
    },
    "media:previous": {
      name: "Media: Previous track",
      fnClass: 0x0a,
      data: [0x00, 0xb6],
    },
    "media:stop": {
      name: "Media: Stop",
      fnClass: 0x0a,
      data: [0x00, 0xb7],
    },
    "media:mute": {
      name: "Media: Mute",
      fnClass: 0x0a,
      data: [0x00, 0xe2],
    },
    "media:volume-up": {
      name: "Media: Volume up",
      fnClass: 0x0a,
      data: [0x00, 0xe9],
    },
    "media:volume-down": {
      name: "Media: Volume down",
      fnClass: 0x0a,
      data: [0x00, 0xea],
    },
    "dpi:cycle-up": {
      name: "DPI: Cycle up",
      fnClass: 0x06,
      data: [0x06],
    },
    "dpi:cycle-down": {
      name: "DPI: Cycle down",
      fnClass: 0x06,
      data: [0x07],
    },
    "profile:cycle-up": {
      name: "Profile: Cycle up",
      fnClass: 0x07,
      data: [0x04],
    },
    "profile:cycle-down": {
      name: "Profile: Cycle down",
      fnClass: 0x07,
      data: [0x05],
    },
    "scroll:mode-toggle": {
      name: "Scroll wheel: Toggle mode",
      fnClass: 0x12,
      data: [0x01],
    },
  };
  const NORMAL_FUNCTIONS = {
    ...MOUSE_FUNCTIONS,
    ...EXTRA_FUNCTIONS,
  };
  const CONSUMER_NAMES = {
    0x00b5: "Media: Next track",
    0x00b6: "Media: Previous track",
    0x00b7: "Media: Stop",
    0x00cd: "Media: Play/Pause",
    0x00e2: "Media: Mute",
    0x00e9: "Media: Volume up",
    0x00ea: "Media: Volume down",
  };
  const OPERATION_NAMES = {
    "dpi-switch": {
      0x01: "DPI: Next stage",
      0x02: "DPI: Previous stage",
      0x06: "DPI: Cycle up",
      0x07: "DPI: Cycle down",
    },
    "profile-switch": {
      0x01: "Profile: Next",
      0x02: "Profile: Previous",
      0x04: "Profile: Cycle up",
      0x05: "Profile: Cycle down",
    },
    "scroll-mode-toggle": {
      0x01: "Scroll wheel: Toggle mode",
    },
  };

  let nagaDevices = [];
  let activeDevice = null;
  let activePlateId = storedPlateId() || "naga6";
  let controlsDisabled = false;
  const currentReadbacks = new Map();
  const latestBackups = new Map();
  const logLines = [];

  function $(id) {
    return document.getElementById(id);
  }

  function hexByte(value) {
    return `0x${value.toString(16).padStart(2, "0")}`;
  }

  function hexWord(value) {
    return `0x${value.toString(16).padStart(4, "0")}`;
  }

  function hex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
      " ",
    );
  }

  function escapeText(value) {
    return String(value).replace(
      /[&<>"']/g,
      (ch) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[ch],
    );
  }

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function log(message) {
    const stamp = new Date().toLocaleTimeString();
    logLines.push(`[${stamp}] ${message}`);
    while (logLines.length > 160) logLines.shift();
    const node = $("nagaLog");
    if (node) {
      node.textContent = logLines.join("\n");
      node.scrollTop = node.scrollHeight;
    }
  }

  function setText(id, value) {
    const node = $(id);
    if (node) node.textContent = value;
  }

  function storedPlateId() {
    try {
      const value = window.localStorage?.getItem(ACTIVE_PLATE_STORAGE_KEY);
      return value && SIDE_PLATES[value] ? value : null;
    } catch {
      return null;
    }
  }

  function rememberActivePlate() {
    try {
      window.localStorage?.setItem(ACTIVE_PLATE_STORAGE_KEY, activePlateId);
    } catch {
      /* localStorage can be disabled in hardened browsers. */
    }
  }

  function calculateCrc(report) {
    let crc = 0;
    for (let index = 2; index < 88; index += 1) crc ^= report[index];
    return crc;
  }

  function activePlate() {
    return SIDE_PLATES[activePlateId] || SIDE_PLATES.naga6;
  }

  function plateById(plateId) {
    return SIDE_PLATES[plateId] || SIDE_PLATES.naga6;
  }

  function buttonsForPlate(plateId) {
    return plateById(plateId).buttons;
  }

  function activeButtons() {
    return activePlate().buttons;
  }

  function buildFunctionReport(button, fnClass, data, transactionId = 0x1f) {
    if (data.length > 5) {
      throw new Error("Button function data cannot exceed 5 bytes.");
    }
    const report = new Uint8Array(REPORT_LEN);
    report[0] = 0x00;
    report[1] = transactionId & 0xff;
    report[4] = 0x00;
    report[5] = 0x0a;
    report[6] = 0x02;
    report[7] = 0x0c;
    report.set(
      [
        PROFILE_DEFAULT,
        button,
        HYPERSHIFT_NORMAL,
        fnClass,
        data.length,
        ...data,
        ...Array(5 - data.length).fill(0x00),
      ],
      8,
    );
    report[88] = calculateCrc(report);
    return report;
  }

  function buildKeyboardReport(button, modifier, key, transactionId = 0x1f) {
    return buildFunctionReport(button, 0x02, [modifier, key], transactionId);
  }

  function buildMouseReport(button, mouse, transactionId = 0x1f) {
    return buildFunctionReport(button, 0x01, [mouse], transactionId);
  }

  function buildReadReport(button, transactionId = 0x1f) {
    const report = new Uint8Array(REPORT_LEN);
    report[0] = 0x00;
    report[1] = transactionId & 0xff;
    report[4] = 0x00;
    report[5] = 0x0a;
    report[6] = 0x02;
    report[7] = 0x8c;
    report.set([PROFILE_DEFAULT, button, HYPERSHIFT_NORMAL], 8);
    report[88] = calculateCrc(report);
    return report;
  }

  function normalizeFeatureReport(dataView) {
    let report = new Uint8Array(
      dataView.buffer,
      dataView.byteOffset,
      dataView.byteLength,
    );
    if (report.length === REPORT_LEN + 1 && report[0] === FEATURE_REPORT_ID) {
      report = report.slice(1);
    } else {
      report = report.slice();
    }
    return report;
  }

  function activeArgs(report) {
    return report.slice(8, 8 + report[5]);
  }

  function argsEqual(left, right) {
    if (left.length !== right.length) return false;
    return left.every((value, index) => value === right[index]);
  }

  function argsStartWith(args, prefix) {
    if (args.length < prefix.length) return false;
    return prefix.every((value, index) => args[index] === value);
  }

  async function sendFeatureAndWait(device, report, commandId, matcher) {
    await device.sendFeatureReport(FEATURE_REPORT_ID, report);
    for (let attempt = 0; attempt < 20; attempt += 1) {
      await sleep(10 * (attempt + 1));
      const response = normalizeFeatureReport(
        await device.receiveFeatureReport(FEATURE_REPORT_ID),
      );
      if (response.length !== REPORT_LEN) continue;
      if (response[6] !== 0x02 || response[7] !== commandId) continue;
      if (response[0] === 0x01) continue;
      if (matcher && !matcher(response)) continue;
      return response;
    }
    throw new Error(`Timed out waiting for command ${hexByte(commandId)}`);
  }

  function bindingMatchesReadback(binding, result) {
    if (binding.type === "function") {
      return (
        result.fnClass === binding.fnClass &&
        result.valueHex === hex(binding.data)
      );
    }
    return (
      result.className === "keyboard" &&
      result.valueHex === `${hexByte(binding.modifier).slice(2)} ${hexByte(binding.key).slice(2)}`
    );
  }

  function bindingLabel(binding) {
    if (binding.type === "function") return binding.functionName;
    return `${binding.modifierName}+${binding.keyName}`;
  }

  function buildBindingReport(binding) {
    if (binding.type === "function") {
      return buildFunctionReport(
        binding.button.code,
        binding.fnClass,
        binding.data,
      );
    }
    return buildKeyboardReport(
      binding.button.code,
      binding.modifier,
      binding.key,
    );
  }

  async function verifyWrittenBindings(device, bindings) {
    let latestResults = [];
    for (let attempt = 1; attempt <= VERIFY_ATTEMPTS; attempt += 1) {
      latestResults = [];
      const mismatches = [];
      for (const binding of bindings) {
        const result = await readButtonOnDevice(device, binding.button);
        latestResults.push(result);
        if (!bindingMatchesReadback(binding, result)) {
          mismatches.push(
            `${binding.button.label} expected ${bindingLabel(binding)}, read ${result.decoded}`,
          );
        }
      }
      if (!mismatches.length) return latestResults;
      if (attempt < VERIFY_ATTEMPTS) {
        log(
          `Readback not settled yet (${attempt}/${VERIFY_ATTEMPTS}): ${mismatches.join("; ")}`,
        );
        await sleep(VERIFY_RETRY_MS);
      } else {
        throw new Error(`Readback mismatch: ${mismatches.join("; ")}`);
      }
    }
    return latestResults;
  }

  async function openDevice(device) {
    if (!device.opened) await device.open();
    return device;
  }

  async function readButtonOnDevice(device, button) {
    await openDevice(device);
    const request = buildReadReport(button.code);
    const response = await sendFeatureAndWait(
      device,
      request,
      0x8c,
      (report) =>
        argsStartWith(activeArgs(report), [
          PROFILE_DEFAULT,
          button.code,
          HYPERSHIFT_NORMAL,
        ]),
    );
    return decodeButtonFunction(button, response);
  }

  async function readButtonsOnDevice(device, buttons) {
    const results = [];
    for (const button of buttons) {
      const result = await readButtonOnDevice(device, button);
      results.push(result);
      log(`${button.label} readback: ${result.decoded} · args ${result.argsHex}`);
    }
    return results;
  }

  function featureAccessHelp() {
    const runtime = detectRuntime();
    if (runtime.os === "Linux") {
      return "On Linux, check udev/hidraw permissions, close VMs with USB passthrough, and close other tools that may have grabbed the same receiver.";
    }
    return "Close other apps that may own the mouse, reconnect the receiver, then use Connect Naga again.";
  }

  async function findFeatureDevice(plate = activePlate()) {
    const probeButton = plate.buttons[Math.min(2, plate.buttons.length - 1)];
    if (activeDevice) {
      try {
        await readButtonOnDevice(activeDevice, probeButton);
        return activeDevice;
      } catch (error) {
        log(`Active HID interface no longer works: ${error.message}`);
        activeDevice = null;
      }
    }

    if (!nagaDevices.length) await useGrantedDevices();
    for (const device of nagaDevices) {
      try {
        await readButtonOnDevice(device, probeButton);
        activeDevice = device;
        log(`Using WebHID interface: ${deviceLabel(device)}`);
        updateDeviceStatus();
        return device;
      } catch (error) {
        log(`Skipped HID interface ${deviceLabel(device)}: ${error.message}`);
      }
    }
    throw new Error(
      `No selectable Naga HID interface accepted the feature report command. ${featureAccessHelp()}`,
    );
  }

  function decodeButtonFunction(button, report) {
    const args = activeArgs(report);
    const fnClass = args[3];
    const fnLength = args[4];
    const value = args.slice(5, 5 + Math.min(fnLength, args.length - 5));
    const className = FN_CLASSES[fnClass] || `unknown-${hexByte(fnClass)}`;
    let decoded = className;

    if (fnClass === 0x00) {
      decoded = "disabled";
    } else if (fnClass === 0x02 && value.length >= 2) {
      const modifier = value[0];
      const key = value[1];
      const keyName = key === 0 ? "NO_KEY" : KEY_NAMES[key] || hexByte(key);
      decoded = `${MODIFIER_NAMES[modifier] || hexByte(modifier)}+${keyName}`;
    } else if (fnClass === 0x01 && value.length >= 1) {
      decoded = MOUSE_NAMES[value[0]] || `mouse-${hexByte(value[0])}`;
    } else if (fnClass === 0x0b && value.length >= 1) {
      decoded = `double-click ${MOUSE_NAMES[value[0]] || `mouse-${hexByte(value[0])}`}`;
    } else if (fnClass === 0x0a && value.length >= 2) {
      const usage = (value[0] << 8) | value[1];
      decoded = CONSUMER_NAMES[usage] || `consumer-${hexWord(usage)}`;
    } else if (OPERATION_NAMES[className] && value.length >= 1) {
      decoded = OPERATION_NAMES[className][value[0]] || `${className} op=${hexByte(value[0])}`;
    } else if (value.length) {
      decoded = `${className} ${hex(value)}`;
    }

    return {
      button,
      status: STATUS_NAMES[report[0]] || hexByte(report[0]),
      crcOk: calculateCrc(report) === report[88],
      argsHex: hex(args),
      fnClass,
      fnLength,
      className,
      valueHex: hex(value),
      valueBytes: Array.from(value),
      decoded,
    };
  }

  function readbackKey(plateId, button) {
    return `${plateId}:${button.id}`;
  }

  function currentReadbackFor(button, plateId = activePlateId) {
    return currentReadbacks.get(readbackKey(plateId, button));
  }

  function currentReadbackLabel(button) {
    const result = currentReadbackFor(button);
    return result ? result.decoded : "Not read yet";
  }

  function storeCurrentReadbacks(plateId, results) {
    results.forEach((result) => {
      currentReadbacks.set(readbackKey(plateId, result.button), result);
    });
  }

  function updateCurrentCells(plateId = activePlateId) {
    if (plateId !== activePlateId) return;
    buttonsForPlate(plateId).forEach((button) => {
      const row = document.querySelector(`[data-naga-button="${button.id}"]`);
      const current = row?.querySelector("[data-naga-current]");
      if (current) current.textContent = currentReadbackLabel(button);
    });
  }

  function minimalReadback(result) {
    return {
      buttonId: result.button.id,
      buttonLabel: result.button.label,
      buttonCode: result.button.code,
      status: result.status,
      crcOk: result.crcOk,
      argsHex: result.argsHex,
      fnClass: result.fnClass,
      fnLength: result.fnLength,
      className: result.className,
      valueHex: result.valueHex,
      valueBytes: result.valueBytes,
      decoded: result.decoded,
    };
  }

  function recordBackup(plateId, results, reason) {
    const plate = plateById(plateId);
    const backup = {
      version: 1,
      createdAt: new Date().toISOString(),
      reason,
      device: "Razer Naga V2 Pro",
      vendorId: NAGA_VENDOR_ID,
      productIds: NAGA_PRODUCT_IDS,
      profile: PROFILE_DEFAULT,
      hypershift: HYPERSHIFT_NORMAL,
      plateId,
      plateLabel: plate.label,
      buttons: results.map(minimalReadback),
    };
    latestBackups.set(plateId, backup);
    updateBackupButtons();
    return backup;
  }

  function latestBackup() {
    return latestBackups.get(activePlateId);
  }

  function updateBackupButtons() {
    const hasBackup = Boolean(latestBackup());
    ["nagaExportBackupButton", "nagaRestoreBackupButton"].forEach((id) => {
      const node = $(id);
      if (node) node.disabled = controlsDisabled || !hasBackup;
    });
  }

  function renderBindingRows() {
    const list = $("nagaBindingRows");
    if (!list) return;
    const keyOptions = [
      '<option value="keep">Keep current</option>',
      `<optgroup label="Mouse functions">${Object.entries(MOUSE_FUNCTIONS)
        .map(
          ([value, entry]) => `<option value="${value}">${entry.name}</option>`,
        )
        .join("")}</optgroup>`,
      `<optgroup label="Normal on-board functions">${Object.entries(EXTRA_FUNCTIONS)
        .map(
          ([value, entry]) => `<option value="${value}">${entry.name}</option>`,
        )
        .join("")}</optgroup>`,
      `<optgroup label="Keyboard keys">${Object.keys(KEYS)
        .map((key) => `<option value="${key}">${key}</option>`)
        .join("")}</optgroup>`,
    ].join("");
    const modifierOptions = Object.keys(MODIFIERS)
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");

    list.innerHTML = activeButtons().map(
      (button) => `<div class="naga-row" data-naga-button="${button.id}">
        <div class="button-cell"><b>${button.label}</b><small>${hexByte(button.code)}</small></div>
        <div class="current-cell"><span>Current</span><b data-naga-current>${escapeText(currentReadbackLabel(button))}</b></div>
        <label>Function <select data-naga-key>${keyOptions}</select></label>
        <label>Modifier <select data-naga-modifier>${modifierOptions}</select></label>
        <small class="payload-cell" data-naga-payload>Payload waits for selection.</small>
      </div>`,
    ).join("");

    activeButtons().forEach((button) => {
      const row = list.querySelector(`[data-naga-button="${button.id}"]`);
      row.querySelector("[data-naga-key]").value = "keep";
      row.querySelector("[data-naga-modifier]").value = "none";
    });
    list
      .querySelectorAll("select")
      .forEach((select) => select.addEventListener("change", updatePayloads));
    updatePayloads();
  }

  function selectedBindings(plateId = activePlateId) {
    const plateButtons = buttonsForPlate(plateId);
    return Array.from(document.querySelectorAll(".naga-row"))
      .map((row) => {
        const button = plateButtons.find(
          (entry) => entry.id === row.dataset.nagaButton,
        );
        const keyName = row.querySelector("[data-naga-key]").value;
        const modifierName = row.querySelector("[data-naga-modifier]").value;
        if (!button || keyName === "keep") return null;
        if (NORMAL_FUNCTIONS[keyName]) {
          const fn = NORMAL_FUNCTIONS[keyName];
          return {
            type: "function",
            button,
            functionName: fn.name,
            fnClass: fn.fnClass,
            data: fn.data,
          };
        }
        return {
          type: "keyboard",
          button,
          keyName,
          key: KEYS[keyName],
          modifierName,
          modifier: MODIFIERS[modifierName],
        };
      })
      .filter(Boolean);
  }

  function updatePayloads(plateId = activePlateId) {
    const plateButtons = buttonsForPlate(plateId);
    document.querySelectorAll(".naga-row").forEach((row) => {
      const button = plateButtons.find(
        (entry) => entry.id === row.dataset.nagaButton,
      );
      const keyName = row.querySelector("[data-naga-key]").value;
      const modifierName = row.querySelector("[data-naga-modifier]").value;
      const modifier = row.querySelector("[data-naga-modifier]");
      const payload = row.querySelector("[data-naga-payload]");
      if (!button || !payload) return;
      if (keyName === "keep") {
        modifier.value = "none";
        modifier.disabled = true;
        payload.textContent = "No write; current value is preserved.";
        return;
      }
      if (NORMAL_FUNCTIONS[keyName]) {
        const fn = NORMAL_FUNCTIONS[keyName];
        modifier.value = "none";
        modifier.disabled = true;
        const report = buildFunctionReport(button.code, fn.fnClass, fn.data);
        payload.textContent = `args ${hex(report.slice(8, 18))} · crc ${hexByte(report[88])}`;
        return;
      }
      modifier.disabled = false;
      const report = buildKeyboardReport(
        button.code,
        MODIFIERS[modifierName],
        KEYS[keyName],
      );
      payload.textContent = `args ${hex(report.slice(8, 18))} · crc ${hexByte(report[88])}`;
    });
  }

  function applyPreset() {
    activeButtons().forEach((button) => {
      const row = document.querySelector(`[data-naga-button="${button.id}"]`);
      if (!row) return;
      row.querySelector("[data-naga-key]").value = button.preset;
      row.querySelector("[data-naga-modifier]").value =
        button.presetModifier || "none";
    });
    updatePayloads();
    log(`Loaded recommended preset for ${activePlate().label}; nothing is written until you confirm and write.`);
  }

  function keepCurrent() {
    activeButtons().forEach((button) => {
      const row = document.querySelector(`[data-naga-button="${button.id}"]`);
      if (!row) return;
      row.querySelector("[data-naga-key]").value = "keep";
      row.querySelector("[data-naga-modifier]").value = "none";
    });
    updatePayloads();
    log(`Reset ${activePlate().label} rows to keep current.`);
  }

  function resetWriteGuards() {
    ["nagaPlateConsent", "nagaWriteConsent"].forEach((id) => {
      const node = $(id);
      if (node) node.checked = false;
    });
  }

  function rawBindingFromBackup(button, saved) {
    return {
      type: "function",
      button,
      functionName: `backup ${saved.decoded}`,
      fnClass: saved.fnClass,
      data: saved.valueBytes.slice(0, 5),
    };
  }

  async function restoreLatestBackup() {
    const plateId = activePlateId;
    const plate = plateById(plateId);
    const backup = latestBackup();
    if (!backup) {
      log("No backup exists for the selected side plate yet.");
      return;
    }
    if (!$("nagaPlateConsent")?.checked) {
      log("Backup restore blocked: confirm that the mounted side plate matches the selected layout.");
      return;
    }
    if (!$("nagaWriteConsent")?.checked) {
      log("Backup restore blocked: confirm the on-board profile checkbox first.");
      return;
    }
    const bindings = backup.buttons
      .map((saved) => {
        const button = plate.buttons.find((entry) => entry.id === saved.buttonId);
        return button ? rawBindingFromBackup(button, saved) : null;
      })
      .filter(Boolean);
    if (!bindings.length) {
      log("Backup restore skipped: no button rows from the backup match this plate.");
      return;
    }
    try {
      setDisabled(true);
      const device = await findFeatureDevice(plate);
      log(`Restoring ${backup.plateLabel} backup from ${backup.createdAt}.`);
      for (const binding of bindings) {
        const report = buildBindingReport(binding);
        log(
          `Restoring ${binding.button.label} -> ${binding.functionName} · args ${hex(report.slice(8, 18))}`,
        );
        const response = await sendFeatureAndWait(
          device,
          report,
          0x0c,
          (reply) => argsEqual(activeArgs(reply), report.slice(8, 18)),
        );
        const status = STATUS_NAMES[response[0]] || hexByte(response[0]);
        const crcOk = calculateCrc(response) === response[88] ? "ok" : "BAD";
        log(`Restore response: ${status} · crc ${crcOk}`);
        if (response[0] !== 0x02) throw new Error(`restore returned ${status}`);
        await sleep(WRITE_SETTLE_MS);
      }
      const verified = await verifyWrittenBindings(device, bindings);
      log(`Verified ${verified.length} restored backup binding(s) by readback.`);
      const postRestoreResults = await readButtonsOnDevice(device, plate.buttons);
      resetWriteGuards();
      renderReadback(plateId, postRestoreResults);
    } catch (error) {
      log(`Backup restore failed: ${error.message}`);
    } finally {
      setDisabled(false);
      updateBrowserStatus();
    }
  }

  function exportLatestBackup() {
    const backup = latestBackup();
    if (!backup) {
      log("No backup exists for the selected side plate yet.");
      return;
    }
    const payload = JSON.stringify(backup, null, 2);
    const blob = new Blob([payload], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `naga-v2-pro-${backup.plateId}-backup-${backup.createdAt.replace(/[:.]/g, "-")}.json`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
    log(`Exported latest ${backup.plateLabel} backup from ${backup.createdAt}.`);
  }

  function renderPlateControls() {
    const cards = $("nagaPlateCards");
    if (!cards) return;
    cards.innerHTML = Object.values(SIDE_PLATES)
      .map((plate) => {
        const selected = plate.id === activePlateId;
        const buttonCount = plate.buttons.length;
        const cols = buttonCount <= 2 ? 1 : buttonCount <= 6 ? 2 : 3;
        const dots = Array.from({ length: buttonCount }, () => "<i></i>").join(
          "",
        );
        return `<button
          type="button"
          class="plate-card ${selected ? "selected" : ""}"
          data-naga-plate-card="${escapeText(plate.id)}"
          role="tab"
          aria-selected="${selected ? "true" : "false"}"
          ${controlsDisabled ? "disabled" : ""}
        >
          <span class="plate-glyph cols-${cols}" aria-hidden="true">${dots}</span>
          <span class="plate-name">${escapeText(plate.label)}</span>
          <b>${buttonCount} buttons</b>
          <small>${escapeText(plate.status)} · ${escapeText(plate.buttonRange)}</small>
        </button>`;
      })
      .join("");
    cards.querySelectorAll("[data-naga-plate-card]").forEach((button) => {
      button.addEventListener("click", () => {
        const nextPlate = button.dataset.nagaPlateCard;
        if (!SIDE_PLATES[nextPlate] || nextPlate === activePlateId) return;
        activePlateId = nextPlate;
        rememberActivePlate();
        resetWriteGuards();
        log(`Selected ${activePlate().label}.`);
        updatePlateUi();
      });
    });
  }

  function updatePlateUi() {
    const plate = activePlate();
    setText("nagaPlateTitle", plate.label);
    setText("nagaPlateValidation", plate.validation);
    setText("nagaPresetButton", plate.presetLabel);
    setText("nagaReadButton", `Read ${plate.label}`);
    renderPlateControls();
    renderBindingRows();
    updateBackupButtons();
    renderReadback([]);
  }

  function deviceLabel(device) {
    return `${device.productName || "Razer HID"} ${hexByte(device.vendorId)}:${hexByte(device.productId)}`;
  }

  function collectionSummary(device) {
    return (device.collections || [])
      .map((collection) => {
        const features = (collection.featureReports || []).length;
        return `usagePage=${hexByte(collection.usagePage)} usage=${hexByte(collection.usage)} features=${features}`;
      })
      .join("; ");
  }

  function detectRuntime() {
    const ua = navigator.userAgent || "";
    const platform =
      navigator.userAgentData?.platform || navigator.platform || "unknown";
    const brands = navigator.userAgentData?.brands || [];
    const brandText = brands.map((brand) => brand.brand).join(" ");

    let os = "unknown system";
    if (/CrOS/i.test(ua) || /Chrome OS/i.test(platform)) os = "ChromeOS";
    else if (/Android/i.test(ua) || /Android/i.test(platform)) os = "Android";
    else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS/iPadOS";
    else if (/Mac/i.test(platform)) os = "macOS";
    else if (/Win/i.test(platform)) os = "Windows";
    else if (/Linux/i.test(platform) || /X11/i.test(ua)) os = "Linux";

    let browser = "this browser";
    if (/Edg\//.test(ua) || /Microsoft Edge/i.test(brandText)) {
      browser = "Microsoft Edge";
    } else if (/OPR\//.test(ua) || /Opera/i.test(brandText)) {
      browser = "Opera";
    } else if (/Firefox\//.test(ua)) {
      browser = "Firefox";
    } else if (/Safari\//.test(ua) && !/Chrome|Chromium|CriOS|Edg\//.test(ua)) {
      browser = "Safari";
    } else if (/Google Chrome/i.test(brandText) || /Chrome\//.test(ua)) {
      browser = "Google Chrome";
    } else if (/Chromium/i.test(brandText) || /Chromium\//.test(ua)) {
      browser = "Chromium";
    }

    return {
      browser,
      os,
      hasWebHid: typeof navigator.hid !== "undefined",
      secure: window.isSecureContext,
      mobile: os === "Android" || os === "iOS/iPadOS",
    };
  }

  function browserRecommendations(runtime) {
    const chromium = {
      text: "Chromium (recommended, less Google)",
      primary: true,
      href: "https://www.chromium.org/getting-involved/download-chromium/",
    };
    const chromiumShort = {
      text: "Chromium (less Google)",
      primary: true,
      href: "https://www.chromium.org/getting-involved/download-chromium/",
    };
    const chrome = {
      text: "Google Chrome",
      primary: false,
      href: "https://www.google.com/chrome/",
    };
    const edge = {
      text: "Microsoft Edge",
      primary: false,
      href: "https://www.microsoft.com/edge",
    };
    const opera = {
      text: "Opera",
      primary: false,
      href: "https://www.opera.com/",
    };
    if (runtime.os === "Linux") {
      return [
        chromium,
        chrome,
        edge,
        opera,
        { text: "udev/hidraw access required", primary: false },
      ];
    }
    if (runtime.os === "Windows") {
      return [chromiumShort, chrome, edge, opera];
    }
    if (runtime.os === "macOS") {
      return [chromiumShort, chrome, edge];
    }
    if (runtime.os === "ChromeOS") {
      return [
        {
          text: "Chrome",
          primary: true,
          href: "https://www.google.com/chrome/",
        },
        {
          text: "Chromium-based browser",
          primary: false,
          href: "https://www.chromium.org/",
        },
      ];
    }
    if (runtime.mobile) {
      return [
        { text: "Use a desktop browser", primary: true },
        {
          text: "Chromium on Linux/Windows/macOS",
          primary: false,
          href: "https://www.chromium.org/getting-involved/download-chromium/",
        },
        {
          text: "Google Chrome or Edge desktop",
          primary: false,
          href: "https://www.google.com/chrome/",
        },
      ];
    }
    return [chromium, chrome, edge, opera];
  }

  function hideCompatibilityAlert() {
    const alert = $("nagaCompatibilityAlert");
    if (!alert) return;
    alert.hidden = true;
  }

  function renderCompatibilityAlert(state, title, message, recommendations) {
    const alert = $("nagaCompatibilityAlert");
    const kicker = $("nagaCompatibilityKicker");
    const titleNode = $("nagaCompatibilityTitle");
    const messageNode = $("nagaCompatibilityMessage");
    const recs = $("nagaCompatibilityRecommendations");
    if (!alert || !kicker || !titleNode || !messageNode || !recs) return;

    alert.hidden = false;
    alert.className = `compat-alert ${state}`;
    kicker.textContent =
      state === "warning" ? "Secure context required" : "Browser not compatible";
    titleNode.textContent = title;
    messageNode.textContent = message;
    recs.innerHTML = recommendations
      .map((recommendation) => {
        const className = recommendation.primary ? ' class="primary-rec"' : "";
        const text = escapeText(recommendation.text);
        if (!recommendation.href) return `<span${className}>${text}</span>`;
        const href = escapeText(recommendation.href);
        return `<a${className} href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;
      })
      .join("");
  }

  function updateBrowserStatus() {
    const runtime = detectRuntime();
    const recommendations = browserRecommendations(runtime);
    if (!runtime.secure) {
      renderCompatibilityAlert(
        "warning",
        "Open this tool over HTTPS or localhost",
        `Detected ${runtime.browser} on ${runtime.os}, but this page is not in a secure context. WebHID only works on HTTPS origins or localhost. GitHub Pages HTTPS is fine.`,
        recommendations,
      );
      setText(
        "nagaBrowserStatus",
        "Blocked: WebHID requires HTTPS or localhost.",
      );
      setDisabled(true);
      return;
    }

    if (!runtime.hasWebHid) {
      renderCompatibilityAlert(
        "danger",
        "This browser cannot configure the mouse",
        `Detected ${runtime.browser} on ${runtime.os}. This browser does not expose WebHID here, so this page cannot read or write the Naga. Use one of the compatible desktop browsers listed here.`,
        recommendations,
      );
      setText("nagaBrowserStatus", "Blocked: WebHID is not available.");
      setDisabled(true);
      return;
    }

    hideCompatibilityAlert();
    setText(
      "nagaBrowserStatus",
      `WebHID available in ${runtime.browser} on ${runtime.os}.`,
    );
    setDisabled(false);
  }

  function setDisabled(disabled) {
    controlsDisabled = disabled;
    [
      "nagaConnectButton",
      "nagaReconnectButton",
      "nagaReadButton",
      "nagaPresetButton",
      "nagaKeepButton",
      "nagaApplyButton",
      "nagaClearLogButton",
    ].forEach((id) => {
      const node = $(id);
      if (node) node.disabled = disabled;
    });
    document
      .querySelectorAll(
        "[data-naga-plate-card], .naga-row select, #nagaPlateConsent, #nagaWriteConsent",
      )
      .forEach((node) => {
        node.disabled = disabled;
      });
    updateBackupButtons();
  }

  function updateDeviceStatus() {
    if (!nagaDevices.length) {
      setText("nagaDeviceStatus", "No device selected");
      return;
    }
    const labels = nagaDevices.map((device) => deviceLabel(device)).join(" · ");
    const active = activeDevice ? ` · active ${deviceLabel(activeDevice)}` : "";
    setText("nagaDeviceStatus", `${nagaDevices.length} HID interface(s): ${labels}${active}`);
  }

  async function requestNagaDevice() {
    if (typeof navigator.hid === "undefined") return;
    const filters = NAGA_PRODUCT_IDS.map((productId) => ({
      vendorId: NAGA_VENDOR_ID,
      productId,
    }));
    const selected = await navigator.hid.requestDevice({ filters });
    if (!selected.length) {
      log("Device chooser closed without a Naga selection.");
      return;
    }
    nagaDevices = selected;
    activeDevice = null;
    for (const device of nagaDevices) {
      try {
        await openDevice(device);
        log(`Opened ${deviceLabel(device)} · ${collectionSummary(device)}`);
      } catch (error) {
        log(`Open failed for ${deviceLabel(device)}: ${error.message}`);
      }
    }
    updateDeviceStatus();
  }

  async function useGrantedDevices() {
    if (typeof navigator.hid === "undefined") return [];
    const granted = await navigator.hid.getDevices();
    nagaDevices = granted.filter(
      (device) =>
        device.vendorId === NAGA_VENDOR_ID &&
        NAGA_PRODUCT_IDS.includes(device.productId),
    );
    activeDevice = null;
    for (const device of nagaDevices) {
      try {
        await openDevice(device);
        log(`Opened granted ${deviceLabel(device)} · ${collectionSummary(device)}`);
      } catch (error) {
        log(`Open failed for granted ${deviceLabel(device)}: ${error.message}`);
      }
    }
    updateDeviceStatus();
    if (!nagaDevices.length) log("No previously granted Naga WebHID devices.");
    return nagaDevices;
  }

  async function readSidePlate() {
    const plateId = activePlateId;
    const plate = plateById(plateId);
    try {
      setDisabled(true);
      const device = await findFeatureDevice(plate);
      const results = await readButtonsOnDevice(device, plate.buttons);
      recordBackup(plateId, results, "manual-read");
      renderReadback(plateId, results);
    } catch (error) {
      log(`Read failed: ${error.message}`);
    } finally {
      setDisabled(false);
      updateBrowserStatus();
    }
  }

  async function writeSelectedBindings() {
    const plateId = activePlateId;
    const plate = plateById(plateId);
    try {
      if (!$("nagaPlateConsent")?.checked) {
        log("Write blocked: confirm that the mounted side plate matches the selected layout.");
        return;
      }
      if (!$("nagaWriteConsent")?.checked) {
        log("Write blocked: confirm the on-board profile checkbox first.");
        return;
      }
      const bindings = selectedBindings(plateId);
      if (!bindings.length) {
        log("Write skipped: all rows are set to keep current.");
        return;
      }
      setDisabled(true);
      const device = await findFeatureDevice(plate);
      const backupResults = await readButtonsOnDevice(device, plate.buttons);
      const backup = recordBackup(plateId, backupResults, "pre-write");
      log(`Backed up ${backup.plateLabel} before writing. Export or restore it from the readback panel.`);
      for (const binding of bindings) {
        const report = buildBindingReport(binding);
        log(
          `Writing ${binding.button.label} -> ${bindingLabel(binding)} · args ${hex(report.slice(8, 18))}`,
        );
        const response = await sendFeatureAndWait(
          device,
          report,
          0x0c,
          (reply) => argsEqual(activeArgs(reply), report.slice(8, 18)),
        );
        const status = STATUS_NAMES[response[0]] || hexByte(response[0]);
        const crcOk = calculateCrc(response) === response[88] ? "ok" : "BAD";
        log(`Write response: ${status} · crc ${crcOk}`);
        if (response[0] !== 0x02) throw new Error(`write returned ${status}`);
        await sleep(WRITE_SETTLE_MS);
      }
      const verified = await verifyWrittenBindings(device, bindings);
      log(`Verified ${verified.length} written binding(s) by readback.`);
      const postWriteResults = await readButtonsOnDevice(device, plate.buttons);
      resetWriteGuards();
      renderReadback(plateId, postWriteResults);
    } catch (error) {
      log(`Write failed: ${error.message}`);
    } finally {
      setDisabled(false);
      updateBrowserStatus();
    }
  }

  function renderReadback(plateIdOrResults, maybeResults) {
    const plateId = Array.isArray(plateIdOrResults)
      ? activePlateId
      : plateIdOrResults;
    const results = Array.isArray(plateIdOrResults)
      ? plateIdOrResults
      : maybeResults || [];
    const node = $("nagaReadback");
    if (!node) return;
    if (!results.length) {
      node.innerHTML = '<div class="sensor-empty">No Naga readback yet.</div>';
      return;
    }
    storeCurrentReadbacks(plateId, results);
    updateCurrentCells(plateId);
    node.innerHTML = results
      .map(
        (result) => `<div class="naga-readback-row">
          <b>${escapeText(result.button.label)} <small>${hexByte(result.button.code)}</small></b>
          <span>${escapeText(result.decoded)} · ${escapeText(result.className)} · crc ${result.crcOk ? "ok" : "BAD"}<br /><code>${escapeText(result.argsHex)}</code></span>
        </div>`,
      )
      .join("");
  }

  function wireNagaWebhid() {
    if (!$("nagaWebhid")) return;
    updateBrowserStatus();
    renderPlateControls();
    updatePlateUi();

    $("nagaConnectButton").onclick = async () => {
      try {
        await requestNagaDevice();
      } catch (error) {
        log(`Connect failed: ${error.message}`);
      }
    };
    $("nagaReconnectButton").onclick = async () => {
      try {
        await useGrantedDevices();
      } catch (error) {
        log(`Granted-device open failed: ${error.message}`);
      }
    };
    $("nagaReadButton").onclick = readSidePlate;
    $("nagaApplyButton").onclick = writeSelectedBindings;
    $("nagaPresetButton").onclick = applyPreset;
    $("nagaKeepButton").onclick = keepCurrent;
    $("nagaExportBackupButton").onclick = exportLatestBackup;
    $("nagaRestoreBackupButton").onclick = restoreLatestBackup;
    $("nagaClearLogButton").onclick = () => {
      logLines.splice(0);
      if ($("nagaLog")) $("nagaLog").textContent = "";
    };

    if (typeof navigator.hid !== "undefined") {
      navigator.hid.addEventListener("connect", (event) => {
        if (
          event.device.vendorId === NAGA_VENDOR_ID &&
          NAGA_PRODUCT_IDS.includes(event.device.productId)
        ) {
          log(`Naga connected: ${deviceLabel(event.device)}`);
        }
      });
      navigator.hid.addEventListener("disconnect", (event) => {
        if (event.device === activeDevice) activeDevice = null;
        nagaDevices = nagaDevices.filter((device) => device !== event.device);
        updateDeviceStatus();
        log(`HID disconnected: ${deviceLabel(event.device)}`);
      });
      useGrantedDevices().catch((error) =>
        log(`Granted-device check failed: ${error.message}`),
      );
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", wireNagaWebhid);
  } else {
    wireNagaWebhid();
  }
})();
