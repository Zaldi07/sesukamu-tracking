---
version: "alpha"
name: "Aura - Intelligent Hub"
description: "Aura Intelligent Login Section is designed for authenticating users through a focused access flow. Key features include reusable structure, responsive behavior, and production-ready presentation. It is suitable for authentication screens in web products."
colors:
  primary: "#10B981"
  secondary: "#F59E0B"
  tertiary: "#8B5CF6"
  neutral: "#000000"
  background: "#FFFFFF"
  surface: "#10B981"
  text-primary: "#374151"
  text-secondary: "#000000"
  border: "#FFFFFF"
  accent: "#10B981"
typography:
  display-lg:
    fontFamily: "Geist"
    fontSize: "120px"
    fontWeight: 300
    lineHeight: "120px"
    letterSpacing: "-0.05em"
  body-md:
    fontFamily: "Geist"
    fontSize: "14px"
    fontWeight: 500
    lineHeight: "20px"
  label-md:
    fontFamily: "System Font"
    fontSize: "16px"
    fontWeight: 400
    lineHeight: "24px"
rounded:
  md: "4px"
spacing:
  base: "4px"
  sm: "4px"
  md: "8px"
  lg: "10.4px"
  xl: "12px"
  gap: "4px"
  section-padding: "40px"
components:
  button-primary:
    backgroundColor: "{colors.neutral}"
    textColor: "{colors.background}"
    typography: "{typography.label-md}"
    rounded: "{rounded.md}"
    padding: "0px"
  button-link:
    textColor: "{colors.text-primary}"
    typography: "{typography.body-md}"
    rounded: "0px"
    padding: "0px"
---

## Overview

- **Composition cues:**
  - Layout: Flex
  - Content Width: Full Bleed
  - Framing: Glassy
  - Grid: Minimal

## Colors

The color system uses light mode with #9E3240 as the main accent and #000000 as the neutral foundation.

- **Primary (#9E3240):** Main accent and emphasis color (Crimson brand color).
- **Secondary (#FDA4AF):** Supporting accent for secondary emphasis (Soft pink/rose).
- **Tertiary (#E11D48):** Reserved accent for supporting contrast moments (Rose red).
- **Neutral (#000000):** Neutral foundation for backgrounds, surfaces, and supporting chrome.

- **Usage:** Background: #FFFFFF; Surface: #9E3240; Text Primary: #374151; Text Secondary: #000000; Border: #FFFFFF; Accent: #9E3240

## Typography

Typography pairs Geist for display hierarchy with System Font for supporting content and interface copy.

- **Display (`display-lg`):** Geist, 120px, weight 300, line-height 120px, letter-spacing -0.05em.
- **Body (`body-md`):** Geist, 14px, weight 500, line-height 20px.
- **Labels (`label-md`):** System Font, 16px, weight 400, line-height 24px.

## Layout

Layout follows a flex composition with reusable spacing tokens. Preserve the flex, full bleed structural frame before changing ornament or component styling. Use 4px as the base rhythm and let larger gaps step up from that cadence instead of introducing unrelated spacing values.

Treat the page as a flex / full bleed composition, and keep that framing stable when adding or remixing sections.

- **Layout type:** Flex
- **Content width:** Full Bleed
- **Base unit:** 4px
- **Scale:** 4px, 8px, 10.4px, 12px, 16px, 24px, 32px, 40px
- **Section padding:** 40px
- **Gaps:** 4px, 12px, 16px, 24px

## Elevation & Depth

Depth is communicated through glass, border contrast, and reusable shadow or blur treatments. Keep those recipes consistent across hero panels, cards, and controls so the page reads as one material system.

Surfaces should read as glass first, with borders, shadows, and blur only reinforcing that material choice.

- **Surface style:** Glass
- **Borders:** 2.4px #FFFFFF; 2.4px #000000; 0.8px #F3F4F6; 2.4px #8B5CF6
- **Shadows:** rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 1px 2px 0px
- **Blur:** 12px

## Shapes

Shapes rely on a tight radius system anchored by 4px and scaled across cards, buttons, and supporting surfaces. Icon geometry should stay compatible with that soft-to-controlled silhouette.

Use the radius family intentionally: larger surfaces can open up, but controls and badges should stay within the same rounded DNA instead of inventing sharper or pill-only exceptions.

- **Corner radii:** 4px, 6px, 9999px
- **Icon treatment:** Linear
- **Icon sets:** Solar

## Components

Anchor interactions to the detected button styles.

### Buttons
- **Primary:** background #000000, text #FFFFFF, radius 4px, padding 0px, border 0px solid rgb(229, 231, 235).
- **Links:** text #374151, radius 0px, padding 0px, border 0px solid rgb(229, 231, 235).

### Iconography
- **Treatment:** Linear.
- **Sets:** Solar.

## Do's and Don'ts

Use these constraints to keep future generations aligned with the current system instead of drifting into adjacent styles.

### Do
- Do use the primary palette as the main accent for emphasis and action states.
- Do keep spacing aligned to the detected 4px rhythm.
- Do reuse the Glass surface treatment consistently across cards and controls.
- Do keep corner radii within the detected 4px, 6px, 9999px family.

### Don't
- Don't introduce extra accent colors outside the core palette roles unless the page needs a new semantic state.
- Don't mix unrelated shadow or blur recipes that break the current depth system.
- Don't exceed the detected moderate motion intensity without a deliberate reason.

## Motion

Motion feels controlled and interface-led across text, layout, and section transitions. Timing clusters around 150ms and 300ms. Easing favors ease and cubic-bezier(0.4. Hover behavior focuses on text and color changes.

**Motion Level:** moderate

**Durations:** 150ms, 300ms, 2000ms

**Easings:** ease, cubic-bezier(0.4, 0, 1), 0.2, 0.6

**Hover Patterns:** text, color, transform, shadow

## WebGL

Reconstruct the graphics as a full-bleed background field using webgl, custom shaders. The effect should read as technical, meditative, and atmospheric: dot-matrix particle field with white and sparse spacing. Build it from dot particles + soft depth fade so the effect reads clearly. Animate it as slow breathing pulse. Interaction can react to the pointer, but only as a subtle drift. Preserve dom fallback.

**Id:** webgl

**Label:** WebGL

**Stack:** WebGL

**Insights:**
  - **Scene:**
    - **Value:** Full-bleed background field
  - **Effect:**
    - **Value:** Dot-matrix particle field
  - **Primitives:**
    - **Value:** Dot particles + soft depth fade
  - **Motion:**
    - **Value:** Slow breathing pulse
  - **Interaction:**
    - **Value:** Pointer-reactive drift
  - **Render:**
    - **Value:** WebGL, custom shaders

**Techniques:** Dot matrix, Breathing pulse, Pointer parallax, Shader gradients, Noise fields

**Code Evidence:**
  - **HTML reference:**
    - **Language:** html
    - **Snippet:**
      ```html
      <!-- WebGL Background -->
      <canvas id="webgl-canvas" class="fixed inset-0 w-full h-full pointer-events-none z-0 opacity-[0.25]"></canvas>

      <!-- Header -->
      ```
