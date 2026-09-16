const { app, BrowserWindow, Menu, shell, session } = require("electron");
const path = require("path");
const fs = require("fs");

// Points at the live production admin dashboard. Login uses the same
// email/password as the website — Electron persists the session cookie
// to disk the same way a browser profile would, so admins stay logged in
// between launches.
const ADMIN_URL = "https://dttbhutan.vercel.app/admin";
const ADMIN_HOST = "dttbhutan.vercel.app";

const boundsFile = path.join(app.getPath("userData"), "window-bounds.json");

function loadBounds() {
  try {
    return JSON.parse(fs.readFileSync(boundsFile, "utf8"));
  } catch {
    return { width: 1280, height: 860 };
  }
}

function saveBounds(win) {
  try {
    fs.writeFileSync(boundsFile, JSON.stringify(win.getBounds()));
  } catch {
    // non-fatal — just means the window won't remember its size next launch
  }
}

function createWindow() {
  const bounds = loadBounds();

  const win = new BrowserWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 600,
    title: "Droelma Admin",
    backgroundColor: "#f5f4f1",
    icon: path.join(__dirname, "..", "build", "icon.png"),
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.loadURL(ADMIN_URL);

  win.webContents.on("did-fail-load", (_event, errorCode, errorDescription) => {
    if (errorCode === -3) return; // ERR_ABORTED — usually just a redirect, not a real failure
    win.loadFile(path.join(__dirname, "offline.html"));
    console.error(`Failed to load admin dashboard: ${errorDescription} (${errorCode})`);
  });

  // The website's marketing NavBar/Footer only render as direct <header>/
  // <footer> children of <body> (the admin dashboard's own sidebar header
  // is a plain <div>, so this can't touch it). Signed-out visits to /admin
  // land on /login first, which isn't under /admin and still carries that
  // marketing chrome — hide it here so the desktop app looks like the
  // admin dashboard everywhere it can land, without changing the website.
  win.webContents.on("did-finish-load", () => {
    win.webContents.insertCSS(
      "body > header, body > footer { display: none !important; }"
    );
  });

  // Keep the app pinned to the admin dashboard's own domain; anything
  // else (e.g. a link out to a support site) opens in the OS browser
  // instead of navigating the app window away from the dashboard.
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (event, url) => {
    const target = new URL(url);
    if (target.host !== ADMIN_HOST) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  let saveTimeout;
  const scheduleSave = () => {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => saveBounds(win), 500);
  };
  win.on("resize", scheduleSave);
  win.on("move", scheduleSave);

  return win;
}

function buildMenu(mainWindow) {
  const isMac = process.platform === "darwin";

  const template = [
    ...(isMac
      ? [
          {
            label: app.name,
            submenu: [
              { role: "about" },
              { type: "separator" },
              { role: "hide" },
              { role: "hideOthers" },
              { role: "unhide" },
              { type: "separator" },
              { role: "quit" },
            ],
          },
        ]
      : []),
    {
      label: "File",
      submenu: [
        {
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          click: () => mainWindow.loadURL(ADMIN_URL),
        },
        { role: "toggleDevTools" },
        { type: "separator" },
        isMac ? { role: "close" } : { role: "quit" },
      ],
    },
    {
      label: "View",
      submenu: [
        { role: "resetZoom" },
        { role: "zoomIn" },
        { role: "zoomOut" },
        { type: "separator" },
        { role: "togglefullscreen" },
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, ...(isMac ? [{ role: "zoom" }] : [])],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

app.whenReady().then(() => {
  // Content-Security-Policy relaxation isn't needed — this window only
  // ever loads the admin dashboard's own origin.
  session.defaultSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

  const win = createWindow();
  buildMenu(win);

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
