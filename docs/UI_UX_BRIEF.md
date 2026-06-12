---
title: UI/UX Brief
tags: [beacon, documentation, ui-ux, design]
---

# 🎨 UI/UX Brief & Design System

## 1. Design Aesthetics

BEACON must feel premium, modern, and trustworthy. As a mission-critical operations tool, it should combine clarity with a high-end dynamic feel.

### 1.1 Visual Tone
- **Theme**: Dark Mode by default (Sleek, low eye-strain for operators).
- **Style**: Glassmorphism elements for overlays/modals, subtle gradients, and sharp typography.
- **Responsiveness**: Smooth micro-animations for interactions (hover states, new signals appearing).

### 1.2 Color Palette
- **Background**: Pure Pitch Black (`#000000`) for that classic terminal feel, with subtle deep green glassmorphism layers.
- **Surface**: Translucent panels with blur (Glassmorphism), borders in glowing Matrix green (`#00FF41`).
- **Primary Accent**: Neon Hacker Green (`#00FF41`) for neutral actions and branding.
- **Text Primary**: Terminal Green (`#008F11`).
- **Urgency Colors**:
  - `CRITICAL`: Vibrant Red (`#EF4444`) - used with pulsating animations.
  - `HIGH`: Warning Orange (`#F97316`).
  - `MEDIUM`: Alert Yellow (`#EAB308`).
  - `LOW`: Info Cyan (`#06B6D4`).

### 1.3 Typography
- **Primary Font**: `Inter` or `Outfit` (Google Fonts) for a modern, clean, and highly legible interface.
- **Hierarchy**:
  - `h1`: Bold, large, sometimes with a subtle text-gradient.
  - `body`: Light, readable, well-spaced.
  - `monospace`: For IDs, code snippets, and raw JSON logs (`JetBrains Mono` or `Fira Code`).

## 2. Core Components

1. **Signal Card (The Feed Item)**
   - *Layout*: Compact, scannable.
   - *Elements*: Agent Name, Trigger Type, Urgency Badge, Countdown Timer Bar, Confidence Score visual (progress bar).
   - *Interaction*: Hover lifts the card slightly, click expands to SignalDetail.

2. **Urgency Badge**
   - Solid background for CRITICAL.
   - Outline/subtle background for lower urgencies to prevent UI clutter.

3. **Countdown Timer Bar**
   - Horizontal progress bar at the bottom of the Signal Card.
   - Color shifts to red as time approaches zero.

4. **Context Viewer (Timeline)**
   - Used in SignalDetail to show `steps_taken`.
   - Vertical timeline layout with connected dots.

5. **Decision Panel (Resolution UI)**
   - Large, clear buttons for each `option`.
   - *Consequence* text clearly visible below each option label to prevent mistakes.
   - Distinct styling for destructive vs. safe actions.

## 3. Tech Stack Requirements

- **Framework**: React + Vite
- **Components**: shadcn/ui (connected via MCP) for accessible, high-quality base components.
- **Styling**: Tailwind CSS (with arbitrary values and plugins for glassmorphism/animations, using Matrix theme variables).
- **Icons**: Lucide React.
- **Charts**: Recharts for Analytics.
