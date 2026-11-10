/** Tailwind preset shared by every Stayflow app. */
export const stayflowPreset = {
  theme: {
    extend: {
      colors: {
        ink: "#0B0F14",
        paper: "#F7F5F0",
        line: "#E4E0D6",
        accent: "var(--accent, #0F766E)",
      },
      fontFamily: {
        sans: ["ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ["ui-serif", "Georgia", "Cambria", "serif"],
      },
      borderRadius: { card: "20px" },
    },
  },
};
