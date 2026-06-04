import type { ImmutableObject } from 'seamless-immutable'

export type ContentMode = 'link' | 'html'
export type DisplayMode = 'popover' | 'modal'

export const placements = [
    'auto',
    'auto-start',
    'auto-end',
    'top',
    'top-start',
    'top-end',
    'bottom',
    'bottom-start',
    'bottom-end',
    'right',
    'right-start',
    'right-end',
    'left',
    'left-start',
    'left-end',
    'leading-start',
    'leading',
    'leading-end',
    'trailing-end',
    'trailing',
    'trailing-start'
] as const

export type LogicalPlacement = (typeof placements)[number]

export interface Config {
    /** Bump this to re-show the red dot for every user (e.g. '2026-05-15-1742') */
    announcementId: string
    /** Header text shown above the panel and as aria-label on the bell */
    title: string
    /** 'link' = open URL (iframe or new tab); 'html' = render configured HTML */
    contentMode: ContentMode
    /** Used when contentMode === 'link' */
    linkUrl: string
    /** When true and mode is link, opens in a new tab instead of iframe */
    openInNewTab: boolean
    /** Used when contentMode === 'html' (rendered with dangerouslySetInnerHTML) */
    htmlContent: string
    /** Where the content panel appears */
    displayMode: DisplayMode
    /** Hex color for the bell icon (blank uses the Calcite default) */
    bellColor: string
    /** Hex color for the notification dot (blank uses the Calcite red) */
    dotColor: string
    /** If true, dot is shown even after the user views the announcement */
    showDotAlways: boolean
    /** calcite-ui-icons name for the bell button */
    icon: string
    /** Icon size in pixels (default 24) */
    iconSize: number
    /** Width of the popover content in pixels (popover mode only) */
    contentWidth: number
    /** Logical placement of the popover relative to the bell (popover mode only) */
    placement: LogicalPlacement
}

export type IMConfig = ImmutableObject<Config>