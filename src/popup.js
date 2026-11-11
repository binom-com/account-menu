// What both header menus share (<binom-account-menu> on the right, <binom-team-switcher> on the left): a trigger
// button that opens a popover (a bottom sheet on a phone), rows that look alike, the app's own rows (light DOM),
// keyboard navigation, closing on Escape, a press outside or a chosen row. Shadow DOM, no dependencies; the look
// comes from the @binom/ui tokens on the page (`--color-*`, `--radius*`, `--shadow-*`, `--motion-*`).

/** Below this window width a menu is a bottom sheet, as in Chat (its `narrow` layout). */
const SHEET_QUERY = '(max-width: 799px)';
/** Above this a count shows `99+`. */
const MAX_COUNT = 99;
const MAX_INITIALS = 2;

// Lucide icons (ISC), drawn thin like the rest of Binom (@binom/ui base rules).
const ICONS = {
  camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
  coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
  settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  signOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  check: '<path d="M20 6 9 17l-5-5"/>',
  chevrons: '<path d="m7 15 5 5 5-5"/><path d="m7 9 5-5 5 5"/>',
};

export function icon(name, size) {
  return `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" ` +
    `stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name]}</svg>`;
}

const ENTITIES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ENTITIES[c]);
}

export function initials(name) {
  return String(name || '').split(/\s+/).filter(Boolean).slice(0, MAX_INITIALS).map((word) => word[0].toUpperCase()).join('');
}

/** The same hue for the same person or team on every device, with nothing stored (Chat's `avatarTint`). */
export function hue(key) {
  let hash = 0;
  for (const char of String(key)) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return hash % 360;
}

/** A count pill (unread messages): `99+` above 99, `muted` grey, `spoken` its text for screen readers. */
export function countHtml(count, { muted = false, spoken = '' } = {}) {
  if (!(count > 0)) return '';
  const shown = count > MAX_COUNT ? `${MAX_COUNT}+` : count;
  return `<span class="count${muted ? ' count--muted' : ''}"><span aria-hidden="true">${shown}</span>` +
    `<span class="sr">${esc(spoken || String(count))}</span></span>`;
}

/** Binom Account's address with `/account` and the path, coming back to this page (`?return=`). */
export function accountPage(baseUrl, path) {
  if (!baseUrl) return null;
  return `${String(baseUrl).replace(/\/+$/, '')}/account${path}?return=${encodeURIComponent(window.location.href)}`;
}

