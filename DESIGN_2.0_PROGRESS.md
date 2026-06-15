# Design 2.0 - Warm Editorial Reskin Progress

## Current Status
**Branch:** `design-2.0`  
**Date Started:** 2026-06-15  
**Last Updated:** 2026-06-15

---

## What Has Been Done ✅

### 1. Design Specification Reviewed
- Read full README.md from `/Users/andrew/Downloads/design_handoff_exo_warm_editorial/`
- Understood complete design spec including:
  - New color palette (warm editorial theme)
  - Typography requirements (Schibsted Grotesk + Space Mono)
  - Component styling details (shadows, radius, spacing)
  - Desktop 3-column layout and mobile bottom-sheet layout

### 2. CSS Color Tokens Updated
- **File:** `frontend/src/index.css`
- **Changes Made:**
  - Added Google Fonts import: Schibsted Grotesk (400/500/600/700/800) + Space Mono (400/700)
  - Replaced old color tokens (cobalt, indigo, blue, orange) with new warm editorial palette
  - Created new CSS variables:
    - `--canvas: #faf4ea` (page background)
    - `--surface: #fbf7f0` (cards, buttons)
    - `--ink: #2a2520` (dark nav, headlines)
    - `--ink-on-dark: #faf4ea` (light text on dark)
    - `--text: #5b5750` (body text)
    - `--muted: #8a7f70` (secondary text)
    - `--muted-2: #9a8d7b` (tertiary text)
    - `--terracotta: #c75b3f` (primary accent)
    - `--terracotta-press: #b34e34` (pressed state)
    - `--terracotta-tint: rgba(199, 91, 63, 0.1)` (light background)
    - `--honey: #dba23f` (star ratings)
    - `--honey-text: #bb7e22` (rating numbers)
    - `--sage: #6f8f6a` (Call button, secondary)
    - Plus border, map, and nav muted colors
  - Mapped legacy tokens to new values for backward compatibility
  - Build successful: ✅ `✓ built in 197ms`

### 3. Task List Created
Created 13 implementation tasks in task management system:
1. ✅ Design 2.0 - Main Implementation (overall tracking)
2. ✅ Update nav bar styling (COMPLETE - d72923a)
3. ✅ Update primary button colors (COMPLETE - e3005f9)
4. ✅ Update card backgrounds and borders (COMPLETE - d1a5e67)
5. 🔄 Update text colors throughout app (IN PROGRESS - FilterBar d960b83, VenueCard 54a1f31)
6. ⏳ Update rating stars and price display
7. ⏳ Update form inputs and filters
8. ⏳ Update shadows and spacing
9. ⏳ Update mobile venue sheet styling
10. ⏳ Update map styling
11. ⏳ Update admin panel styling
12. ⏳ Test responsive design
13. ⏳ Test cross-browser compatibility

---

## What Needs to Be Done ❌

### Component Styling Updates (Priority Order)

