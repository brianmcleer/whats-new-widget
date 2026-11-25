import type { ImmutableObject } from 'seamless-immutable'

export type ContentMode = 'link' | 'html'
export type DisplayMode = 'popover' | 'modal'
export type ActionSize = 's' | 'm' | 'l'
export type FeedAudience = '' | 'internal' | 'external'

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
    /** Icon size (small, medium, large) */
    iconSize: ActionSize
    /** Width of the popover content in pixels (popover mode only) */
    contentWidth: number
    /** Logical placement of the popover relative to the bell (popover mode only) */
    placement: LogicalPlacement
    /**
     * Notification feed: REST URL of a public hosted table (.../FeatureServer/0).
     * Blank turns the feed off and the widget behaves as it did before 1.2.0.
     */
    feedUrl?: string
    /** Which audience this app belongs to: '', 'internal' or 'external' */
    feedAudience?: FeedAudience
    /** This app's tag, matched against a message's apps list (e.g. 'city-map') */
    feedAppTag?: string
    /** Minutes between feed checks while the app is open (0 = on load only) */
    feedRefreshMinutes?: number
    /** Let messages flagged popup open the panel by themselves, once per user */
    feedAutoOpen?: boolean
    /** Color the bell while a maintenance or outage message is active */
    feedTintBell?: boolean
}

export type IMConfig = ImmutableObject<Config>