export const BASE_CSS = [
  ':host{display:inline-block;position:relative;vertical-align:middle;line-height:0;font-family:var(--font)}',
  '[hidden]{display:none!important}',
  'button{font:inherit;color:inherit}',
  '.trigger{appearance:none;border:0;background:none;padding:0;margin:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-height:var(--tap-size)}',
  '.trigger:focus-visible{outline:none}',
  // Photos and team marks: initials on a soft pastel of the key's hue, mixed into the theme's paper and ink.
  '.avatar{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:var(--bam-size);height:var(--bam-size);border-radius:50%;' +
    'background:var(--color-surface);border:1px solid var(--color-border);object-fit:cover;font-weight:600;font-size:calc(var(--bam-size) * .38);line-height:1;user-select:none;-webkit-user-drag:none;transition:opacity var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}',
  '.avatar--tinted{background:color-mix(in srgb,hsl(var(--bam-hue) 45% 62%) 32%,var(--color-bg));' +
    'border-color:color-mix(in srgb,hsl(var(--bam-hue) 38% 55%) 40%,var(--color-bg));color:color-mix(in srgb,hsl(var(--bam-hue) 40% 45%) 40%,var(--color-text))}',
  // The popover, fixed so no header clips it.
  '.menu{position:fixed;z-index:2147483000;top:0;left:0;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;min-width:260px;max-width:min(340px,calc(100vw - 16px));padding:6px;' +
    'background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border);border-radius:var(--radius);box-shadow:var(--shadow-popover);font-size:.9375rem;line-height:1.35;text-align:left;' +
    'opacity:0;visibility:hidden;transform:translateY(-4px);pointer-events:none;transition:opacity var(--motion-fast) var(--ease-in),transform var(--motion-fast) var(--ease-in),visibility 0s var(--motion-fast)}',
  '.menu[data-open]{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}',
  '.item{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:var(--menu-item-size);padding:0 12px;margin:0;border:0;border-radius:var(--radius-sm);' +
    'background:none;color:var(--color-text);font:inherit;text-align:left;text-decoration:none;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}',
  '.item:focus-visible{outline:none;background:var(--color-accent-soft)}',
  '@media (hover:hover){.item:hover{background:var(--color-accent-soft)}}',
  '.item .icon{flex:none;color:var(--color-muted)}',
  'div.item{cursor:default}',
  '@media (hover:hover){div.item:hover{background:none}}',
  '.label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.count{flex:none;box-sizing:border-box;min-width:20px;height:20px;padding:0 6px;border-radius:var(--radius-pill);background:var(--color-accent);color:var(--color-on-accent);font-size:.7rem;font-weight:600;line-height:20px;text-align:center;font-variant-numeric:tabular-nums}',
  '.count--muted{background:color-mix(in srgb,var(--color-muted) 70%,#fff)}',
  '.sr{position:absolute;width:1px;height:1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}',
  '.spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);border-top-color:var(--color-muted);animation:bam-spin .8s linear infinite;vertical-align:middle}',
  '@keyframes bam-spin{to{transform:rotate(360deg)}}',
  '.separator{height:1px;margin:4px 0;background:var(--color-border)}',
  // On a phone: a sheet risen from the bottom over the dimmed page, with a grabber on top.
  '.backdrop{position:fixed;inset:0;z-index:2147482999;background:var(--color-backdrop);opacity:0;visibility:hidden;transition:opacity var(--motion-base) var(--ease-out),visibility 0s var(--motion-base)}',
  '.backdrop[data-open]{opacity:1;visibility:visible;transition:opacity var(--motion-base) var(--ease-out)}',
  '.grabber{display:none}',
  '.menu[data-sheet]{top:auto!important;left:0!important;right:0;bottom:0;width:100%;max-width:none;max-height:calc(100dvh - 48px - env(safe-area-inset-top));overflow-y:auto;overscroll-behavior:contain;' +
    'padding:0 12px calc(12px + env(safe-area-inset-bottom));border:0;border-radius:var(--radius-lg) var(--radius-lg) 0 0;box-shadow:var(--shadow-dialog);font-size:1rem;transform:translateY(100%);' +
    'transition:transform var(--motion-fast) var(--ease-in),visibility 0s var(--motion-fast)}',
  '.menu[data-sheet][data-open]{transform:none;transition:transform var(--motion-slow) var(--ease-out)}',
  '.menu[data-sheet] .grabber{display:block;position:sticky;top:0;flex:none;height:20px;margin:0 -12px;background:var(--color-bg)}',
  '.menu[data-sheet] .grabber::before{content:"";position:absolute;top:8px;left:50%;width:36px;height:5px;border-radius:var(--radius-pill);background:var(--color-border);transform:translateX(-50%)}',
  '.menu[data-sheet] .item{min-height:var(--sheet-item-size);gap:12px}',
].join('');