#### HIGH PRIORITY - Most Visible
1. **Nav Bar (DiscoveryView.tsx, line 115)**
   - Change background from `#1e3a8a` → `--ink` (#2a2520)
   - Update logo color to `--ink-on-dark`
   - Update admin/logout icons to `--nav-muted`
   - Font: Schibsted Grotesk 800 for "EXO"
   - Height: 64px (desktop) / status-bar aware (mobile)

2. **Primary Buttons**
   - **Plan My Itinerary & Start Here:** `--terracotta` fill, white text, shadow: `0 14px 26px -14px rgba(199,91,63,0.7)`
   - **Call Button:** `--sage` fill, white text, shadow: `0 12px 22px -14px rgba(111,143,106,0.8)`
   - **Directions Button:** `--surface` fill, `--border-strong` border, `--ink` text
   - Radius: 13px
   - Weights: 15.5px / 600

3. **Venue Cards (VenueCard.tsx)**
   - Background: `--surface` (#fbf7f0)
   - Border: 1px `--border` (#ece0cd)
   - Radius: 14-18px
   - Card shadow: `0 16px 34px -22px rgba(74,56,36,0.4)`
   - Selected card: `--terracotta` fill, white text
   - Category pill: `--terracotta-tint` bg, `--terracotta-press` text, fully round (100px)

4. **Text Colors**
   - Headlines: `--ink` (#2a2520), 700 weight
   - Body text: `--text` (#5b5750), 400-600 weight
   - Secondary: `--muted` (#8a7f70)
   - Tertiary: `--muted-2` (#9a8d7b)
   - Mono labels: `--mono-label` (#a4937a), UPPERCASE, Space Mono font

5. **Rating Stars & Price**
   - Filled stars: `--honey` (#dba23f)
   - Empty stars: `--star-empty` (#e7dcc9)
   - Rating number: `--honey-text` (#bb7e22), 700 weight
   - Price ($$): `--sage` (#6f8f6a), 700 weight

#### MEDIUM PRIORITY
6. Mobile venue sheet styling (MobileVenueSheet.tsx)
7. Form inputs and filters
8. Map styling
9. Admin panel (AdminPanel.tsx)
10. Shadows and spacing refinements

#### LOW PRIORITY - Testing
11. Responsive design testing (402px mobile, 1280px desktop)
12. Cross-browser testing (Chrome, Safari, Firefox)

---

## Implementation Approach

### Strategy
1. **Bottom-Up Component Updates**
   - Start with smallest components (buttons, badges, pills)
   - Move up to containers (cards, sheets)
   - Finally update layout components (nav, sidebar)
   - This ensures dependencies are satisfied first

2. **File-by-File Updates**
   - Systematically visit each component file
   - Update className Tailwind colors
   - Replace inline style color values
   - Test build after each major component

3. **Color Mapping**
   - Use CSS custom properties (--var-name) in components where possible
   - For Tailwind classes: Map color names to new palette
   - Example: `bg-blue-600` → `bg-[#c75b3f]` (or create Tailwind theme override)

4. **Typography Updates**
   - Apply Schibsted Grotesk globally (likely in body or base layer)
   - Apply Space Mono to: mono labels, badge text, dates, uppercase labels
   - Update font-weight values to match spec (700 for headlines, 600 for buttons, etc.)

5. **Testing Checkpoints**
   - After nav bar: verify colors load, fonts display
   - After buttons: verify shadows and colors on click
   - After cards: verify spacing and borders
   - Final: responsive and cross-browser

### Key Files to Modify
- `frontend/src/index.css` ✅ (color tokens added)
- `frontend/src/components/DiscoveryView.tsx` (nav bar)
- `frontend/src/components/VenueCard.tsx` (card styling)
- `frontend/src/components/MobileVenueSheet.tsx` (mobile sheet)
- `frontend/src/components/VenueDetailPanel.tsx` (desktop detail)
- `frontend/src/components/AdminPanel.tsx` (admin interface)
- `frontend/src/components/FilterBar.tsx` (filters)
- `frontend/src/components/BottomSheet.tsx` (sheet styling)
- Any other component files with hardcoded colors or styles

### Important Notes
- **NO FUNCTIONALITY CHANGES** - Only styling and colors
- **Keep all existing HTML structure** - Don't rename elements or change layout
- **Build must pass** after each major update
- **Test on mobile simulator** while implementing mobile components
- **Commit frequently** with clear messages (e.g., "Update nav bar styling")
- **Reference design spec** for exact color/shadow values: `/Users/andrew/Downloads/design_handoff_exo_warm_editorial/README.md`

---

## Next Steps When Returning

1. **Pick up where we left off:**
   - Branch: `design-2.0` is already checked out
   - Colors tokens are in place
   - Starting task: Update nav bar styling (task #2)

2. **Immediate next action:**
   - Decide on Approach A, B, or C (see below):
     - **A) Create dedicated design tokens file first** (advanced CSS approach)
     - **B) Start directly updating components** (faster, more pragmatic)
     - **C) Focus on visible components first** (quick visual wins)

3. **Then execute:**
   - Update DiscoveryView.tsx nav bar colors
   - Build and test
   - Move to next component (buttons)
   - Continue systematically through task list

4. **When complete:**
   - Merge `design-2.0` → `main`
   - Deploy to Render for live testing

---

## Commands Reference

**Build frontend:**
```bash
cd /Users/andrew/Desktop/development/exo/frontend && npm run build
```

**Git workflow:**
```bash
git status                           # Check current state
git add <file>                       # Stage changes
git commit -m "message"              # Commit
git push origin design-2.0           # Push branch
```

**Switch branches:**
```bash
git checkout main                    # Back to main
git checkout design-2.0              # Back to design work
```

**View task list:**
```bash
# Tasks are managed in the task system
```

---

## Design File Location
`/Users/andrew/Downloads/design_handoff_exo_warm_editorial/README.md` - Full spec with exact colors, shadows, spacing, typography

---

## Estimated Effort
- 13 tasks created
- ~6-8 component files to update heavily
- ~20-30 smaller updates across utility components
- Total: ~2-4 hours of implementation + testing

**Assumption:** Working systematically, not in parallel.
