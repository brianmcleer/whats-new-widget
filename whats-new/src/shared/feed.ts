/**
 * Notification feed for the What's New widget.
 *
 * Reads messages from a hosted table (ArcGIS Online or ArcGIS Enterprise) so
 * one edit to the table reaches every app that carries the widget, with no
 * republish. The widget only ever reads. The table should be shared publicly
 * with editing turned off for the public; only its owner writes to it.
 *
 * Table fields (names are matched without regard to case):
 *   msg_id      text    unique id; a new id re-notifies every user
 *   title       text    short headline
 *   body        text    plain text or simple HTML (sanitized before display)
 *   msg_type    text    whatsnew | info | maintenance | outage
 *   start_time  date    optional; hidden before this time
 *   end_time    date    optional; hidden after this time
 *   audience    text    all | internal | external (blank means all)
 *   apps        text    comma list of app tags (blank means every app)
 *   popup       integer 1 opens the panel by itself, once per user
 *   active      integer 1 to show, 0 to hide without deleting the row
 */

export type FeedType = 'whatsnew' | 'info' | 'maintenance' | 'outage'
export type FeedAudience = '' | 'internal' | 'external'

export interface FeedMessage {
  id: string
  title: string
  /** Sanitized HTML, safe to render. */
  html: string
  type: FeedType
  start: number | null
  end: number | null
  popup: boolean
}

export interface FeedTarget {
  /** This app's audience. Blank means the app only gets messages for "all". */
  audience?: string
  /** This app's tag, matched against the message's apps list. */
  appTag?: string
}

const TYPES: FeedType[] = ['whatsnew', 'info', 'maintenance', 'outage']
const SEVERITY: { [k in FeedType]: number } = { outage: 3, maintenance: 2, info: 1, whatsnew: 0 }
const FETCH_TIMEOUT_MS = 10000
const MAX_MESSAGES = 20

/**
 * Turns what the author pasted into a table query endpoint, or returns null
 * when it is not a usable https service URL. Accepts the layer URL
 * (.../FeatureServer/0) or the service URL (.../FeatureServer, table 0 assumed).
 */
