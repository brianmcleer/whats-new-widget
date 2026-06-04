# What's New widget

ArcGIS Experience Builder custom widget that adds a bell-and-red-dot
notification pattern to public-facing map applications. Click the bell to
see what's new, dot disappears across browser sessions until the next
announcement is published.

Uses the [Calcite Design System](https://developers.arcgis.com/calcite-design-system/)
for the popover and dialog (`calcite-popover`, `calcite-dialog`,
`calcite-icon`), so positioning, theming, RTL, and accessibility come
from Calcite for free. The bell button is a small custom React
component so the icon can be sized to any pixel value.

**Authors:** Brian McLeer and Lucius Creamer.

**Esri Community post:**
https://community.esri.com/t5/experience-builder-custom-widgets/what-s-new-widget/ba-p/1702352

The Calcite design integration is based on a community rework by
SunshineLuke90 in the thread above. The announcement-ID re-notification
system, the localStorage seen-state, and the settings layout are from the
original widget by the City of Grand Junction GIS Division.

## Features

- Bell icon with a red dot when there's a new announcement
- Click opens a popover anchored to the bell, or a centered modal
- Content is either Rich HTML pasted into the settings, or an external URL
- Red dot disappears once the user clicks, stays gone across sessions
- One-click **New ID** button in settings to re-notify all users
- Configurable Calcite icon (any name from the Calcite UI Icons set) with
  a live preview in settings
- Configurable icon size in pixels (12 to 64, with up/down arrows or
  direct entry); indicator dot scales with the icon
- Configurable popover placement (21 logical placements)
- Configurable icon and dot colors via Calcite color pickers
- Pure client-side, no backend, no server-side state

## Repo layout

```
whats-new-widget/
├── README.md            <- this file (GitHub landing page)
├── LICENSE              <- Apache-2.0
├── .gitignore
├── publish.ps1          <- automation script (see below)
└── whats-new/           <- the actual widget (drops into your-extensions/widgets)
    ├── package.json
    ├── package-lock.json
    ├── manifest.json
    ├── config.json
    ├── icon.svg
    ├── README.md        <- install + usage guide that travels with the widget
    ├── LICENSE
    ├── .gitignore
    ├── .npmignore
    └── src/
        ├── config.ts
        ├── calcite-elements.d.ts
        ├── runtime/
        │   └── widget.tsx
        └── setting/
            └── setting.tsx
```

## Install (end-users)

Grab the latest `whats-new.zip` from the
[Releases](../../releases) page (or from the Esri Community post above),
extract it, and drop the `whats-new/` folder into your EB install at
`client/your-extensions/widgets/whats-new/`. Then run `npm install` in the
`client` folder and restart.

Full install steps and troubleshooting are in
[`whats-new/README.md`](whats-new/README.md).

## Publishing updates (Brian)

The automation script `publish.ps1` syncs the latest widget files from the
EB folder into this repo's `whats-new/` subfolder, commits, and pushes to
GitHub. Optionally cuts a tagged release with a downloadable zip.

```
# Normal code update
powershell -ExecutionPolicy Bypass -File .\publish.ps1

# Code update plus a new release
powershell -ExecutionPolicy Bypass -File .\publish.ps1 -Release v1.2.0
```

First run auto-creates the GitHub repo via `gh` CLI. Subsequent runs just
push. The script reads from
`C:\arcgis-experience-builder-1.20\client\your-extensions\widgets\whats-new`.
Edit the three variables at the top of `publish.ps1` if any of that changes.

## Version compatibility

Built and tested on Experience Builder Developer Edition 1.20. EB 1.19
should also work (same React 19 boundary). EB 1.18 and earlier are not
supported.

## License

Apache-2.0. See [LICENSE](LICENSE).
