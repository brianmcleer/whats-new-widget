/**
 * What's New widget runtime.
 *
 * Calcite design system integration based on a community rework by
 * SunshineLuke90 (Esri Community thread linked in the README). The
 * announcement-ID re-notification system, the localStorage seen-state, and
 * the settings layout are from the original widget by the City of Grand
 * Junction GIS Division.
 *
 * 1.2.0 adds the notification feed: messages read from a shared hosted table
 * (src/shared/feed.ts) so a notice such as planned maintenance reaches every
 * app without a republish. With no feed URL the widget behaves as before.
 */
import { React, type AllWidgetProps } from 'jimu-core'
import type { IMConfig } from '../config'
import { beacon } from '../shared/beacon'
import type { BeaconHandle } from '../shared/beacon'
import { fetchFeedRows, selectMessages, topType } from '../shared/feed'
import type { FeedMessage, FeedType } from '../shared/feed'
import 'calcite-components'
import { hooks as __exbI18nHooks } from 'jimu-core';
import __exbI18nMessages from './translations/default';
import { __setIntl, __t, __tc } from './i18n-t'


const { useState, useEffect, useMemo, useCallback, useRef } = React

const DEFAULT_ICON = 'bell-f'
const DEFAULT_ICON_SIZE = 'm'
const DEFAULT_CONTENT_WIDTH = 320
const IFRAME_HEIGHT = 400
const DEFAULT_FEED_REFRESH_MINUTES = 5
const MAX_STORED_IDS = 100

const NOTICE_KIND: { [k in FeedType]: string } = {
    outage: 'danger',
    maintenance: 'warning',
    info: 'info',
    whatsnew: 'brand'
}

const readIds = (key: string): string[] => {
    try {
        const parsed = JSON.parse(window.localStorage.getItem(key) || '[]')
        return Array.isArray(parsed) ? parsed.map(String) : []
    } catch (e) {
        return []
    }
}

const writeIds = (key: string, ids: string[]): void => {
    try {
        window.localStorage.setItem(key, JSON.stringify(ids.slice(-MAX_STORED_IDS)))
    } catch (e) {
        // localStorage unavailable
    }
}

/** Adds ids to a stored list, keeping what is already there. */
const addIds = (key: string, ids: string[]): void => {
    const have = readIds(key)
    let changed = false
    for (const id of ids) {
        if (have.indexOf(id) === -1) { have.push(id); changed = true }
    }
    if (changed) writeIds(key, have)
}

