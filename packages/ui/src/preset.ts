/** Tailwind preset shared by every Stayflow app. Colors read the theme variables in theme.css. */
const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export const stayflowPreset = {
  theme: {
    extend: {
      colors: {
        bg: token("bg"),
        surface: token("surface"),
        surface2: token("surface-2"),
        line: token("line"),
        fg: token("fg"),
        muted: token("muted"),
        accent: token("accent"),
        accent2: token("accent-2"),
        onaccent: token("on-accent"),
        danger: token("danger"),
        success: token("success"),
      },
      fontFamily: {
        sans: ['"Inter Variable"', "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"],
        display: ['"Plus Jakarta Sans Variable"', '"Inter Variable"', "ui-sans-serif", "system-ui", "sans-serif"],
      },
      borderRadius: { card: "22px" },
    },
  },
};
