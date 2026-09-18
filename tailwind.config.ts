import typography from "@tailwindcss/typography";
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
  // daisyuiはdaisyui v5に型定義が無いため app/tailwind.css の @plugin で読み込む
  plugins: [typography, animate, lightSelectorPlugin],
} satisfies Config;
