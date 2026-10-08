import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";
import { FONT } from "../config/theme";

// Poppins auto-hospedada (mesmos arquivos do Google Fonts, via @fontsource/poppins):
// renderiza offline e sem depender do certificado do fonts.gstatic.com.
const files = [
  ["500", "latin"], ["500", "latin-ext"],
  ["800", "latin"], ["800", "latin-ext"],
  ["900", "latin"], ["900", "latin-ext"],
] as const;

export const fontsReady = Promise.all(
  files.map(([weight, subset]) =>
    loadFont({
      family: FONT,
      url: staticFile(`fonts/poppins-${subset}-${weight}-normal.woff2`),
      weight,
      format: "woff2",
    }),
  ),
);
