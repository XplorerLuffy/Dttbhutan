# Droelma Admin desktop app — v1.0.0 downloads

These are the built installers for the Droelma Admin desktop app (a native
wrapper around `https://dttbhutan.vercel.app/admin`). GitHub blocks single
files over 100MB, so each installer is split into small `.part` files that
you download and glue back together on your own machine. Nothing here is
executable on its own — each `.NN.part` file is a raw chunk of bytes.

Direct download links (replace nothing — these work as-is once this folder
is pushed to the branch):

```
https://raw.githubusercontent.com/XplorerLuffy/Dttbhutan/claude/quirky-heisenberg-frzs5q/desktop-admin/releases/v1.0.0/<filename>
```

## Windows

Files: `DroelmaAdminSetup-win-1.0.0.exe.00.part`, `.01.part`

Download both into the same folder, open Command Prompt there, and run:

```
copy /b DroelmaAdminSetup-win-1.0.0.exe.00.part+DroelmaAdminSetup-win-1.0.0.exe.01.part "Droelma Admin Setup 1.0.0.exe"
```

Then double-click `Droelma Admin Setup 1.0.0.exe` to install. It's
unsigned, so Windows SmartScreen will warn on first run — click "More
info" → "Run anyway".

## macOS

Files: `DroelmaAdmin-mac-1.0.0.zip.00.part`, `.01.part`, `.02.part`

Download all three into the same folder, open Terminal there, and run:

```
cat DroelmaAdmin-mac-1.0.0.zip.00.part DroelmaAdmin-mac-1.0.0.zip.01.part DroelmaAdmin-mac-1.0.0.zip.02.part > DroelmaAdmin-mac.zip
unzip DroelmaAdmin-mac.zip
```

Drag `Droelma Admin.app` into `/Applications`. It's unsigned, so the first
time you open it, right-click the app → "Open" → "Open" to get past
Gatekeeper (only needed once).

## Linux

Files: `DroelmaAdmin-linux-1.0.0.AppImage.00.part`, `.01.part`, `.02.part`

Download all three into the same folder, open a terminal there, and run:

```
cat DroelmaAdmin-linux-1.0.0.AppImage.00.part DroelmaAdmin-linux-1.0.0.AppImage.01.part DroelmaAdmin-linux-1.0.0.AppImage.02.part > "Droelma Admin-1.0.0.AppImage"
chmod +x "Droelma Admin-1.0.0.AppImage"
./"Droelma Admin-1.0.0.AppImage"
```

## Verify the reassembled file (optional but recommended)

After reassembling, check the file matches the hash in `CHECKSUMS.txt`:

- Windows (PowerShell): `Get-FileHash "Droelma Admin Setup 1.0.0.exe" -Algorithm SHA256`
- macOS/Linux: `shasum -a 256 <file>` or `sha256sum <file>`

If the hash doesn't match, re-download the parts — a part likely got
corrupted or truncated in transit.
