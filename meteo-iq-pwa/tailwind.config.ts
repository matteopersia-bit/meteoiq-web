import type { Config } from "tailwindcss";
export default { content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"], theme: { extend: { colors: { ink: "#172333", mist: "#F4F7FA", aqua: "#0A8E91" }, boxShadow: { soft: "0 12px 35px rgba(23,35,51,.08)" } } }, plugins: [] } satisfies Config;
