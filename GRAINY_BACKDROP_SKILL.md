---
name: grainy-backdrop
description: Reusable grainy gradient backdrop effect with blur. Use for modals, overlays, and full-screen backgrounds throughout the app. Creates sophisticated depth with grain texture, gradient layering, and blur effects.
---

# Grainy Backdrop Skill

A production-ready backdrop effect combining gradient depth, grain texture, and blur. Perfect for modal overlays, transparent backgrounds, and full-screen effects.

## Quick Usage

```jsx
{
  /* Backdrop container */
}
<div className="fixed inset-0 z-40 backdrop-blur-sm">
  {/* Gradient base */}
  <div
    className="absolute inset-0"
    style={{
      background:
        "linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
    }}
  />

  {/* Grain overlay */}
  <div
    className="absolute inset-0 pointer-events-none"
    style={{
      filter: "url(#modal-grain)",
      opacity: 1,
      mixBlendMode: "multiply",
    }}
  />

  {/* Content or close handler */}
  <div className="absolute inset-0" onClick={onClose} />
</div>;
```

## Anatomy

### Layer 1: Blur

- **Class**: `backdrop-blur-sm`
- **Effect**: Softens background content with Tailwind's standard blur
- **Purpose**: Depth and focus shift to foreground

### Layer 2: Gradient

- **Gradient**: `linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))`
- **Colors**:
  - Top: Light gray `rgba(220,220,225,0.5)` — subtle, 50% opacity
  - Middle: Medium gray `rgba(180,180,190,0.6)` — mid-tone, 60% opacity
  - Bottom: Darker gray `rgba(140,140,150,0.8)` — depth anchor, 80% opacity
- **Effect**: Creates dimensional depth from light at top to darker at bottom
- **Purpose**: Visual hierarchy and subtle vignette effect

### Layer 3: Grain

- **Filter**: `url(#modal-grain)` — references SVG filter definition in `index.html`
- **BlendMode**: `multiply` — preserves underlying colors while adding texture
- **Opacity**: `1` — full grain visibility
- **Effect**: Adds fine noise texture for premium feel
- **Purpose**: Organic texture, prevents flat appearance, adds visual interest

## SVG Filter Requirement

Ensure your `index.html` contains the grain filter definition:

```html
<svg style="display:none">
  <filter id="modal-grain">
    <feTurbulence
      type="fractalNoise"
      baseFrequency="0.9"
      numOctaves="4"
      stitchTiles="stitch"
    />
  </filter>
</svg>
```

If not present, add it before the closing `</body>` tag.

## Usage Patterns

### Full-Screen Modal Overlay

```jsx
function MyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm">
      {/* Gradient & Grain */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
        }}
      />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ filter: "url(#modal-grain)", mixBlendMode: "multiply" }}
      />

      {/* Close handler */}
      <div className="absolute inset-0 cursor-pointer" onClick={onClose} />

      {/* Modal Content */}
      <div className="relative bg-white rounded-2xl z-10 w-full max-w-lg p-6">
        {/* Your content here */}
      </div>
    </div>
  );
}
```

### Drawer / Sidebar Context

```jsx
{
  /* Sidebar backdrop */
}
<div
  className="fixed inset-0 z-40 backdrop-blur-sm"
  style={{
    opacity: sidebarOpen ? 1 : 0,
    pointerEvents: sidebarOpen ? "auto" : "none",
    background:
      "linear-gradient(to bottom, rgba(220,220,225,0.5), rgba(180,180,190,0.6), rgba(140,140,150,0.8))",
    transition: "opacity 0.28s cubic-bezier(0.4,0,0.2,1)",
    filter: "url(#modal-grain)",
  }}
  onClick={() => setSidebarOpen(false)}
/>;
```

### Dropdown / Popover Context

```jsx
{
  /* Subtle backdrop for dropdown overlay */
}
<div
  className="fixed inset-0 z-30 backdrop-blur-xs"
  style={{
    background:
      "linear-gradient(to bottom, rgba(220,220,225,0.3), rgba(180,180,190,0.4), rgba(140,140,150,0.5))",
    filter: "url(#modal-grain)",
  }}
  onClick={onClose}
/>;
```

## Customization

### Opacity Control

Adjust the `rgba()` alpha values (0-1) to make the backdrop lighter or darker:

- **Lighter**: Use `0.3, 0.4, 0.5` instead of `0.5, 0.6, 0.8`
- **Darker**: Use `0.7, 0.8, 0.9` for stronger emphasis

### Blur Intensity

- `backdrop-blur-sm` — Light blur, keeps some background visibility
- `backdrop-blur` — Medium blur (Tailwind default)
- `backdrop-blur-lg` — Heavy blur, strong focus shift
- `backdrop-blur-xl` — Maximum blur

### Grain Intensity

Control texture visibility via the SVG filter:

```html
<!-- Subtle grain -->
<filter id="modal-grain-subtle">
  <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="2" />
</filter>

<!-- Heavy grain -->
<filter id="modal-grain-heavy">
  <feTurbulence type="fractalNoise" baseFrequency="1.2" numOctaves="6" />
</filter>
```

Or control opacity via CSS:

```jsx
<div
  style={{
    filter: "url(#modal-grain)",
    opacity: 0.5, // Reduce grain visibility
    mixBlendMode: "multiply",
  }}
/>
```

## Best Practices

1. **Always layer in order**: Blur → Gradient → Grain (bottom to top in stacking context)
2. **Use `pointer-events-none` on grain**: Prevents accidental click interception
3. **Reference `#modal-grain` filter**: Ensure SVG filter exists in DOM
4. **Transition opacity for show/hide**: Use CSS transitions for smooth backdrop reveal
5. **z-index management**: Place backdrop below your modal content (e.g., `z-40` for backdrop, `z-50` for modal)
6. **Click handler**: Include a close-on-click layer for user convenience

## Example Components Using This Skill

- `Modal.jsx` — Reusable modal component ✓
- `CampaignUrlModal` (in CompanyCampaigns.jsx) — Campaign URL sharing modal ✓
- `mainLayout.jsx` — Sidebar backdrop ✓

## Performance Notes

- Grain filter is GPU-accelerated on modern browsers
- `blur` and `mixBlendMode` are performant (hardware acceleration)
- Use `pointer-events-none` on non-interactive layers for optimal rendering

## Browser Compatibility

- ✅ Chrome/Edge 70+
- ✅ Firefox 59+
- ✅ Safari 15.4+
- ⚠️ Older browsers degrade gracefully (backdrop-filter drops, gradient remains)
