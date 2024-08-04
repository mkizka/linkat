import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/{**,.client,.server}/**/*.{js,jsx,ts,tsx}"],
  theme: {
    fontFamily: {
      murecho: ["murecho", "sans-serif"],
    },
  },
  plugins: [require("daisyui")],
} satisfies Config;
