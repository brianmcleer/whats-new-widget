# What's New widget (Experience Builder 1.20)

A notification-bell widget for ArcGIS Experience Builder that announces new
features or updates to users. Tiny bell, red dot, click to reveal the
announcement, dot disappears once the user has seen it. When the next
update is published, the dot returns for everyone on their next visit.

The widget uses the Calcite Design System for the popover and dialog
(`calcite-popover`, `calcite-dialog`, `calcite-icon`), so positioning,
theming, RTL, and accessibility behavior come from Calcite for free. The
bell itself is a small custom button so the icon can be sized to any
pixel value, which `calcite-action` does not allow.

## Credits

Authors: Brian McLeer and Lucius Creamer.

The Calcite design integration is based on a community rework by
SunshineLuke90 in the Esri Community thread:
https://community.esri.com/t5/experience-builder-custom-widgets/what-s-new-widget/ba-p/1702352

The announcement-ID re-notification system, the localStorage seen-state,
and the settings layout are from the original widget by the City of Grand
Junction GIS Division.

## Folder layout

```
whats-new/
├── package.json
├── package-lock.json
├── manifest.json
├── config.json
├── icon.svg
├── README.md
├── LICENSE
├── .gitignore
├── .npmignore
└── src/
    ├── config.ts
    ├── calcite-elements.d.ts    <- TypeScript types for Calcite web components
    ├── runtime/
    │   └── widget.tsx
    └── setting/
        └── setting.tsx
```

## Install

1. Drop the `whats-new/` folder directly into your Experience Builder
   install at:
   ```
   client/your-extensions/widgets/whats-new/
   ```
   The `manifest.json` must sit directly inside that path, **not** nested
   a second level deep like `widgets/whats-new/whats-new/manifest.json`.
   Nesting is the most common cause of a widget not registering. See the
   troubleshooting section below if you hit it.

2. In the `client` folder, run `npm install`. This is the standard EB
   step that picks up dependencies for any widget under `your-extensions`.
   The What's New widget itself ships with no direct dependencies (it uses
   Calcite components already bundled with Experience Builder), but
   running `npm install` keeps the EB tooling happy and resolves any
   peer libraries.

3. Restart the client build (`npm start`).

4. In the Experience designer, the widget appears under "Custom" as
   **What's New**.

## How the unseen dot works

Each user's view state is stored in `localStorage` under
`whatsnew:<widgetId>:seen`. The stored value is the current
`announcementId`.

- On render, the widget compares the stored ID to the configured
  `announcementId`. If they differ (or nothing is stored), the dot shows.
- Clicking the bell writes the current `announcementId` to localStorage
  and hides the dot.
- To re-notify everyone, **bump the Announcement ID** in the widget
  settings. The settings panel has a **New ID** button that drops in a
  timestamp in `YYYY-MM-DD-HHMM` format and shows a "Last published" date
  below the field.

The override **Always show dot** keeps the dot visible permanently, useful
if you want a static "news / help" affordance instead of a one-time
notification.

## Content modes

**Rich HTML.** Paste HTML directly into the settings textarea. Rendered
with `dangerouslySetInnerHTML`. Admin-authored, not user-submitted.

**External link.** Point at any URL.
- With **Open in new tab** off, the URL loads in an iframe inside the
  popover/dialog. Note that sites with `X-Frame-Options: DENY` or a
  `frame-ancestors` CSP will render blank. If the panel is empty, switch
  to "new tab" or use Rich HTML.
- With **Open in new tab** on, clicking the bell opens the URL in a new
  tab and immediately marks the announcement seen. No panel is rendered.

## Display modes

- **Popover.** `calcite-popover` anchored to the bell. Width is
  configurable via the `Content width` field. Placement is configurable
  via the `Popover placement` dropdown (auto, top, bottom-end,
  leading-start, etc., using Calcite's full set of logical placements).
- **Modal.** `calcite-dialog` centered overlay with a backdrop, sized
  medium. Better for longer announcements or embedded iframes.

## Icon

The bell glyph can be any icon name from the Calcite UI Icons set. See
https://developers.arcgis.com/calcite-design-system/icons/ for the full
icon list. Paste the exact name shown on that page into the **Icon**
field in the widget settings (e.g. `bell`, `bell-f`, `chevron-right`).

The settings panel shows a live preview next to the field as you type.
If the preview goes blank, the name is not recognized. Default is
`bell-f` (filled bell).

### Icon size

The **Icon size (px)** field next to the icon name takes any pixel value
between 12 and 64 (default 24). Use the up/down arrows or type a number
directly. The preview swatch in settings resizes to match, so you can see
the exact size before saving. The indicator dot scales proportionally
with the icon (about 32% of the icon size, with an 8px minimum so it
stays visible at small sizes).

## Accessibility

The bell button has an `aria-label` that includes the unseen state, plus
`aria-haspopup` and `aria-expanded` tied to the popover or dialog. The
indicator dot is `aria-hidden` so screen readers do not announce it
separately. `calcite-popover` and `calcite-dialog` provide the
appropriate dialog roles and focus trapping while open. Escape closes
both modes; the button is keyboard accessible with a visible focus ring.

## Troubleshooting

### `<name> is duplicated` on `npm start`

Experience Builder is seeing two copies of the widget. A single,
correctly placed copy can't duplicate itself, so a second copy is sitting
somewhere in the install.

Check in this order:

1. **Nested folder.** The most common cause. The `manifest.json` must sit
   directly inside `widgets/whats-new/`, not at
   `widgets/whats-new/whats-new/`. Common when a zip is extracted into a
   folder that already has the widget's name.
2. **Leftover folder** from an earlier build, including any `-copy`
   suffix or an old folder under a previous name if the widget was
   renamed.
3. **Stale compiled build.** Stop the client server, delete the matching
   folder under `client\dist\widgets\whats-new`, then start again.

If removing one copy makes the widget disappear from EB's Entrypoint list
entirely, the copy that remains is nested too deep. Move it so the
manifest sits directly inside the widget folder.

## License

Apache-2.0. See [LICENSE](LICENSE).