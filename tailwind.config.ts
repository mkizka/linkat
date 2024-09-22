import daisyui from "daisyui";
import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    screens: {
      sm: "430px",
    },
    fontFamily: {
      murecho: ["murecho", "sans-serif"],
    },
    extend: {
      colors: {
        bluesky: "#0285FF",
      },
    },
  },
  plugins: [daisyui, animate],
  // https://daisyui.com/docs/config/
  daisyui: {
    logs: false,
  },
} satisfies Config;
