---
name: Domestic Harmony
colors:
  surface: '#f8f9ff'
  surface-dim: '#d0dbed'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e6eeff'
  surface-container-high: '#dee9fc'
  surface-container-highest: '#d9e3f6'
  on-surface: '#121c2a'
  on-surface-variant: '#41474e'
  inverse-surface: '#27313f'
  inverse-on-surface: '#eaf1ff'
  outline: '#72787f'
  outline-variant: '#c1c7cf'
  surface-tint: '#316289'
  primary: '#074469'
  on-primary: '#ffffff'
  primary-container: '#2a5c82'
  on-primary-container: '#a5d4ff'
  inverse-primary: '#9ccbf7'
  secondary: '#585f6c'
  on-secondary: '#ffffff'
  secondary-container: '#dce2f3'
  on-secondary-container: '#5e6572'
  tertiary: '#3e4143'
  on-tertiary: '#ffffff'
  tertiary-container: '#56585a'
  on-tertiary-container: '#cdced0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#cde5ff'
  primary-fixed-dim: '#9ccbf7'
  on-primary-fixed: '#001d32'
  on-primary-fixed-variant: '#124a6f'
  secondary-fixed: '#dce2f3'
  secondary-fixed-dim: '#c0c7d6'
  on-secondary-fixed: '#151c27'
  on-secondary-fixed-variant: '#404754'
  tertiary-fixed: '#e1e2e4'
  tertiary-fixed-dim: '#c5c6c8'
  on-tertiary-fixed: '#191c1e'
  on-tertiary-fixed-variant: '#444749'
  background: '#f8f9ff'
  on-background: '#121c2a'
  surface-variant: '#d9e3f6'
typography:
  h1:
    fontFamily: Inter
    fontSize: 36px
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.02em
  h2:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  h3:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: '1.4'
    letterSpacing: '0'
  body-lg:
    fontFamily: Inter
    fontSize: 18px
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: '0'
  body-md:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: '0'
  label-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: '1.4'
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '600'
    lineHeight: '1.2'
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  unit: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 20px
  margin: 32px
  max_width: 1440px
---

## Brand & Style

The brand personality for this design system is centered on **reliability, warmth, and quiet efficiency**. It aims to reduce the mental load of household management by providing a "digital sanctuary" that feels both organized and inviting. The target audience includes busy families and multi-person households who require high utility without the coldness of traditional enterprise software.

The chosen style is **Corporate / Modern** with a soft, **Tactile** edge. It leans into a refined, balanced aesthetic inspired by high-end home appliance interfaces and modern architectural interiors. The UI avoids unnecessary flash, focusing instead on sturdy structural elements, generous whitespace, and a sense of physical permanence that evokes trust.

## Colors

This design system utilizes a "Homely & Organized" palette. The **Primary Blue** is deep and stable, providing a sense of security. The **Secondary Grays** are warm-toned to prevent the interface from feeling clinical. 

- **Primary (#2A5C82):** Used for key actions, active states, and branding.
- **Surface Warm (#F9FAFB):** A soft, off-white background that reduces eye strain during daily use.
- **Accents:** Success and error colors are saturated and clear, ensuring that critical household alerts (e.g., "Door Unlocked" or "Bill Overdue") are immediately legible.
- **Neutral:** A range of deep charcoals for high-contrast typography and iconography.

## Typography

The design system uses **Inter** for its exceptional legibility and neutral, systematic character. The hierarchy is optimized for data-dense dashboards where information must be scanned quickly.

- **Headlines:** Use tight letter-spacing and bold weights to anchor page sections.
- **Body Text:** Uses a generous line height (1.5–1.6) to ensure comfort during long reading sessions, such as reviewing household manuals or chore lists.
- **Labels:** Uppercase or medium-weight labels are used for metadata and utility information to distinguish them clearly from primary content.

## Layout & Spacing

The layout follows a **Fixed Grid** model on desktop to maintain a sense of order and "containment," transitioning to a fluid model on tablets and mobile. 

- **Grid:** A 12-column system with 20px gutters. 
- **Rhythm:** An 8px base unit (4px for micro-adjustments) governs all padding and margins. 
- **Containers:** Content is grouped into logical "rooms" or zones using cards, with consistent 24px internal padding to create a spacious, airy feel that prevents the UI from feeling cluttered.

## Elevation & Depth

To convey a sense of sturdiness, this design system uses **Tonal Layers** combined with **Ambient Shadows**. 

- **Level 0 (Base):** The `surface_warm` background.
- **Level 1 (Cards):** Pure white backgrounds with a very soft, diffused shadow (0px 4px 20px rgba(0,0,0,0.05)). This represents the "floor" where most interaction happens.
- **Level 2 (Modals/Popovers):** Elevated with a more pronounced shadow to indicate temporary priority.
- **Depth:** Subtle 1px borders in a light warm-gray are used instead of heavy shadows to define boundaries, maintaining a modern, flat-but-tactile aesthetic.

## Shapes

The shape language is **Rounded**, utilizing a 0.5rem (8px) base radius. This strikes a balance between the precision of a "system" and the softness of a "home." 

- **Standard Elements:** Buttons and input fields use 8px corners.
- **Large Containers:** Dashboard widgets and main cards use 16px (`rounded-lg`) to appear friendlier and more approachable.
- **Interactive Indicators:** Small badges or status dots remain circular to stand out against the geometric grid.

## Components

Components are designed to be "sturdy"—large enough for easy tapping on tablets in a kitchen setting, but precise enough for desktop use.

- **Buttons:** High-contrast primary buttons with white text. Secondary buttons use a light gray ghost style with a subtle border.
- **Input Fields:** Thick 1px borders that darken on focus. Labels are always visible above the field to ensure accessibility.
- **Cards:** The primary container. Cards should have a white background, 16px corner radius, and a subtle border.
- **Status Chips:** Small, rounded pills used for "Completed," "Pending," or "High Priority." They use the success/error colors with a 10% opacity background of the same hue.
- **Data Lists:** Used for chores and groceries. These feature high-contrast dividers and large checkboxes for "fat-finger" accessibility.
- **Household-Specific Components:** 
    - **Quick-Action Tiles:** Large, square buttons for common tasks like "Add Milk" or "Check Thermostat."
    - **Progress Meters:** Thick, rounded bars for budget tracking or goal completion.
