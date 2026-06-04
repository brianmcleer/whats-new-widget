/** @jsx jsx */
import { jsx, css, React } from 'jimu-core'
import type { AllWidgetSettingProps } from 'jimu-for-builder'
import {
    SettingSection,
    SettingRow
} from 'jimu-ui/advanced/setting-components'
import {
    TextInput,
    TextArea,
    Switch,
    Select,
    Option,
    Button,
    NumericInput
} from 'jimu-ui'
import { ColorPicker } from 'jimu-ui/basic/color-picker'
import type { IMConfig, LogicalPlacement } from '../config'
import 'calcite-components'

const Fragment = React.Fragment

const helperText = css`
  font-size: 11px;
  color: var(--text-secondary, #999);
  padding: 2px 2px 10px;
  line-height: 1.45;
`

const idRow = css`
  display: flex;
  gap: 6px;
  align-items: stretch;
  width: 100%;
`

const idInputWrap = css`
  flex: 1;
  min-width: 0;
`

const iconRow = css`
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
`

const iconPreview = css`
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid var(--border, rgba(0, 0, 0, 0.12));
  border-radius: 3px;
  background: var(--surface-1, transparent);
  color: var(--calcite-color-text-1, inherit);
`

/**
 * Generates a timestamped announcement ID in the format YYYY-MM-DD-HHMM.
 * Always unique, naturally chronological, and human-readable.
 */
const generateAnnouncementId = (): string => {
    const d = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    return [
        d.getFullYear(),
        pad(d.getMonth() + 1),
        pad(d.getDate())
    ].join('-') + '-' + pad(d.getHours()) + pad(d.getMinutes())
}

/**
 * Parses a "last published" date from an ID in YYYY-MM-DD-HHMM format.
 * Returns null for IDs that don't match (so users can still use any format).
 */
const parsePublishedDate = (id: string): string | null => {
    const m = /^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/.exec(id || '')
    if (!m) return null
    const d = new Date(
        parseInt(m[1], 10),
        parseInt(m[2], 10) - 1,
        parseInt(m[3], 10),
        parseInt(m[4], 10),
        parseInt(m[5], 10)
    )
    return d.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit'
    })
}

