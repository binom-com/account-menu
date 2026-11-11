/*
 * Binom account menu — <binom-account-menu>
 *
 * One user menu for the right corner of every Binom app (Chat, Meet, Ideas, Calendar, Synergy). The user's photo
 * (or initials) opens a menu: the profile card (photo with a camera badge, name, email, team), the team's credits
 * (a click opens Billing in Binom Account), Manage team, Settings, the app's own rows, Sign out and the app's
 * version. Teams are switched in <binom-team-switcher>, beside the app's name on the left.
 *
 *   <binom-account-menu user-name="Design Check" user-email="dc@example.test" team-name="Team example"
 *     team-id="t_1" credits="1250" can-top-up account-url="https://account.binom.com" version="1.4.0">
 *     <button slot="start">…</button>  (the app's rows after the credits)
 *     <button>…</button>               (the app's rows after Settings)
 *   </binom-account-menu>
 *
 * Every built-in row fires `binom-account-menu-select` (bubbles, composed, cancelable; detail { item, url }).
 * Rows with a Binom Account page (photo, credits, manage-team) open `url` unless the app calls preventDefault().
 * The full contract: docs/INTEGRATION.md.
 */
import { PopupMenu, accountPage, countHtml, esc, hue, icon, initials } from './popup.js';

const DEFAULT_SIZE = 32;
/** The rows that can carry a count (`badge-<id>`). */
const BADGED = ['manage-team', 'settings'];

/** The built-in rows and texts; their ids are the `item` of the select event, `hide` and `label-*`. */
const LABELS = {
  photo: 'Change photo',
  credits: 'Credits',
  unlimited: 'Unlimited',
  'top-up': 'Top up credits',
  'manage-team': 'Manage team',
  settings: 'Settings',
  'sign-out': 'Sign out',
  version: 'Version',
  menu: 'Account menu',
  loading: 'Loading',
};

/** `credits`: a number, `unlimited` or `loading`; anything else (or no attribute) hides the row. */
function parseCredits(value) {
  if (value == null) return null;
  const v = String(value).trim().toLowerCase();
  if (v === 'unlimited' || v === 'loading') return v;
  const n = Number(v);
  return v !== '' && Number.isFinite(n) ? n : null;
}

const CSS = [
  // The header button: a round photo inside a tap-sized target; the focus ring hugs the avatar.
  '.trigger{min-width:var(--tap-size);border-radius:50%}',
  '.trigger:focus-visible .avatar{box-shadow:0 0 0 3px var(--color-focus-ring)}',
  // The profile card: the photo (a click changes it), name, email and the open team.
  '.who{display:flex;align-items:center;gap:12px;padding:6px 10px 10px;margin-bottom:4px;border-bottom:1px solid var(--color-border);line-height:1.3}',
  '.who-text{display:flex;flex-direction:column;min-width:0}',
  '.who-text>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.name{font-weight:600}',
  '.email{color:var(--color-muted);font-size:.875rem}',
  '.team{display:flex;align-items:center;gap:6px;margin-top:6px;font-weight:600}',
  '.team-name{min-width:0;overflow:hidden;text-overflow:ellipsis}',
  '.team-logo{flex:none;width:18px;height:18px;border-radius:var(--radius-xs);object-fit:cover}',
  '.photo{position:relative;flex:none;appearance:none;padding:0;border:0;border-radius:50%;background:none;cursor:pointer;line-height:0;--bam-size:44px}',
  '.photo .avatar{font-size:15px}',
  '.photo:disabled{cursor:default}',
  '.photo:focus-visible{outline:none}',
  '.photo:focus-visible .avatar{box-shadow:0 0 0 3px var(--color-focus-ring)}',
  '@media (hover:hover){.photo:hover:not(:disabled) .avatar{opacity:.75}}',
  '.badge{position:absolute;right:-2px;bottom:-2px;display:grid;place-items:center;width:20px;height:20px;border-radius:50%;background:var(--color-accent);color:var(--color-on-accent)}',
  // The credits: the balance at the end; for those who may pay the row is a button with a + (Billing).
  '.value{font-weight:600;font-variant-numeric:tabular-nums}',
  '.top-up{display:grid;place-items:center;flex:none;width:var(--icon-button-size-sm);height:var(--icon-button-size-sm);margin:-6px -8px -6px -4px;border-radius:50%;color:var(--color-muted)}',
  '.item:hover .top-up,.item:focus-visible .top-up{color:var(--color-text)}',
  '.version{padding:6px 10px 2px;font-size:11px;color:var(--color-muted)}',
].join('');

class BinomAccountMenu extends PopupMenu {
  static tag = 'binom-account-menu';
  static eventPrefix = 'binom-account-menu';
  static align = 'end';
  static labels = LABELS;
  static observedAttributes = [
    'user-name', 'user-email', 'user-photo', 'user-id', 'team-name', 'team-logo', 'team-id', 'credits', 'can-top-up',
    'account-url', 'version', 'hide', 'size', 'photo-busy',
    ...Object.keys(LABELS).map((id) => `label-${id}`),
    ...BADGED.flatMap((id) => [`badge-${id}`, `badge-${id}-muted`, `badge-${id}-label`]),
  ];

  css() {
    return CSS;
  }

