# ReliabilityIQ — Theme & Design Tokens

## Framework
- **Framework**: React 19 + Vite 7
- **CSS**: Tailwind CSS v4 (PostCSS plugin, `@import "tailwindcss"`)
- **No CSS variables / custom tokens** — uses Tailwind utility classes directly
- **Dark mode**: Class-based (`.dark` on `<html>`), custom variant `@custom-variant dark (&:is(.dark *))`
- **Component library**: Custom (no shadcn, MUI, etc.)
- **Icons**: Lucide React
- **Font**: Inter (Google Fonts, weights 400/500/600/700/800)

## Full `src/index.css`

```css
@import "tailwindcss";
@custom-variant dark (&:is(.dark *));

@layer base {
  html {
    margin: 0; padding: 0; width: 100%; height: 100%; min-height: 100vh;
    -webkit-font-smoothing: antialiased;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    background: #ffffff;
  }
  body { margin: 0; padding: 0; width: 100%; height: 100%; min-height: 100vh; background: inherit; }
  #root { margin: 0; padding: 0; width: 100%; min-height: 100vh; }
  html.dark { background: #020617; }
}

@keyframes bell-shake {
  0% { transform: rotate(0); }
  15% { transform: rotate(15deg); }
  30% { transform: rotate(-15deg); }
  45% { transform: rotate(10deg); }
  60% { transform: rotate(-10deg); }
  75% { transform: rotate(5deg); }
  85% { transform: rotate(-5deg); }
  100% { transform: rotate(0); }
}
.animate-bell-shake { animation: bell-shake 0.8s cubic-bezier(.36,.07,.19,.97) both; }

@keyframes fade-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in { animation: fade-in 0.22s ease-out both; }

@keyframes slide-in-right {
  from { opacity: 0; transform: translateX(24px); }
  to   { opacity: 1; transform: translateX(0); }
}
.animate-slide-in-right { animation: slide-in-right 0.28s cubic-bezier(0.25, 0.46, 0.45, 0.94) both; }
```

## Color Palette (Tailwind classes used consistently)

| Role | Light | Dark |
|------|-------|------|
| App background | `#fafafa` / `bg-white` | `#0b1120` / `bg-[#0f172a]` |
| Surface (cards) | `bg-white` | `bg-slate-900` |
| Surface elevated | `bg-slate-50` | `bg-slate-800` |
| Border | `border-slate-200` | `border-slate-800` |
| Text primary | `text-slate-900` / `text-[#0f172a]` | `text-white` |
| Text secondary | `text-slate-500` | `text-slate-400` |
| Brand accent | `text-blue-600` / `bg-blue-600` | `text-blue-400` / `bg-blue-500` |
| Danger | `text-red-600` / `bg-red-500` | `text-red-400` |
| Success | `text-green-600` / `bg-green-500` | `text-green-400` |
| Warning | `text-amber-600` / `bg-amber-500` | `text-amber-400` |

## Typography Scale

| Use | Class |
|-----|-------|
| Page title | `text-[28px] font-bold tracking-tight` |
| Section heading | `text-[22px] font-bold tracking-tight` |
| Card heading | `text-lg font-semibold` |
| Label / sub-heading | `text-[13px] font-bold uppercase tracking-widest` |
| Body | `text-sm` |
| Caption | `text-xs` |

## Border Radius
- Cards/modals: `rounded-xl` / `rounded-2xl`
- Buttons/inputs: `rounded-md` / `rounded-xl`
- Badges/pills: `rounded-full` / `rounded-lg`

## Shadows
- Cards: `shadow-sm`
- Modals: `shadow-2xl`
- Elevation: `hover:shadow-md transition-shadow`