export default function Setting(props: AllWidgetSettingProps<IMConfig>) {
    const { config, onSettingChange, id } = props

    const update = <K extends keyof IMConfig>(key: K, value: IMConfig[K] | string | boolean | number) => {
        onSettingChange({ id, config: config.set(key, value) })
    }

    const publishedDate = parsePublishedDate(config.announcementId || '')

    return (
        <div className="whats-new-setting">
            <SettingSection title="Announcement">
                <SettingRow label="Title" flow="wrap">
                    <TextInput
                        value={config.title || ''}
                        onChange={(e) => { update('title', e.target.value) }}
                        placeholder="What's New"
                        style={{ width: '100%' }}
                    />
                </SettingRow>

                <SettingRow label="Announcement ID" flow="wrap">
                    <div css={idRow}>
                        <div css={idInputWrap}>
                            <TextInput
                                value={config.announcementId || ''}
                                onChange={(e) => { update('announcementId', e.target.value) }}
                                placeholder="e.g. 2026-05-15-1742"
                                style={{ width: '100%' }}
                            />
                        </div>
                        <Button
                            type="primary"
                            size="sm"
                            title="Set ID to current timestamp. This re-notifies all users."
                            onClick={() => { update('announcementId', generateAnnouncementId()) }}
                        >
                            New ID
                        </Button>
                    </div>
                </SettingRow>
                <div css={helperText}>
                    Click <strong>New ID</strong> after editing content to re-notify all users.
                    {publishedDate && (
                        <Fragment>
                            <br />Last published: <strong>{publishedDate}</strong>
                        </Fragment>
                    )}
                </div>
            </SettingSection>

            <SettingSection title="Content">
                <SettingRow label="Content type" flow="wrap">
                    <Select
                        value={config.contentMode || 'html'}
                        onChange={(e) => { update('contentMode', e.target.value as 'html' | 'link') }}
                        style={{ width: '100%' }}
                    >
                        <Option value="html">Rich HTML</Option>
                        <Option value="link">External link</Option>
                    </Select>
                </SettingRow>

                {config.contentMode === 'link' && (
                    <Fragment>
                        <SettingRow label="URL" flow="wrap">
                            <TextInput
                                value={config.linkUrl || ''}
                                onChange={(e) => { update('linkUrl', e.target.value) }}
                                placeholder="https://example.com/whats-new"
                                style={{ width: '100%' }}
                            />
                        </SettingRow>
                        <SettingRow label="Open in new tab" flow="no-wrap">
                            <Switch
                                checked={!!config.openInNewTab}
                                onChange={(e) => { update('openInNewTab', e.target.checked) }}
                            />
                        </SettingRow>
                        <div css={helperText}>
                            When off, the URL loads in an iframe inside the popover. Sites that send
                            <code> X-Frame-Options: DENY </code>
                            will render blank. Enable "Open in new tab" or switch to Rich HTML.
                        </div>
                    </Fragment>
                )}
                {config.contentMode === 'html' && (
                    <SettingRow label="HTML content" flow="wrap">
                        <TextArea
                            value={config.htmlContent || ''}
                            onChange={(e) => { update('htmlContent', e.target.value) }}
                            placeholder={'<h4>May 2026 updates</h4>\n<ul>\n  <li>...</li>\n</ul>'}
                            style={{ fontFamily: 'monospace', fontSize: 12, width: '100%', height: 200 }}
                        />
                    </SettingRow>
                )}
            </SettingSection>

            <SettingSection title="Display">
                <SettingRow label="Display mode" flow="wrap">
                    <Select
                        value={config.displayMode || 'popover'}
                        onChange={(e) => { update('displayMode', e.target.value as 'popover' | 'modal') }}
                        style={{ width: '100%' }}
                    >
                        <Option value="popover">Popover (anchored to bell)</Option>
                        <Option value="modal">Modal (centered overlay)</Option>
                    </Select>
                </SettingRow>

                {config.displayMode === 'popover' && (
                    <Fragment>
                        <SettingRow label="Content width" flow="wrap">
                            <NumericInput
                                value={config.contentWidth || 320}
                                onChange={(value) => { update('contentWidth', value) }}
                                style={{ width: '100%' }}
                            />
                        </SettingRow>

                        <SettingRow label="Popover placement" flow="wrap">
                            <Select
                                value={config.placement || 'auto'}
                                onChange={(evt) => { update('placement', evt.target.value as LogicalPlacement) }}
                                style={{ width: '100%' }}
                            >
                                <Option value="auto">Auto (default)</Option>
                                <Option value="top">Top</Option>
                                <Option value="bottom">Bottom</Option>
                                <Option value="left">Left</Option>
                                <Option value="right">Right</Option>
                                <Option value="auto-start">Auto-start</Option>
                                <Option value="auto-end">Auto-end</Option>
                                <Option value="top-start">Top-start</Option>
                                <Option value="top-end">Top-end</Option>
                                <Option value="bottom-start">Bottom-start</Option>
                                <Option value="bottom-end">Bottom-end</Option>
                                <Option value="left-start">Left-start</Option>
                                <Option value="left-end">Left-end</Option>
                                <Option value="right-start">Right-start</Option>
                                <Option value="right-end">Right-end</Option>
                                <Option value="leading-start">Leading-start</Option>
                                <Option value="leading">Leading</Option>
                                <Option value="leading-end">Leading-end</Option>
                                <Option value="trailing-end">Trailing-end</Option>
                                <Option value="trailing">Trailing</Option>
                                <Option value="trailing-start">Trailing-start</Option>
                            </Select>
                        </SettingRow>
                    </Fragment>
                )}

                <SettingRow label="Icon" flow="wrap">
                    <div css={iconRow}>
                        <TextInput
                            value={config.icon || 'bell-f'}
                            onChange={(e) => { update('icon', e.target.value) }}
                            placeholder="calcite-ui-icons name, e.g. bell-f"
                            style={{ flex: 1, minWidth: 0 }}
                        />
                        <div css={iconPreview} title="Live preview of the typed icon name and size">
                            <calcite-icon
                                icon={(config.icon && config.icon.trim()) || 'bell-f'}
                                scale="m"
                                style={{
                                    fontSize: `${config.iconSize || 24}px`,
                                    width: `${config.iconSize || 24}px`,
                                    height: `${config.iconSize || 24}px`
                                } as React.CSSProperties}
                            />
                        </div>
                    </div>
                    <div css={helperText}>
                        Use any name from the
                        <a href="https://developers.arcgis.com/calcite-design-system/icons/" target="_blank" rel="noopener noreferrer"> Calcite UI Icons </a>
                        reference. Paste the exact name shown on the page (e.g. <code>bell</code>, <code>bell-f</code>, <code>chevron-right</code>).
                        The preview to the right updates as you type. If it goes blank, the name is not recognized.
                    </div>
                </SettingRow>

                <SettingRow label="Icon size (px)" flow="wrap">
                    <NumericInput
                        value={config.iconSize || 24}
                        onChange={(value) => { update('iconSize', value) }}
                        min={12}
                        max={64}
                        step={1}
                        showHandlers
                        style={{ width: '100%' }}
                    />
                    <div css={helperText}>
                        Pixel size of the icon. Default 24. Use the arrows to bump up or down, or type a number directly.
                    </div>
                </SettingRow>

                <SettingRow label="Icon color" flow="no-wrap">
                    <ColorPicker
                        type="default"
                        value={config.bellColor || ''}
                        color={config.bellColor || ''}
                        onChange={(color) => { update('bellColor', color) }}
                        aria-label="Icon color"
                    />
                </SettingRow>

                <SettingRow label="Dot color" flow="no-wrap">
                    <ColorPicker
                        type="default"
                        value={config.dotColor || ''}
                        color={config.dotColor || ''}
                        onChange={(color) => { update('dotColor', color) }}
                        aria-label="Notification dot color"
                    />
                </SettingRow>

                <SettingRow label="Always show dot" flow="no-wrap">
                    <Switch
                        checked={!!config.showDotAlways}
                        onChange={(e) => { update('showDotAlways', e.target.checked) }}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    )
}