import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		// The five named tiers of the responsive system. `xs` and `desk` are
		// additions; the rest keep Tailwind's values so existing prefixes stay
		// meaningful. Each threshold answers a physical constraint, not a round
		// number: `xs` is where a phone stops being cramped, `sm` where four
		// figures with their goal fit across, `lg` where the thumb stops being
		// the cursor, `desk` where a second content column pays for itself.
		screens: {
			xs: "390px",    // poche
			sm: "640px",    // tablette
			md: "768px",
			lg: "1024px",   // portable
			xl: "1280px",
			desk: "1440px", // bureau
			"2xl": "1536px",
		},
		extend: {
			fontSize: {
				label: ["var(--step-label)", { lineHeight: "1.2" }],
				meta: ["var(--step-meta)", { lineHeight: "1.45" }],
				body: ["var(--step-body)", { lineHeight: "1.5" }],
				figure: ["var(--step-figure)", { lineHeight: "1" }],
				title: ["var(--step-title)", { lineHeight: "1.1" }],
				display: ["var(--step-display)", { lineHeight: "1.05" }],
			},
			fontFamily: {
				sans: ['var(--font-outfit)', 'system-ui', 'sans-serif'],
				mono: ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'monospace'],
				display: ['var(--font-display)', 'var(--font-outfit)', 'cursive'],
			},
			boxShadow: {
				'3xl': '0 0 20px rgba(0, 0, 0, 0.2)',
				tile: '0 1px 2px rgba(20, 18, 14, 0.04), 0 4px 16px -8px rgba(20, 18, 14, 0.10)',
				lifted: '0 2px 6px rgba(20, 18, 14, 0.06), 0 18px 40px -22px rgba(20, 18, 14, 0.30)',
			},
			colors: {
				surface: {
					DEFAULT: 'hsl(var(--surface))',
					raised: 'hsl(var(--surface-raised))',
					sunken: 'hsl(var(--surface-sunken))',
					inverted: 'hsl(var(--surface-inverted))',
					'inverted-foreground': 'hsl(var(--surface-inverted-foreground))',
				},
				nav: {
					DEFAULT: 'hsl(var(--nav))',
					foreground: 'hsl(var(--nav-foreground))',
					active: 'hsl(var(--nav-active))',
					'active-foreground': 'hsl(var(--nav-active-foreground))',
				},
				plot: {
					calories: 'hsl(var(--plot-calories))',
					hydration: 'hsl(var(--plot-hydration))',
					weight: 'hsl(var(--plot-weight))',
				},
				track: {
					green: {
						DEFAULT: 'hsl(var(--track-green))',
						soft: 'hsl(var(--track-green-soft))',
						ink: 'hsl(var(--track-green-ink))',
					},
					orange: {
						DEFAULT: 'hsl(var(--track-orange))',
						soft: 'hsl(var(--track-orange-soft))',
						ink: 'hsl(var(--track-orange-ink))',
					},
					blue: {
						DEFAULT: 'hsl(var(--track-blue))',
						soft: 'hsl(var(--track-blue-soft))',
						ink: 'hsl(var(--track-blue-ink))',
					},
					purple: {
						DEFAULT: 'hsl(var(--track-purple))',
						soft: 'hsl(var(--track-purple-soft))',
						ink: 'hsl(var(--track-purple-ink))',
					},
					coral: {
						DEFAULT: 'hsl(var(--track-coral))',
						soft: 'hsl(var(--track-coral-soft))',
						ink: 'hsl(var(--track-coral-ink))',
					},
					yellow: {
						DEFAULT: 'hsl(var(--track-yellow))',
						soft: 'hsl(var(--track-yellow-soft))',
						ink: 'hsl(var(--track-yellow-ink))',
					},
				},
				background: 'hsl(var(--background))',
				foreground: 'hsl(var(--foreground))',
				card: {
					DEFAULT: 'hsl(var(--card))',
					foreground: 'hsl(var(--card-foreground))'
				},
				popover: {
					DEFAULT: 'hsl(var(--popover))',
					foreground: 'hsl(var(--popover-foreground))'
				},
				primary: {
					DEFAULT: 'hsl(var(--primary))',
					foreground: 'hsl(var(--primary-foreground))'
				},
				secondary: {
					DEFAULT: 'hsl(var(--secondary))',
					foreground: 'hsl(var(--secondary-foreground))'
				},
				muted: {
					DEFAULT: 'hsl(var(--muted))',
					foreground: 'hsl(var(--muted-foreground))'
				},
				accent: {
					DEFAULT: 'hsl(var(--accent))',
					foreground: 'hsl(var(--accent-foreground))'
				},
				destructive: {
					DEFAULT: 'hsl(var(--destructive))',
					foreground: 'hsl(var(--destructive-foreground))'
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	},
	plugins: [tailwindcssAnimate],
};
export default config;
