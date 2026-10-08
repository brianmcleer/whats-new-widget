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
import { hooks as __exbI18nHooks } from 'jimu-core';
import __exbI18nMessages from './translations/default';


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

export default function Setting (props: AllWidgetSettingProps<IMConfig>) {
  const t = __exbI18nHooks.useTranslation(__exbI18nMessages);
    const { config, onSettingChange, id } = props

    const update = <K extends keyof IMConfig> (key: K, value: IMConfig[K]) => {
        onSettingChange({ id, config: config.set(key, value) })
    }

    const publishedDate = parsePublishedDate(config.announcementId || '')

    return (
        <div className="whats-new-setting">
            <SettingSection title={t('announcement')}>
                <SettingRow label={t('title')} flow="wrap">
                    <TextInput
                        value={config.title || ''}
                        onChange={(e) => { update('title', e.target.value) }}
                        placeholder={t('whatSNew')}
                        style={{ width: '100%' }}
                    />
                </SettingRow>

                <SettingRow label={t('announcementId')} flow="wrap">
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
                            title={t('setIdToCurrentTimestampThis')}
                            onClick={() => { update('announcementId', generateAnnouncementId()) }}
                        >
                            {t('newId')}
                        </Button>
                    </div>
                </SettingRow>
                <div css={helperText}>
                    {t('click')} <strong>{t('newId')}</strong> {t('afterEditingContentToReNotify')}
                    {publishedDate && (
                        <Fragment>
                            <br />{t('lastPublished')} <strong>{publishedDate}</strong>
                        </Fragment>
                    )}
                </div>
            </SettingSection>

            <SettingSection title={t('content')}>
                <SettingRow label={t('contentType')} flow="wrap">
                    <Select
                        value={config.contentMode || 'html'}
                        onChange={(e) => { update('contentMode', e.target.value as 'html' | 'link') }}
                        style={{ width: '100%' }}
                    >
                        <Option value="html">{t('richHtml')}</Option>
                        <Option value="link">{t('externalLink')}</Option>
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
                        <SettingRow label={t('openInNewTab')} flow="no-wrap">
                            <Switch
                                checked={!!config.openInNewTab}
                                onChange={(e) => { update('openInNewTab', e.target.checked) }}
                            />
                        </SettingRow>
                        <div css={helperText}>
                            {t('whenOffTheUrlLoadsIn')}
                            <code> X-Frame-Options: DENY </code>
                            {t('willRenderBlankEnableOpenIn')}
                        </div>
                    </Fragment>
                )}
                {config.contentMode === 'html' && (
                    <SettingRow label={t('htmlContent')} flow="wrap">
                        <TextArea
                            value={config.htmlContent || ''}
                            onChange={(e) => { update('htmlContent', e.target.value) }}
                            placeholder={'<h4>May 2026 updates</h4>\n<ul>\n  <li>...</li>\n</ul>'}
                            style={{ fontFamily: 'monospace', fontSize: 12, width: '100%' }}
                        />
                    </SettingRow>
                )}
            </SettingSection>

            <SettingSection title={t('display')}>
                <SettingRow label={t('displayMode')} flow="wrap">
                    <Select
                        value={config.displayMode || 'popover'}
                        onChange={(e) => { update('displayMode', e.target.value as 'popover' | 'modal') }}
                        style={{ width: '100%' }}
                    >
                        <Option value="popover">{t('popoverAnchoredToBell')}</Option>
                        <Option value="modal">{t('modalCenteredOverlay')}</Option>
                    </Select>
                </SettingRow>

                {config.displayMode === 'popover' && (
                    <Fragment>
                        <SettingRow label={t('contentWidth')} flow="wrap">
                            <NumericInput
                                value={config.contentWidth || 320}
                                onChange={(value) => { update('contentWidth', value) }}
                                style={{ width: '100%' }}
                            />
                        </SettingRow>

                        <SettingRow label={t('popoverPlacement')} flow="wrap">
                            <Select
                                value={config.placement || 'auto'}
                                onChange={(evt) => { update('placement', evt.target.value as LogicalPlacement) }}
                                style={{ width: '100%' }}
                            >
                                <Option value="auto">{t('autoDefault')}</Option>
                                <Option value="top">{t('top')}</Option>
                                <Option value="bottom">{t('bottom')}</Option>
                                <Option value="left">{t('left')}</Option>
                                <Option value="right">{t('right')}</Option>
                                <Option value="auto-start">{t('autoStart')}</Option>
                                <Option value="auto-end">{t('autoEnd')}</Option>
                                <Option value="top-start">{t('topStart')}</Option>
                                <Option value="top-end">{t('topEnd')}</Option>
                                <Option value="bottom-start">{t('bottomStart')}</Option>
                                <Option value="bottom-end">{t('bottomEnd')}</Option>
                                <Option value="left-start">{t('leftStart')}</Option>
                                <Option value="left-end">{t('leftEnd')}</Option>
                                <Option value="right-start">{t('rightStart')}</Option>
                                <Option value="right-end">{t('rightEnd')}</Option>
                                <Option value="leading-start">{t('leadingStart')}</Option>
                                <Option value="leading">{t('leading')}</Option>
                                <Option value="leading-end">{t('leadingEnd')}</Option>
                                <Option value="trailing-end">{t('trailingEnd')}</Option>
                                <Option value="trailing">{t('trailing')}</Option>
                                <Option value="trailing-start">{t('trailingStart')}</Option>
                            </Select>
                        </SettingRow>
                    </Fragment>
                )}

                <SettingRow label={t('icon')} flow="wrap">
                    <div css={iconRow}>
                        <TextInput
                            value={config.icon || 'bell-f'}
                            onChange={(e) => { update('icon', e.target.value) }}
                            placeholder={t('calciteUiIconsNameEG')}
                            style={{ flex: 1, minWidth: 0 }}
                        />
                        <div css={iconPreview} title={t('livePreviewOfTheTypedIcon')}>
                            <calcite-icon
                                icon={(config.icon && config.icon.trim()) || 'bell-f' as any}
                                scale={config.iconSize || 'm'}
                            />
                        </div>
                    </div>
                    <div css={helperText}>
                        {t('useAnyNameFromThe')}
                        <a href="https://developers.arcgis.com/calcite-design-system/icons/" target="_blank" rel="noopener noreferrer"> {t('calciteUiIcons')} </a>
                        {t('referencePasteTheExactNameShown')} <code>bell</code>, <code>bell-f</code>, <code>chevron-right</code>{t('thePreviewToTheRightUpdates')}
                    </div>
                </SettingRow>

                <SettingRow label={t('iconSize')} flow="wrap">
                    <Select
                        value={config.iconSize || 'm'}
                        onChange={(e) => { update('iconSize', e.target.value) }}
                        style={{ width: '100%' }}
                    >
                        <Option value="s">{t('small')}</Option>
                        <Option value="m">{t('medium')}</Option>
                        <Option value="l">{t('large')}</Option>
                    </Select>
                </SettingRow>


                <SettingRow label={t('iconColor')} flow="no-wrap">
                    <ColorPicker
                        type="default"
                        value={config.bellColor || ''}
                        color={config.bellColor || ''}
                        onChange={(color) => { update('bellColor', color) }}
                        aria-label={t('iconColor')}
                    />
                </SettingRow>

                <SettingRow label={t('dotColor')} flow="no-wrap">
                    <ColorPicker
                        type="default"
                        value={config.dotColor || ''}
                        color={config.dotColor || ''}
                        onChange={(color) => { update('dotColor', color) }}
                        aria-label={t('notificationDotColor')}
                    />
                </SettingRow>
                <div css={helperText}>
                    {t('colorOfTheIconAndDot')}
                </div>

                <SettingRow label={t('alwaysShowDot')} flow="no-wrap">
                    <Switch
                        checked={!!config.showDotAlways}
                        onChange={(e) => { update('showDotAlways', e.target.checked) }}
                    />
                </SettingRow>
            </SettingSection>
        </div>
    )
}