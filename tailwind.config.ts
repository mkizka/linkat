import daisyui from "daisyui";
import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";
import animate from "tailwindcss-animate";

// https://stackoverflow.com/questions/77742654/tailwindcss-how-to-do-a-light-mode-only-modification
const lightSelectorPlugin = plugin((api) => {
  api.addVariant("light", ".light &");
  api.addVariant("light", "html:not(.dark) &");
  api.addVariant("light", "@media (prefers-color-scheme: light)");
});

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      sm: "430px",
    },
    fontFamily: {
      murecho: ["murecho", "sans-serif"],
    },
  },
  plugins: [daisyui, animate, lightSelectorPlugin],
  // https://daisyui.com/docs/config/
  daisyui: {
    logs: false,
  },
} satisfies Config;
