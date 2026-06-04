/**
 * What's New widget runtime.
 *
 * Calcite design system integration based on a community rework by
 * SunshineLuke90 (Esri Community thread linked in the README). The
 * announcement-ID re-notification system, the localStorage seen-state, and
 * the settings layout are from the original widget by the City of Grand
 * Junction GIS Division.
 */
import { React, type AllWidgetProps } from 'jimu-core'
import type { IMConfig } from '../config'
import 'calcite-components'

const { useState, useEffect, useMemo, useCallback } = React

const DEFAULT_ICON = 'bell-f'
const DEFAULT_ICON_SIZE = 24
const DEFAULT_CONTENT_WIDTH = 320
const IFRAME_HEIGHT = 400

export default function Widget(props: AllWidgetProps<IMConfig>): React.ReactElement {
    const { config, id: widgetId } = props

    const [open, setOpen] = useState(false)
    const [hasUnseen, setHasUnseen] = useState(false)

    const storageKey = useMemo(() => `whatsnew:${widgetId}:seen`, [widgetId])
    const isModal = config.displayMode === 'modal'

    // Recompute unseen state whenever announcementId or override toggle changes
    useEffect(() => {
        if (config.showDotAlways) {
            setHasUnseen(true)
            return
        }
        try {
            const seenId = window.localStorage.getItem(storageKey)
            setHasUnseen(seenId !== config.announcementId)
        } catch (e) {
            setHasUnseen(true)
        }
    }, [config.announcementId, config.showDotAlways, storageKey])

    // Resolve the icon name. calcite-action accepts any name from
    // @esri/calcite-ui-icons and silently renders nothing for unknown names,
    // so no validation is needed here. Only fall back when the field is empty.
    const resolvedIcon = useMemo(() => {
        return config.icon && config.icon.trim() ? config.icon : DEFAULT_ICON
    }, [config.icon])

    const markSeen = useCallback(() => {
        try {
            window.localStorage.setItem(storageKey, config.announcementId || '')
        } catch (e) {
            // localStorage unavailable
        }
        if (!config.showDotAlways) setHasUnseen(false)
    }, [config.announcementId, config.showDotAlways, storageKey])

    const handleBellClick = () => {
        // Link mode plus new tab: open the URL and mark seen, no panel
        if (config.contentMode === 'link' && config.openInNewTab && config.linkUrl) {
            window.open(config.linkUrl, '_blank', 'noopener,noreferrer')
            markSeen()
            return
        }
        if (open) {
            setOpen(false)
            return
        }
        setOpen(true)
        markSeen()
    }

    // Render the panel body. iframe is rendered as a real React element so
    // its size scales with the surrounding Calcite container, instead of
    // being embedded as an HTML string with a hardcoded height.
    const renderBody = () => {
        if (config.contentMode === 'link') {
            if (!config.linkUrl) {
                return (
                    <div style={{ padding: '12px 16px', color: '#666' }}>
                        No link configured.
                    </div>
                )
            }
            return (
                <iframe
                    src={config.linkUrl}
                    title={config.title || "What's New"}
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
                    __html: config.htmlContent || '<p style="color:#888">No content configured.</p>'
                }}
            />
        )
    }

    const bellId = `${widgetId}-bell`
    const contentWidth = config.contentWidth || DEFAULT_CONTENT_WIDTH
    const iconSize = config.iconSize || DEFAULT_ICON_SIZE

    // Indicator dot scales with the icon. Minimum 8px so it stays visible at
    // small icon sizes; about 32% of the icon size otherwise.
    const dotSize = Math.max(8, Math.round(iconSize * 0.32))
    const ariaLabel = hasUnseen
        ? `${config.title || "What's New"}, new updates available`
        : (config.title || "What's New")

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
            <style>{`
        .whats-new-bell-button {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: transparent;
          border: none;
          cursor: pointer;
          padding: 6px;
          border-radius: var(--calcite-corner-radius, 3px);
          transition: background 0.15s ease;
          line-height: 0;
        }
        .whats-new-bell-button:hover {
          background: var(--calcite-color-foreground-2, rgba(0, 0, 0, 0.06));
        }
        .whats-new-bell-button:focus-visible {
          outline: 2px solid var(--calcite-color-brand, #0079c1);
          outline-offset: 2px;
        }
        .whats-new-bell-button:active {
          background: var(--calcite-color-foreground-3, rgba(0, 0, 0, 0.12));
        }
      `}</style>

            <button
                id={bellId}
                type="button"
                className="whats-new-bell-button"
                aria-label={ariaLabel}
                aria-haspopup={isModal ? 'dialog' : 'true'}
                aria-expanded={open}
                onClick={handleBellClick}
                style={{ color: config.bellColor || 'var(--calcite-color-text-1)' }}
            >
                <calcite-icon
                    icon={resolvedIcon as any}
                    style={{
                        width: `${iconSize}px`,
                        height: `${iconSize}px`,
                        color: 'inherit'
                    } as React.CSSProperties}
                />
                {hasUnseen && (
                    <span
                        aria-hidden="true"
                        style={{
                            position: 'absolute',
                            top: '4px',
                            right: '4px',
                            width: `${dotSize}px`,
                            height: `${dotSize}px`,
                            borderRadius: '50%',
                            background: config.dotColor || 'var(--calcite-color-status-danger, #d83020)',
                            border: '1.5px solid var(--calcite-color-foreground-1, #fff)',
                            boxSizing: 'border-box',
                            pointerEvents: 'none'
                        }}
                    />
                )}
            </button>

            {isModal && (
                <calcite-dialog
                    id={`${widgetId}-modal`}
                    open={open}
                    modal
                    label={config.title || "What's New"}
                    heading={config.title || "What's New"}
                    heading-level={2}
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
                    label={config.title || "What's New"}
                    heading={config.title || "What's New"}
                    heading-level={3}
                    closable
                    autoClose
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