  menuLabel() {
    return this.getAttribute('user-name') || this.label('menu');
  }

  avatar() {
    const name = this.getAttribute('user-name') || '';
    const photo = this.getAttribute('user-photo');
    if (photo) return `<img class="avatar" src="${esc(photo)}" alt="" draggable="false">`;
    const key = this.getAttribute('user-id') || name;
    return `<span class="avatar avatar--tinted" style="--bam-hue:${hue(key)}" aria-hidden="true">${esc(initials(name))}</span>`;
  }

  triggerHtml() {
    const size = Math.max(20, Math.min(64, Number(this.getAttribute('size')) || DEFAULT_SIZE));
    const name = this.getAttribute('user-name') || '';
    const label = this.label('menu') + (name ? ` — ${name}` : '');
    return `<button type="button" class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(label)}" ` +
      `title="${esc(name)}" style="--bam-size:${size}px">${this.avatar()}</button>`;
  }

  menuHtml() {
    // Manage team needs a team, unless the app handles the click itself.
    const hasTeam = !!(this.getAttribute('team-id') || this.getAttribute('team-name'));
    const version = this.getAttribute('version');
    return this.whoHtml() +
      this.creditsHtml() +
      '<slot name="start"></slot>' +
      (hasTeam ? this.rowHtml('manage-team', 'users') : '') +
      this.rowHtml('settings', 'settings') +
      '<slot></slot>' +
      this.rowHtml('sign-out', 'signOut') +
      (version ? `<div class="version">${esc(`${this.label('version')} ${version}`)}</div>` : '');
  }

  whoHtml() {
    const teamName = this.getAttribute('team-name');
    const teamLogo = this.getAttribute('team-logo');
    const busy = this.hasAttribute('photo-busy');
    const photoLabel = esc(this.label('photo'));
    const photo = this.isHidden('photo')
      ? `<span class="photo">${this.avatar()}</span>`
      : `<button type="button" class="photo" data-item="photo" aria-label="${photoLabel}" title="${photoLabel}"${busy ? ' disabled aria-busy="true"' : ''}>` +
        `${this.avatar()}<span class="badge" aria-hidden="true">${icon('camera', 12)}</span></button>`;
    const logo = teamLogo ? `<img class="team-logo" src="${esc(teamLogo)}" alt="" data-drop-on-error>` : '';
    const team = teamName ? `<span class="team">${logo}<span class="team-name">${esc(teamName)}</span></span>` : '';
    return `<div class="who">${photo}<div class="who-text"><span class="name">${esc(this.getAttribute('user-name'))}</span>` +
      `<span class="email">${esc(this.getAttribute('user-email'))}</span>${team}</div></div>`;
  }

  creditsHtml() {
    const credits = parseCredits(this.getAttribute('credits'));
    if (credits === null || this.isHidden('credits')) return '';
    const value = credits === 'loading'
      ? `<span class="spinner" role="status" aria-label="${esc(this.label('loading'))}"></span>`
      : esc(credits === 'unlimited' ? this.label('unlimited') : credits.toLocaleString('en-US'));
    const start = `${icon('coins', 18)}<span class="label">${esc(this.label('credits'))}</span><span class="value">${value}</span>`;
    const canTopUp = typeof credits === 'number' && this.hasAttribute('can-top-up');
    if (!canTopUp) return `<div class="item credits">${start}</div>`;
    return `<button type="button" class="item credits" role="menuitem" data-item="credits" title="${esc(this.label('top-up'))}">` +
      `${start}<span class="top-up" aria-hidden="true">${icon('plus', 16)}</span></button>`;
  }

  /** `badge-<id>`: a count after the label; `-muted` greys it, `-label` is its text for screen readers. */
  rowHtml(id, iconName) {
    if (this.isHidden(id)) return '';
    const badge = BADGED.includes(id)
      ? countHtml(Number(this.getAttribute(`badge-${id}`)), {
          muted: this.hasAttribute(`badge-${id}-muted`),
          spoken: this.getAttribute(`badge-${id}-label`),
        })
      : '';
    return `<button type="button" class="item" role="menuitem" data-item="${id}">${icon(iconName, 18)}` +
      `<span class="label">${esc(this.label(id))}</span>${badge}</button>`;
  }

  /** Binom Account's pages, the same in every app: `/account/profile` and `/account/teams/{id}/members|credits`. */
  urlOf(item) {
    const base = this.getAttribute('account-url');
    const teamId = this.getAttribute('team-id');
    if (item === 'photo') return accountPage(base, '/profile');
    if (!teamId) return null;
    const team = `/teams/${encodeURIComponent(teamId)}`;
    if (item === 'credits') return accountPage(base, `${team}/credits`);
    if (item === 'manage-team') return accountPage(base, `${team}/members`);
    return null;
  }

  /** The photo keeps the menu open while the app picks and uploads it (`photo-busy`). */
  keepsOpen(item) {
    return item === 'photo';
  }
}

if (typeof window !== 'undefined' && window.customElements && !customElements.get(BinomAccountMenu.tag)) {
  customElements.define(BinomAccountMenu.tag, BinomAccountMenu);
}

export { BinomAccountMenu, LABELS as ACCOUNT_MENU_LABELS };
