// Tailwind via PostCSS (not a Turbopack rule in next.config): Liara rewrites next.config at build time.
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
