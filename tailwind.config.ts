import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
	darkMode: ["class"],
	content: [
		"./src/**/*.{js,ts,jsx,tsx,mdx}",
	],
	theme: {
		extend: {
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
				flavoriz: {
					orange: {
						DEFAULT: '#FFA500', // Example, will refine with HSL in globals
						50: '#FFF8E1',
						100: '#FFECB3',
						500: '#FF9800',
						600: '#FB8C00',
					},
					cream: '#FFFDD0',
				},
				border: 'hsl(var(--border))',
				input: 'hsl(var(--input))',
				ring: 'hsl(var(--ring))',
				chart: {
					'1': 'hsl(var(--chart-1))',
					'2': 'hsl(var(--chart-2))',
					'3': 'hsl(var(--chart-3))',
					'4': 'hsl(var(--chart-4))',
					'5': 'hsl(var(--chart-5))'
				}
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