export default function Widget (props: AllWidgetProps<IMConfig>): React.ReactElement {
  __setIntl((props as any).intl)
  const t = __exbI18nHooks.useTranslation(__exbI18nMessages);
    const { config, id: widgetId } = props

    const [open, setOpen] = useState(false)
    const [localUnseen, setLocalUnseen] = useState(false)
    const [feedMessages, setFeedMessages] = useState<FeedMessage[]>([])
    const [feedUnseen, setFeedUnseen] = useState(false)

    const storageKey = useMemo(() => `whatsnew:${widgetId}:seen`, [widgetId])
    const feedSeenKey = useMemo(() => `whatsnew:${widgetId}:feedseen`, [widgetId])
    const feedPoppedKey = useMemo(() => `whatsnew:${widgetId}:feedpopped`, [widgetId])
    const isModal = config.displayMode === 'modal'
    const beaconRef = useRef<BeaconHandle | null>(null)
    const feedErrorSent = useRef(false)

    const feedUrl = (config.feedUrl || '').trim()
    const feedOn = !!feedUrl
    const isLinkNewTab = config.contentMode === 'link' && !!config.openInNewTab && !!config.linkUrl
    // With the feed on, an app can run on feed messages alone: blank local
    // content then shows nothing and never lights the dot.
    const hasLocalContent = config.contentMode === 'link'
        ? !!config.linkUrl
        : !!(config.htmlContent && config.htmlContent.trim())
    const showLocal = !feedOn || hasLocalContent

    useEffect(() => { beaconRef.current = beacon.init(props) }, [])

    // Recompute unseen state whenever announcementId or override toggle changes
    useEffect(() => {
        if (config.showDotAlways) {
            setLocalUnseen(true)
            return
        }
        if (!showLocal) {
            setLocalUnseen(false)
            return
        }
        try {
            const seenId = window.localStorage.getItem(storageKey)
            setLocalUnseen(seenId !== config.announcementId)
        } catch (e) {
            setLocalUnseen(true)
        }
    }, [config.announcementId, config.showDotAlways, storageKey, showLocal])

    const markFeedSeen = useCallback((messages: FeedMessage[]) => {
        if (messages.length) addIds(feedSeenKey, messages.map((m) => m.id))
        setFeedUnseen(false)
    }, [feedSeenKey])

    const markSeen = useCallback(() => {
        if (showLocal) {
            try {
                window.localStorage.setItem(storageKey, config.announcementId || '')
            } catch (e) {
                beaconRef.current?.error(e, 'open-announcement')
                // localStorage unavailable
            }
        }
        if (!config.showDotAlways) setLocalUnseen(false)
    }, [config.announcementId, config.showDotAlways, storageKey, showLocal])

    // Notification feed: load now, then again on a timer. A failed check keeps
    // whatever is already showing, so a short network drop does not blank a
    // notice, and the widget falls back to its own configured content.
    useEffect(() => {
        if (!feedOn) {
            setFeedMessages([])
            setFeedUnseen(false)
            return
        }
        let cancelled = false
        const inBuilder = !!(window as any).jimuConfig?.isInBuilder

        const load = async () => {
            try {
                const rows = await fetchFeedRows(feedUrl)
                if (cancelled) return
                const messages = selectMessages(rows, {
                    audience: config.feedAudience || '',
                    appTag: config.feedAppTag || ''
                })
                setFeedMessages(messages)

                const seen = readIds(feedSeenKey)
                const unseen = messages.some((m) => seen.indexOf(m.id) === -1)

                // Urgent messages open the panel by themselves, once per user.
                const popped = readIds(feedPoppedKey)
                const toPop = messages.filter((m) => m.popup && popped.indexOf(m.id) === -1)
                if (toPop.length && config.feedAutoOpen !== false && !inBuilder) {
                    addIds(feedPoppedKey, toPop.map((m) => m.id))
                    beaconRef.current?.action('feed-auto-open', toPop[0].type)
                    setOpen(true)
                    addIds(feedSeenKey, messages.map((m) => m.id))
                    setFeedUnseen(false)
                    markSeen()
                } else {
                    setFeedUnseen(unseen)
                }
            } catch (e) {
                if (!feedErrorSent.current) {
                    feedErrorSent.current = true
                    beaconRef.current?.error(e, 'feed')
                }
            }
        }

        load()
        const minutes = config.feedRefreshMinutes == null
            ? DEFAULT_FEED_REFRESH_MINUTES
            : Number(config.feedRefreshMinutes)
        const timer = minutes > 0
            ? window.setInterval(load, Math.max(1, minutes) * 60000)
            : null
        return () => {
            cancelled = true
            if (timer != null) window.clearInterval(timer)
        }
    }, [feedOn, feedUrl, config.feedAudience, config.feedAppTag, config.feedRefreshMinutes,
        config.feedAutoOpen, feedSeenKey, feedPoppedKey, markSeen])

    // A message that arrives while the panel is open has been seen.
    useEffect(() => {
        if (open && feedMessages.length) markFeedSeen(feedMessages)
    }, [open, feedMessages, markFeedSeen])

    // Resolve the icon name. calcite-action accepts any name from
    // @esri/calcite-ui-icons and silently renders nothing for unknown names,
    // so no validation is needed here. Only fall back when the field is empty.
    const resolvedIcon = useMemo(() => {
        return config.icon && config.icon.trim() ? config.icon : DEFAULT_ICON
    }, [config.icon])

    const hasFeedMessages = feedMessages.length > 0
    const hasUnseen = localUnseen || feedUnseen

    const handleBellClick = () => {
        // Link mode plus new tab, and nothing in the feed: open the URL and
        // mark seen, no panel. With feed messages the panel opens instead and
        // carries the link below them.
        if (isLinkNewTab && !hasFeedMessages) {
            beaconRef.current?.action('open-link')
            window.open(config.linkUrl, '_blank', 'noopener,noreferrer')
            markSeen()
            return
        }
        if (open) {
            beaconRef.current?.action('close')
            setOpen(false)
            return
        }
        beaconRef.current?.action('open-announcement')
        setOpen(true)
        markSeen()
        markFeedSeen(feedMessages)
    }

    const renderFeed = () => {
        if (!hasFeedMessages) return null
        return (
            <div
                className="whats-new-feed"
                style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: '0.75rem 0.75rem 0.25rem' }}
            >
                {feedMessages.map((m) => (
                    <calcite-notice
                        key={m.id}
                        open
                        icon
                        scale="s"
                        width="full"
                        kind={NOTICE_KIND[m.type] as any}
                    >
                        {m.title && <div slot="title">{m.title}</div>}
                        {m.html && (
                            <div
                                slot="message"
                                style={{ lineHeight: 1.45 }}
                                dangerouslySetInnerHTML={{ __html: m.html }}
                            />
                        )}
                    </calcite-notice>
                ))}
            </div>
        )
    }

    // The widget's own configured content. iframe is rendered as a real React
    // element so its size scales with the surrounding Calcite container,
    // instead of being embedded as an HTML string with a hardcoded height.
    const renderLocal = () => {
        if (!showLocal) return null
        if (config.contentMode === 'link') {
            if (!config.linkUrl) {
                return (
                    <div style={{ padding: '12px 16px', color: '#666' }}>
                        {t('noLinkConfigured')}
                    </div>
                )
            }
            if (config.openInNewTab) {
                return (
                    <div style={{ padding: '0.75rem 1rem' }}>
                        <calcite-button
                            appearance="outline"
                            scale="s"
                            width="full"
                            iconEnd="launch"
                            href={config.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={() => { beaconRef.current?.action('open-link') }}
                        >
                            {__tc(config.title, 'openLink')}
                        </calcite-button>
                    </div>
                )
            }
            return (
                <iframe
                    src={config.linkUrl}
                    title={config.title || t('_widgetLabel')}
                    style={{
                        width: '100%',
                        height: IFRAME_HEIGHT,
                        border: 0,
                        display: 'block'
                    }}
                />
            )
        }
        return (
            <div
                style={{
                    padding: '0.75rem 1rem',
                    fontSize: 14,
                    lineHeight: 1.5
                }}
                dangerouslySetInnerHTML={{
                    __html: config.htmlContent || `<p style="color:#888">${t('noContentConfigured')}</p>`
                }}
            />
        )
    }

    const renderBody = () => {
        const feed = renderFeed()
        const local = renderLocal()
        if (!feed && !local) {
            return (
                <div style={{ padding: '12px 16px', color: '#666' }}>
                    {t('noContentConfigured')}
                </div>
            )
        }
        return (
            <React.Fragment>
                {feed}
                {local}
            </React.Fragment>
        )
    }

    const bellId = `${widgetId}-bell`
    const contentWidth = config.contentWidth || DEFAULT_CONTENT_WIDTH
    const iconSize = config.iconSize || DEFAULT_ICON_SIZE

    // While a maintenance or outage message is active the bell takes the
    // Calcite status color, so it reads as a notice and not as routine news.
    const urgentType = topType(feedMessages)
    let bellColor = config.bellColor || 'var(--calcite-color-text-1)'
    if (config.feedTintBell !== false) {
        if (urgentType === 'outage') bellColor = 'var(--calcite-color-status-danger, #d83020)'
        else if (urgentType === 'maintenance') bellColor = 'var(--calcite-color-status-warning, #edd317)'
    }

    // Indicator dot scales with the icon. Minimum 8px so it stays visible at
    // small icon sizes; about 32% of the icon size otherwise.
    // const dotSize = Math.max(8, Math.round(iconSize * 0.32))
    const ariaLabel = hasUnseen
        ? __t("valueNewUpdatesAvailable", { value: __tc(config.title, "_widgetLabel") })
        : (__tc(config.title, "_widgetLabel"))

    return (
        <div
            className="jimu-widget whats-new-widget"
            style={{
                display: 'inline-flex',
                alignItems: 'center',
                height: '100%',
                position: 'relative',
                padding: '0.25rem'
            }}
        >
            <calcite-action
                id={bellId}
                text={config.title || t('_widgetLabel')}
                label={ariaLabel}
                aria-haspopup={isModal ? 'dialog' : 'true'}
                aria-expanded={open}
                onClick={handleBellClick}
                icon={resolvedIcon as any}
                scale={iconSize || 'm'}
                indicator={hasUnseen}
                style={{
                    '--calcite-action-corner-radius': 'var(--calcite-button-corner-radius)',
                    '--calcite-action-indicator-color': __tc(config.dotColor, "varCalciteColorStatusDangerD83020"),
                    '--calcite-action-text-color': bellColor,
                }}
            />

            {isModal && (
                <calcite-dialog
                    id={`${widgetId}-modal`}
                    open={open}
                    modal
                    label={config.title || t('_widgetLabel')}
                    heading={__tc(config.title, "_widgetLabel")}
                    headingLevel={2}
                    kind="info"
                    placement="center"
                    width="m"
                    oncalciteDialogClose={() => { setOpen(false) }}
                >
                    {renderBody()}
                </calcite-dialog>
            )}

            {!isModal && (
                <calcite-popover
                    referenceElement={bellId}
                    open={open}
                    label={config.title || t('_widgetLabel')}
                    heading={__tc(config.title, "_widgetLabel")}
                    headingLevel={3}
                    closable
                    autoClose
                    triggerDisabled
                    placement={config.placement || 'auto'}
                    oncalcitePopoverClose={() => { setOpen(false) }}
                    style={{
                        '--calcite-popover-max-size-x': `${contentWidth}px`
                    } as React.CSSProperties}
                >
                    {renderBody()}
                </calcite-popover>
            )}
        </div>
    )
}
