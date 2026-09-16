const fs = require("fs");
const path = require("path");
const png2icons = require("png2icons");

const input = fs.readFileSync(path.join(__dirname, "icon.png"));

const ico = png2icons.createICO(input, png2icons.BICUBIC, 0, false);
if (ico) fs.writeFileSync(path.join(__dirname, "icon.ico"), ico);

const icns = png2icons.createICNS(input, png2icons.BICUBIC, 0);
if (icns) fs.writeFileSync(path.join(__dirname, "icon.icns"), icns);

console.log("icon.ico:", !!ico, "icon.icns:", !!icns);
