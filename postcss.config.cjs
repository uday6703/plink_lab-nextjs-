/**
 * CommonJS PostCSS config so Next/Turbopack can require it reliably.
 * Uses the official plugin names expected by Tailwind CSS.
 */
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
