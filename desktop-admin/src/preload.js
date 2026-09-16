// Intentionally empty. The window renders the admin dashboard unmodified —
// no Node/Electron APIs are exposed to the page, and none are needed for a
// pure wrapper. Add a contextBridge.exposeInMainWorld() call here only if a
// future native feature (e.g. desktop notifications) needs the page to
// reach back into the main process.
