/**
 * Type stubs for Calcite Design System web components used in this widget.
 *
 * Two declarations are needed because TypeScript may consult either JSX
 * namespace depending on the EB version's tsconfig:
 *   - Legacy JSX runtime (jsx: "react") looks at the global JSX namespace.
 *   - Automatic JSX runtime (jsx: "react-jsx", default for React 18+/19)
 *     looks at the JSX namespace exported from the 'react' module.
 * EB 1.20 ships React 19 and the automatic runtime, so React.JSX is what
 * matters; the global declaration is kept as a safety net for older
 * compilation paths.
 *
 * Attribute typing is permissive (any). The Calcite reference at
 * developers.arcgis.com/calcite-design-system is the source of truth
 * for what attributes each element accepts.
 */

// React 18+/19 with jsx: "react-jsx"
declare module 'react' {
    namespace JSX {
        interface IntrinsicElements {
            'calcite-popover': any
            'calcite-dialog': any
            'calcite-icon': any
        }
    }
}

// Legacy global JSX namespace (jsx: "react" or @jsx pragma)
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'calcite-popover': any
            'calcite-dialog': any
            'calcite-icon': any
        }
    }
}

// Marks this file as a module so the declare module / declare global blocks
// above are interpreted as augmentations rather than local declarations.
export { }