export function normalizeFeedUrl (raw: string): string | null {
  let url = String(raw || '').trim().split('?')[0].replace(/\/+$/, '')
  if (!url) return null
  url = url.replace(/\/query$/i, '')
  if (!/^https:\/\//i.test(url)) return null
  if (/\/(FeatureServer|MapServer)$/i.test(url)) url += '/0'
  if (!/\/(FeatureServer|MapServer)\/\d+$/i.test(url)) return null
  return url
}

/** Fetches every active row. Throws on a network error, a timeout or a service error. */
export async function fetchFeedRows (rawUrl: string): Promise<any[]> {
  const url = normalizeFeedUrl(rawUrl)
  if (!url) throw new Error('feed url is not a valid https table url')
  const query = url + '/query?where=' + encodeURIComponent('active = 1') +
    '&outFields=*&returnGeometry=false&f=json'
  const controller = typeof AbortController === 'function' ? new AbortController() : null
  const timer = controller ? setTimeout(() => { controller.abort() }, FETCH_TIMEOUT_MS) : null
  try {
    const res = await fetch(query, {
      cache: 'no-store',
      credentials: 'omit',
      signal: controller ? controller.signal : undefined
    })
    if (!res.ok) throw new Error('feed http ' + res.status)
    const json = await res.json()
    if (json && json.error) throw new Error('feed error ' + (json.error.code || '') + ' ' + (json.error.message || ''))
    const features = json && Array.isArray(json.features) ? json.features : []
    return features.map((f: any) => (f && f.attributes) || {})
  } finally {
    if (timer) clearTimeout(timer)
  }
}

/** Case-insensitive attribute read. */
function attr (row: any, name: string): any {
  if (!row) return undefined
  if (name in row) return row[name]
  const want = name.toLowerCase()
  for (const k of Object.keys(row)) {
    if (k.toLowerCase() === want) return row[k]
  }
  return undefined
}

function toTime (v: any): number | null {
  if (v == null || v === '') return null
  const n = typeof v === 'number' ? v : Date.parse(String(v))
  return isFinite(n) ? n : null
}

function isOn (v: any): boolean {
  if (v == null) return false
  const s = String(v).trim().toLowerCase()
  return s === '1' || s === 'true' || s === 'yes' || s === 'y'
}

function splitList (v: any): string[] {
  return String(v == null ? '' : v).split(/[,;]/).map((s) => s.trim().toLowerCase()).filter(Boolean)
}

/**
 * Picks the rows this app should show right now and returns them most urgent
 * first, then newest first.
 */
export function selectMessages (rows: any[], target: FeedTarget, now: number = Date.now()): FeedMessage[] {
  const myAudience = String((target && target.audience) || '').trim().toLowerCase()
  const myTag = String((target && target.appTag) || '').trim().toLowerCase()
  const seen: { [id: string]: boolean } = {}
  const out: FeedMessage[] = []

  for (const row of rows || []) {
    const id = String(attr(row, 'msg_id') == null ? '' : attr(row, 'msg_id')).trim()
    if (!id || seen[id]) continue

    const start = toTime(attr(row, 'start_time'))
    const end = toTime(attr(row, 'end_time'))
    if (start != null && now < start) continue
    if (end != null && now > end) continue

    const audience = String(attr(row, 'audience') == null ? '' : attr(row, 'audience')).trim().toLowerCase()
    if (audience && audience !== 'all' && audience !== myAudience) continue

    const apps = splitList(attr(row, 'apps'))
    if (apps.length && apps.indexOf('all') === -1 && (!myTag || apps.indexOf(myTag) === -1)) continue

    const rawType = String(attr(row, 'msg_type') == null ? '' : attr(row, 'msg_type')).trim().toLowerCase() as FeedType
    const type: FeedType = TYPES.indexOf(rawType) >= 0 ? rawType : 'info'

    const title = String(attr(row, 'title') == null ? '' : attr(row, 'title')).trim()
    const html = sanitizeHtml(String(attr(row, 'body') == null ? '' : attr(row, 'body')))
    if (!title && !html) continue

    seen[id] = true
    out.push({ id, title, html, type, start, end, popup: isOn(attr(row, 'popup')) })
  }

  out.sort((a, b) => {
    const sev = SEVERITY[b.type] - SEVERITY[a.type]
    if (sev !== 0) return sev
    return (b.start || 0) - (a.start || 0)
  })
  return out.slice(0, MAX_MESSAGES)
}

/** The most urgent type present, or null when the list is empty. */
export function topType (messages: FeedMessage[]): FeedType | null {
  return messages && messages.length ? messages[0].type : null
}

// ───────────────────────────── HTML sanitizer ─────────────────────────────
//
// Feed text comes from a table, not from the app author, so it is never
// trusted. Only simple formatting tags survive; scripts, styles, frames,
// event handlers and non-web links are removed.

const ALLOWED_TAGS: { [tag: string]: boolean } = {
  A: true, B: true, BLOCKQUOTE: true, BR: true, CODE: true, DIV: true, EM: true,
  H3: true, H4: true, H5: true, H6: true, HR: true, I: true, LI: true, OL: true,
  P: true, SMALL: true, SPAN: true, STRONG: true, U: true, UL: true
}
const DROPPED_TAGS: { [tag: string]: boolean } = {
  SCRIPT: true, STYLE: true, IFRAME: true, OBJECT: true, EMBED: true, LINK: true,
  META: true, TEMPLATE: true, NOSCRIPT: true, SVG: true, MATH: true, FORM: true,
  INPUT: true, BUTTON: true, SELECT: true, TEXTAREA: true, AUDIO: true, VIDEO: true,
  IMG: true, BASE: true, HEAD: true, TITLE: true
}
const SAFE_HREF = /^(https?:|mailto:|tel:)/i
const HAS_MARKUP = /<\/?(a|b|blockquote|br|code|div|em|h[3-6]|hr|i|li|ol|p|small|span|strong|u|ul)(\s|\/|>)/i

function escapeText (s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function cleanNode (node: Node, doc: Document): Node | null {
  if (node.nodeType === 3) return doc.createTextNode(node.nodeValue || '')
  if (node.nodeType !== 1) return null
  const el = node as Element
  const tag = el.tagName.toUpperCase()
  if (DROPPED_TAGS[tag]) return null

  const kids = doc.createDocumentFragment()
  for (let i = 0; i < el.childNodes.length; i++) {
    const kid = cleanNode(el.childNodes[i], doc)
    if (kid) kids.appendChild(kid)
  }
  // Unknown tag: keep its text, drop the tag itself.
  if (!ALLOWED_TAGS[tag]) return kids

  const out = doc.createElement(tag.toLowerCase())
  if (tag === 'A') {
    const href = (el.getAttribute('href') || '').trim()
    if (SAFE_HREF.test(href)) {
      out.setAttribute('href', href)
      out.setAttribute('target', '_blank')
      out.setAttribute('rel', 'noopener noreferrer')
    }
  }
  out.appendChild(kids)
  return out
}

/** Returns safe HTML. Plain text (no tags) keeps its line breaks. */
export function sanitizeHtml (input: string): string {
  const raw = String(input == null ? '' : input).trim()
  if (!raw) return ''
  // No formatting tag in it: treat as plain text, so a stray "<" stays visible.
  if (!HAS_MARKUP.test(raw)) return escapeText(raw).replace(/\r?\n/g, '<br>')
  try {
    const parsed = new DOMParser().parseFromString(raw, 'text/html')
    const holder = parsed.createElement('div')
    const body = parsed.body
    for (let i = 0; i < body.childNodes.length; i++) {
      const kid = cleanNode(body.childNodes[i], parsed)
      if (kid) holder.appendChild(kid)
    }
    return holder.innerHTML
  } catch (e) {
    return escapeText(raw)
  }
}
