import { Config } from "@remotion/cli/config";

Config.setVideoImageFormat("png");
Config.setCodec("h264");
Config.setCrf(16);
Config.setPixelFormat("yuv420p");
Config.setAudioCodec("aac");
Config.setAudioBitrate("256k");
Config.setConcurrency(4);
Config.setOverwriteOutput(true);
// Usa o Chromium headless já instalado no ambiente (se não existir, o Remotion baixa o dele).
const fs = require("fs");
const HEADLESS = process.env.REMOTION_BROWSER ?? "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
if (fs.existsSync(HEADLESS)) {
  Config.setBrowserExecutable(HEADLESS);
}
