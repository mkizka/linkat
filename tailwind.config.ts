import daisyui from "daisyui";
import type { Config } from "tailwindcss";

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
  plugins: [daisyui],
} satisfies Config;
