import { writable } from "svelte/store";

export const defaultHex = "#ffffff";
export const defaultAlpha = "ff";

const defaultColour = defaultHex + defaultAlpha;
export const colour1 = writable(defaultColour);
export const colour2 = writable(defaultColour);