// The app's own rows live in the page (light DOM), where the page's rules (the @binom/ui bare-button fill) beat
// ::slotted, so their row look is a page stylesheet added once per element name. `data-sheet` on the element: the
// phone's taller rows.
function addPageStyles(tag) {
  const id = `${tag}-styles`;
  if (document.getElementById(id)) return;
  const own = `${tag}>:is(button,a)`;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = [
    `${own}{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:var(--menu-item-size);padding:0 12px;margin:0;border:0;border-radius:var(--radius-sm);` +
      'background:none;color:var(--color-text);font:inherit;font-size:inherit;line-height:1.35;text-align:left;text-decoration:none;cursor:pointer;box-shadow:none;transition:background-color var(--motion-fast) var(--ease-standard)}',
    `${own}:focus-visible{outline:none;box-shadow:none;background:var(--color-accent-soft)}`,
    `@media (hover:hover){${own}:hover{background:var(--color-accent-soft);color:var(--color-text)}}`,
    `${own}>svg{flex:none;width:18px;height:18px;color:var(--color-muted)}`,
    `${tag}[data-sheet]>:is(button,a){min-height:var(--sheet-item-size);gap:12px}`,
  ].join('');
  document.head.appendChild(style);
}

const FOCUSABLE = 'button:not(:disabled),a[href]';

// Imported on a server (Next.js renders the page there first) there is no HTMLElement: the class is defined but
// never registered.
const ElementBase = typeof HTMLElement === 'undefined' ? class {} : HTMLElement;

/**
 * A header menu. A subclass gives `static tag`, `static eventPrefix`, `static align` ('start' or 'end': the edge
 * of the trigger the popover lines up with), `css()`, `triggerHtml()`, `menuHtml()` (with `<slot>`s where the
 * app's rows go, `data-item` on its own rows) and `select(item, detail)` handling.
 */
export class PopupMenu extends ElementBase {
  _open = false;

  connectedCallback() {
    // delegatesFocus: focus() on the element (an app's dialog handing focus back) lands on the button inside
    if (!this.shadowRoot) this.attachShadow({ mode: 'open', delegatesFocus: true });
    addPageStyles(this.constructor.tag);
    this._sheetQuery = window.matchMedia ? window.matchMedia(SHEET_QUERY) : null;
    this.render();
    this._onDoc = (e) => { if (this._open && !e.composedPath().includes(this)) this.close(); };
    this._onKey = (e) => { if (this._open) this.onKey(e); };
    this._onReflow = () => { if (this._open) this.position(); };
    // The app's own rows (light DOM) close the menu once chosen, like the built-in ones (those close themselves).
    if (!this._onOwnItem) {
      this._onOwnItem = (e) => { if (this._open && !this.shadowRoot.contains(e.composedPath()[0])) this.close(true); };
      this.addEventListener('click', this._onOwnItem);
    }
    document.addEventListener('pointerdown', this._onDoc, true);
    document.addEventListener('keydown', this._onKey);
    window.addEventListener('resize', this._onReflow);
    window.addEventListener('scroll', this._onReflow, true);
  }

  disconnectedCallback() {
    document.removeEventListener('pointerdown', this._onDoc, true);
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onReflow);
    window.removeEventListener('scroll', this._onReflow, true);
  }

  attributeChangedCallback() {
    if (this.shadowRoot) this.render();
  }

  get isOpen() {
    return this._open;
  }

  /** A text of the menu: the app's `label-<id>` attribute, else the English default. */
  label(id) {
    const own = this.getAttribute(`label-${id}`);
    return own ? own : this.constructor.labels[id];
  }

  isHidden(id) {
    return String(this.getAttribute('hide') || '').split(/[\s,]+/).includes(id);
  }

  render() {
    this.shadowRoot.innerHTML =
      `<style>${BASE_CSS}${this.css()}</style>${this.triggerHtml()}<div class="backdrop" part="backdrop"></div>` +
      `<div class="menu" part="menu" role="menu" aria-label="${esc(this.menuLabel())}"><div class="grabber" aria-hidden="true"></div>${this.menuHtml()}</div>`;
    this.$trigger = this.shadowRoot.querySelector('.trigger');
    this.$menu = this.shadowRoot.querySelector('.menu');
    this.$backdrop = this.shadowRoot.querySelector('.backdrop');
    this.$trigger.addEventListener('click', () => this.toggle());
    this.$backdrop.addEventListener('click', () => this.close(true));
    for (const el of this.shadowRoot.querySelectorAll('[data-item]')) {
      el.addEventListener('click', () => this.choose(el.dataset.item, { ...el.dataset }));
    }
    // An image that does not load (a removed team logo) leaves its text, not a broken picture.
    for (const img of this.shadowRoot.querySelectorAll('img[data-drop-on-error]')) {
      img.addEventListener('error', () => img.remove());
    }
    // an attribute changed while the menu was open: the new markup starts closed, so open it again
    if (this._open) this.show(false);
  }

  /** A built-in row was chosen: the app hears it first (`<prefix>-select`, cancelable), then the row's default. */
  choose(item, data) {
    const url = this.urlOf(item, data);
    const detail = { item, url, ...this.detailOf(item, data) };
    const event = new CustomEvent(`${this.constructor.eventPrefix}-select`, { bubbles: true, composed: true, cancelable: true, detail });
    const allowed = this.dispatchEvent(event);
    if (!this.keepsOpen(item)) this.close(true);
    if (allowed && url) window.location.assign(url);
  }

  /** The Binom Account page a row opens by default (null: the row only tells the app). */
  urlOf() {
    return null;
  }

  /** More of the select event's `detail` for a row. */
  detailOf() {
    return {};
  }

  keepsOpen() {
    return false;
  }

  isSheet() {
    return !!(this._sheetQuery && this._sheetQuery.matches);
  }

  position() {
    if (this.isSheet()) return;
    const r = this.$trigger.getBoundingClientRect();
    const m = this.$menu;
    const w = m.offsetWidth || 260;
    const h = m.offsetHeight || 400;
    const wanted = this.constructor.align === 'start' ? r.left : r.right - w;
    const left = Math.max(8, Math.min(wanted, window.innerWidth - w - 8));
    let top = r.bottom + 4;
    if (top + h > window.innerHeight - 8 && r.top - 4 - h > 0) top = r.top - 4 - h;
    m.style.left = `${left}px`;
    m.style.top = `${top}px`;
  }

  /** The menu's focusable rows top to bottom, the app's slotted rows in their places. */
  items() {
    const rows = [];
    for (const el of this.$menu.querySelectorAll(`${FOCUSABLE},slot`)) {
      if (el.tagName !== 'SLOT') rows.push(el);
      else for (const own of el.assignedElements()) if (own.matches(FOCUSABLE)) rows.push(own);
    }
    return rows;
  }

  onKey(e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close(true);
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
    const items = this.items();
    if (!items.length) return;
    e.preventDefault();
    const at = items.indexOf(this.shadowRoot.activeElement || document.activeElement);
    const last = items.length - 1;
    const next = { Home: 0, End: last, ArrowDown: (at + 1) % items.length, ArrowUp: (at - 1 + items.length) % items.length }[e.key];
    items[next].focus();
  }

  show(focusFirst) {
    const sheet = this.isSheet();
    this.$menu.toggleAttribute('data-sheet', sheet);
    this.toggleAttribute('data-sheet', sheet);
    this.$menu.setAttribute('data-open', '');
    this.$backdrop.toggleAttribute('data-open', sheet);
    this.$trigger.setAttribute('aria-expanded', 'true');
    this.position();
    if (focusFirst) this.items()[0]?.focus({ preventScroll: true });
  }

  open() {
    if (this._open) return;
    this._open = true;
    this.show(true);
    this.dispatchEvent(new CustomEvent(`${this.constructor.eventPrefix}-open`, { bubbles: true, composed: true }));
  }

  /** `toButton`: focus returns to the trigger (Escape, a row chosen), so an app's dialog hands it back there. */
  close(toButton) {
    if (!this._open) return;
    this._open = false;
    this.$menu.removeAttribute('data-open');
    this.$backdrop.removeAttribute('data-open');
    this.$trigger.setAttribute('aria-expanded', 'false');
    if (toButton) this.$trigger.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent(`${this.constructor.eventPrefix}-close`, { bubbles: true, composed: true }));
  }

  toggle() {
    if (this._open) this.close();
    else this.open();
  }
}
