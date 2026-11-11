/*
 * Binom account menu — <binom-account-menu>
 *
 * One user menu for the right corner of every Binom app (Chat, Meet, Ideas, Calendar, Synergy), the partner of
 * <binom-switcher> on the left. The user's photo (or initials) opens a menu: the profile card (photo with a camera
 * badge, name, email, team), the team's credits (a click opens Billing in Binom Account), Manage team, Settings,
 * the app's own items, Switch account, Sign out and the app's version. On a phone it rises from the bottom as a sheet.
 * Shadow DOM, no dependencies; the look comes from the @binom/ui tokens on the page (`--color-*`, `--radius*`, ...).
 *
 *   <binom-account-menu user-name="Design Check" user-email="dc@example.test" team-name="Team example"
 *     team-id="t_1" credits="1250" can-top-up account-url="https://account.binom.com" version="1.4.0">
 *     <button slot="start">…</button>  (the app's items after the credits)
 *     <button>…</button>               (the app's items after Settings)
 *   </binom-account-menu>
 *
 * Every built-in item fires `binom-account-menu-select` (bubbles, composed, cancelable; detail { item, url }).
 * Items with a Binom Account page (photo, credits, manage-team) open `url` unless the app calls preventDefault().
 * The full contract: README.md.
 */
(function () {
  if (typeof window === 'undefined' || !window.customElements) return;
  if (customElements.get('binom-account-menu')) return;

  var SELECT_EVENT = 'binom-account-menu-select';
  /** Below this window width the menu is a bottom sheet, as in Chat (its `narrow` layout). */
  var SHEET_QUERY = '(max-width: 799px)';
  var MAX_INITIALS = 2;
  var DEFAULT_SIZE = 32;

  /** The built-in items, top to bottom; their ids are the `item` of the select event, `hide` and `label-*`. */
  var LABELS = {
    photo: 'Change photo',
    credits: 'Credits',
    unlimited: 'Unlimited',
    'top-up': 'Top up credits',
    'manage-team': 'Manage team',
    settings: 'Settings',
    'switch-account': 'Switch account',
    'sign-out': 'Sign out',
    version: 'Version',
    menu: 'Account menu',
  };

  // Lucide icons (ISC), drawn thin like the rest of Binom (@binom/ui base rules).
  var ICONS = {
    camera: '<path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/>',
    coins: '<circle cx="8" cy="8" r="6"/><path d="M18.09 10.37A6 6 0 1 1 10.34 18"/><path d="M7 6h1v4"/><path d="m16.71 13.88.7.71-2.82 2.82"/>',
    plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
    users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
    settings: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    switch: '<path d="M8 3 4 7l4 4"/><path d="M4 7h16"/><path d="m16 21 4-4-4-4"/><path d="M20 17H4"/>',
    signOut: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/>',
  };

  function icon(name, size) {
    return '<svg class="icon" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
      'stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICONS[name] + '</svg>';
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function initials(name) {
    return String(name || '').split(/\s+/).filter(Boolean).slice(0, MAX_INITIALS)
      .map(function (word) { return word[0].toUpperCase(); }).join('');
  }

  /** The same hue for the same person on every device, with nothing stored (Chat's `avatarTint`). */
  function hue(key) {
    var hash = 0;
    for (var i = 0; i < key.length; i++) hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
    return hash % 360;
  }

  /** `credits`: a number, `unlimited` or `loading`; anything else (or no attribute) hides the row. */
  function parseCredits(value) {
    if (value == null) return null;
    var v = String(value).trim().toLowerCase();
    if (v === 'unlimited' || v === 'loading') return v;
    var n = Number(v);
    return v !== '' && isFinite(n) ? n : null;
  }

  /** Binom Account's pages, the same in every app: `/account/profile` and `/account/teams/{id}/members|credits`. */
  function accountPage(baseUrl, item, teamId) {
    if (!baseUrl) return null;
    var base = String(baseUrl).replace(/\/+$/, '') + '/account';
    var back = '?return=' + encodeURIComponent(window.location.href);
    if (item === 'photo') return base + '/profile' + back;
    if (!teamId) return null;
    var team = base + '/teams/' + encodeURIComponent(teamId);
    if (item === 'credits') return team + '/credits' + back;
    if (item === 'manage-team') return team + '/members' + back;
    return null;
  }

  var CSS = [
    ':host{display:inline-block;position:relative;vertical-align:middle;line-height:0;font-family:var(--font)}',
    '[hidden]{display:none!important}',
    'button{font:inherit;color:inherit}',
    // The header button: a round photo inside a tap-sized target; no border, focus rings hug the avatar.
    '.trigger{appearance:none;border:0;background:none;padding:0;margin:0;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;min-width:var(--tap-size);min-height:var(--tap-size);border-radius:50%}',
    '.trigger:focus-visible{outline:none}',
    '.trigger:focus-visible .avatar{box-shadow:0 0 0 3px var(--color-focus-ring)}',
    '.avatar{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:var(--bam-size);height:var(--bam-size);border-radius:50%;' +
      'background:var(--color-surface);border:1px solid var(--color-border);object-fit:cover;font-weight:600;font-size:calc(var(--bam-size) * .38);line-height:1;user-select:none;-webkit-user-drag:none;transition:opacity var(--motion-fast) var(--ease-standard),box-shadow var(--motion-fast) var(--ease-standard)}',
    // Initials on a soft pastel of the person's hue, mixed into the theme's paper and ink, so it suits both themes.
    '.avatar--tinted{background:color-mix(in srgb,hsl(var(--bam-hue) 45% 62%) 32%,var(--color-bg));' +
      'border-color:color-mix(in srgb,hsl(var(--bam-hue) 38% 55%) 40%,var(--color-bg));color:color-mix(in srgb,hsl(var(--bam-hue) 40% 45%) 40%,var(--color-text))}',
    // The menu: a popover under the button's right edge (fixed, so no header clips it).
    '.menu{position:fixed;z-index:2147483000;top:0;left:0;box-sizing:border-box;display:flex;flex-direction:column;gap:2px;min-width:260px;max-width:min(340px,calc(100vw - 16px));padding:6px;' +
      'background:var(--color-bg);color:var(--color-text);border:1px solid var(--color-border);border-radius:var(--radius);box-shadow:var(--shadow-popover);font-size:.9375rem;line-height:1.35;text-align:left;' +
      'opacity:0;visibility:hidden;transform:translateY(-4px);pointer-events:none;transition:opacity var(--motion-fast) var(--ease-in),transform var(--motion-fast) var(--ease-in),visibility 0s var(--motion-fast)}',
    '.menu[data-open]{opacity:1;visibility:visible;transform:none;pointer-events:auto;transition:opacity var(--motion-base) var(--ease-out),transform var(--motion-base) var(--ease-out)}',
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
    // Rows: built-in buttons, the credits and the app's own items (slotted) look alike.
    '.item{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:var(--menu-item-size);padding:0 12px;margin:0;border:0;border-radius:var(--radius-sm);' +
      'background:none;color:var(--color-text);font:inherit;text-align:left;text-decoration:none;cursor:pointer;transition:background-color var(--motion-fast) var(--ease-standard)}',
    '.item:focus-visible{outline:none;background:var(--color-accent-soft)}',
    '@media (hover:hover){.item:hover{background:var(--color-accent-soft)}}',
    '.item .icon{flex:none;color:var(--color-muted)}',
    '.label{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
    // The credits: the balance at the end; for those who may pay the row is a button with a + (Billing).
    'div.item{cursor:default}',
    '@media (hover:hover){div.item:hover{background:none}}',
    '.value{font-weight:600;font-variant-numeric:tabular-nums}',
    '.top-up{display:grid;place-items:center;flex:none;width:var(--icon-button-size-sm);height:var(--icon-button-size-sm);margin:-6px -8px -6px -4px;border-radius:50%;color:var(--color-muted)}',
    '.item:hover .top-up,.item:focus-visible .top-up{color:var(--color-text)}',
    '.spinner{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid var(--color-border);border-top-color:var(--color-muted);animation:bam-spin .8s linear infinite;vertical-align:middle}',
    '@keyframes bam-spin{to{transform:rotate(360deg)}}',
    '.version{padding:6px 10px 2px;font-size:11px;color:var(--color-muted)}',
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

  // The app's own items live in the page (light DOM), where the page's rules (the @binom/ui bare-button fill) beat
  // ::slotted, so their row look is a page stylesheet added once. `data-sheet` on the element: the phone's taller rows.
  var OWN_ITEM = 'binom-account-menu>:is(button,a)';
  var PAGE_CSS = [
    OWN_ITEM + '{box-sizing:border-box;display:flex;align-items:center;gap:10px;width:100%;min-height:var(--menu-item-size);padding:0 12px;margin:0;border:0;border-radius:var(--radius-sm);' +
      'background:none;color:var(--color-text);font:inherit;font-size:inherit;line-height:1.35;text-align:left;text-decoration:none;cursor:pointer;box-shadow:none;transition:background-color var(--motion-fast) var(--ease-standard)}',
    OWN_ITEM + ':focus-visible{outline:none;box-shadow:none;background:var(--color-accent-soft)}',
    '@media (hover:hover){' + OWN_ITEM + ':hover{background:var(--color-accent-soft);color:var(--color-text)}}',
    OWN_ITEM + '>svg{flex:none;width:18px;height:18px;color:var(--color-muted)}',
    'binom-account-menu[data-sheet]>:is(button,a){min-height:var(--sheet-item-size);gap:12px}',
  ].join('');

  function addPageStyles() {
    if (document.getElementById('binom-account-menu-styles')) return;
    var style = document.createElement('style');
    style.id = 'binom-account-menu-styles';
    style.textContent = PAGE_CSS;
    document.head.appendChild(style);
  }

  function BinomAccountMenu() {
    var el = Reflect.construct(HTMLElement, [], BinomAccountMenu);
    el._open = false;
    return el;
  }
  BinomAccountMenu.prototype = Object.create(HTMLElement.prototype);
  BinomAccountMenu.prototype.constructor = BinomAccountMenu;
  BinomAccountMenu.observedAttributes = [
    'user-name', 'user-email', 'user-photo', 'user-id', 'team-name', 'team-logo', 'team-id', 'credits', 'can-top-up',
    'account-url', 'version', 'hide', 'size', 'photo-busy',
  ].concat(Object.keys(LABELS).map(function (id) { return 'label-' + id; }));

  BinomAccountMenu.prototype.connectedCallback = function () {
    // delegatesFocus: focus() on the element (an app's dialog handing focus back) lands on the button inside
    if (!this.shadowRoot) this.attachShadow({ mode: 'open', delegatesFocus: true });
    addPageStyles();
    this._sheetQuery = window.matchMedia ? window.matchMedia(SHEET_QUERY) : null;
    this.render();
    var self = this;
    this._onDoc = function (e) { if (self._open && !e.composedPath().includes(self)) self.close(); };
    this._onKey = function (e) { if (self._open) self.onKey(e); };
    this._onReflow = function () { if (self._open) self.position(); };
    // The app's own items (light DOM) close the menu once chosen, like the built-in ones (those close themselves).
    if (!this._onOwnItem) {
      this._onOwnItem = function (e) {
        if (self._open && !self.shadowRoot.contains(e.composedPath()[0])) self.close(true);
      };
      this.addEventListener('click', this._onOwnItem);
    }
    document.addEventListener('pointerdown', this._onDoc, true);
    document.addEventListener('keydown', this._onKey);
    window.addEventListener('resize', this._onReflow);
    window.addEventListener('scroll', this._onReflow, true);
  };
  BinomAccountMenu.prototype.disconnectedCallback = function () {
    document.removeEventListener('pointerdown', this._onDoc, true);
    document.removeEventListener('keydown', this._onKey);
    window.removeEventListener('resize', this._onReflow);
    window.removeEventListener('scroll', this._onReflow, true);
  };
  BinomAccountMenu.prototype.attributeChangedCallback = function () { if (this.shadowRoot) this.render(); };

  BinomAccountMenu.prototype.label = function (id) {
    var own = this.getAttribute('label-' + id);
    return own != null && own !== '' ? own : LABELS[id];
  };
  BinomAccountMenu.prototype.isHidden = function (id) {
    return String(this.getAttribute('hide') || '').split(/[\s,]+/).indexOf(id) !== -1;
  };
  BinomAccountMenu.prototype.pageUrl = function (item) {
    return accountPage(this.getAttribute('account-url'), item, this.getAttribute('team-id'));
  };

  BinomAccountMenu.prototype.avatar = function (extraClass) {
    var name = this.getAttribute('user-name') || '';
    var photo = this.getAttribute('user-photo');
    if (photo) return '<img class="avatar ' + extraClass + '" src="' + esc(photo) + '" alt="" draggable="false">';
    var key = this.getAttribute('user-id') || name;
    return '<span class="avatar avatar--tinted ' + extraClass + '" style="--bam-hue:' + hue(key) + '" aria-hidden="true">' + esc(initials(name)) + '</span>';
  };

  BinomAccountMenu.prototype.whoHtml = function () {
    var teamName = this.getAttribute('team-name');
    var teamLogo = this.getAttribute('team-logo');
    var canChangePhoto = !this.isHidden('photo');
    var busy = this.hasAttribute('photo-busy');
    var photo = canChangePhoto
      ? '<button type="button" class="photo" data-item="photo" aria-label="' + esc(this.label('photo')) + '" title="' + esc(this.label('photo')) + '"' +
        (busy ? ' disabled aria-busy="true"' : '') + '>' + this.avatar('') + '<span class="badge" aria-hidden="true">' + icon('camera', 12) + '</span></button>'
      : '<span class="photo">' + this.avatar('') + '</span>';
    var team = teamName
      ? '<span class="team">' + (teamLogo ? '<img class="team-logo" src="' + esc(teamLogo) + '" alt="">' : '') +
        '<span class="team-name">' + esc(teamName) + '</span></span>'
      : '';
    return '<div class="who">' + photo + '<div class="who-text"><span class="name">' + esc(this.getAttribute('user-name')) + '</span>' +
      '<span class="email">' + esc(this.getAttribute('user-email')) + '</span>' + team + '</div></div>';
  };

  BinomAccountMenu.prototype.creditsHtml = function () {
    var credits = parseCredits(this.getAttribute('credits'));
    if (credits === null || this.isHidden('credits')) return '';
    var value = credits === 'loading'
      ? '<span class="spinner" role="status" aria-label="Loading"></span>'
      : esc(credits === 'unlimited' ? this.label('unlimited') : credits.toLocaleString('en-US'));
    var start = icon('coins', 18) + '<span class="label">' + esc(this.label('credits')) + '</span><span class="value">' + value + '</span>';
    var canTopUp = typeof credits === 'number' && this.hasAttribute('can-top-up');
    if (!canTopUp) return '<div class="item credits">' + start + '</div>';
    return '<button type="button" class="item credits" role="menuitem" data-item="credits" title="' + esc(this.label('top-up')) + '">' +
      start + '<span class="top-up" aria-hidden="true">' + icon('plus', 16) + '</span></button>';
  };

  BinomAccountMenu.prototype.itemHtml = function (id, iconName) {
    if (this.isHidden(id)) return '';
    return '<button type="button" class="item" role="menuitem" data-item="' + id + '">' + icon(iconName, 18) +
      '<span class="label">' + esc(this.label(id)) + '</span></button>';
  };

  BinomAccountMenu.prototype.render = function () {
    var size = Math.max(20, Math.min(64, Number(this.getAttribute('size')) || DEFAULT_SIZE));
    var name = this.getAttribute('user-name') || '';
    var version = this.getAttribute('version');
    // Manage team needs a team page to open, unless the app handles the click itself.
    var hasTeam = !!this.getAttribute('team-id') || !!this.getAttribute('team-name');
    this.shadowRoot.innerHTML =
      '<style>' + CSS + '</style>' +
      '<button type="button" class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false" ' +
        'aria-label="' + esc(this.label('menu') + (name ? ' — ' + name : '')) + '" title="' + esc(name) + '" style="--bam-size:' + size + 'px">' +
        this.avatar('') + '</button>' +
      '<div class="backdrop" part="backdrop"></div>' +
      '<div class="menu" part="menu" role="menu" aria-label="' + esc(name || this.label('menu')) + '">' +
        '<div class="grabber" aria-hidden="true"></div>' +
        this.whoHtml() +
        this.creditsHtml() +
        '<slot name="start"></slot>' +
        (hasTeam ? this.itemHtml('manage-team', 'users') : '') +
        this.itemHtml('settings', 'settings') +
        '<slot></slot>' +
        this.itemHtml('switch-account', 'switch') +
        this.itemHtml('sign-out', 'signOut') +
        (version ? '<div class="version">' + esc(this.label('version') + ' ' + version) + '</div>' : '') +
      '</div>';
    var self = this;
    this.$trigger = this.shadowRoot.querySelector('.trigger');
    this.$menu = this.shadowRoot.querySelector('.menu');
    this.$backdrop = this.shadowRoot.querySelector('.backdrop');
    this.$trigger.addEventListener('click', function () { self.toggle(); });
    this.$backdrop.addEventListener('click', function () { self.close(true); });
    this.shadowRoot.querySelectorAll('[data-item]').forEach(function (el) {
      el.addEventListener('click', function () { self.select(el.getAttribute('data-item')); });
    });
    // an attribute changed while the menu was open: the new markup starts closed, so open it again
    if (this._open) this.show(false);
  };

  /**
   * A built-in item was chosen: the event goes to the app first; an item with a Binom Account page opens it unless
   * the app prevented that. The photo keeps the menu open while the app picks and uploads it (`photo-busy`).
   */
  BinomAccountMenu.prototype.select = function (item) {
    var url = this.pageUrl(item);
    var event = new CustomEvent(SELECT_EVENT, { bubbles: true, composed: true, cancelable: true, detail: { item: item, url: url } });
    var allowed = this.dispatchEvent(event);
    if (item !== 'photo') this.close(true);
    if (allowed && url) window.location.assign(url);
  };

  BinomAccountMenu.prototype.isSheet = function () { return !!(this._sheetQuery && this._sheetQuery.matches); };

  BinomAccountMenu.prototype.position = function () {
    if (this.isSheet()) return;
    var r = this.$trigger.getBoundingClientRect();
    var m = this.$menu;
    var w = m.offsetWidth || 260;
    var h = m.offsetHeight || 400;
    var left = Math.max(8, Math.min(r.right - w, window.innerWidth - w - 8));
    var top = r.bottom + 4;
    if (top + h > window.innerHeight - 8 && r.top - 4 - h > 0) top = r.top - 4 - h;
    m.style.left = left + 'px';
    m.style.top = top + 'px';
  };

  /** The menu's focusable rows top to bottom, the app's slotted items in their places. */
  BinomAccountMenu.prototype.items = function () {
    var rows = [];
    var FOCUSABLE = 'button:not(:disabled),a[href]';
    this.$menu.querySelectorAll(FOCUSABLE + ',slot').forEach(function (el) {
      if (el.tagName !== 'SLOT') rows.push(el);
      else el.assignedElements().forEach(function (own) { if (own.matches(FOCUSABLE)) rows.push(own); });
    });
    return rows;
  };

  BinomAccountMenu.prototype.onKey = function (e) {
    if (e.key === 'Escape') {
      e.preventDefault();
      this.close(true);
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
    var items = this.items();
    if (!items.length) return;
    e.preventDefault();
    var active = this.shadowRoot.activeElement || document.activeElement;
    var at = items.indexOf(active);
    var next = e.key === 'Home' ? 0
      : e.key === 'End' ? items.length - 1
        : e.key === 'ArrowDown' ? (at + 1) % items.length
          : (at - 1 + items.length) % items.length;
    items[next].focus();
  };

  BinomAccountMenu.prototype.show = function (focusFirst) {
    var sheet = this.isSheet();
    this.$menu.toggleAttribute('data-sheet', sheet);
    this.toggleAttribute('data-sheet', sheet);
    this.$menu.setAttribute('data-open', '');
    this.$backdrop.toggleAttribute('data-open', sheet);
    this.$trigger.setAttribute('aria-expanded', 'true');
    this.position();
    if (focusFirst) {
      var first = this.items()[0];
      if (first) first.focus({ preventScroll: true });
    }
  };

  BinomAccountMenu.prototype.open = function () {
    if (this._open) return;
    this._open = true;
    this.show(true);
    this.dispatchEvent(new CustomEvent('binom-account-menu-open', { bubbles: true, composed: true }));
  };

  /** `toButton`: focus returns to the avatar (Escape, an item chosen), so an app's dialog hands it back there. */
  BinomAccountMenu.prototype.close = function (toButton) {
    if (!this._open) return;
    this._open = false;
    this.$menu.removeAttribute('data-open');
    this.$backdrop.removeAttribute('data-open');
    this.$trigger.setAttribute('aria-expanded', 'false');
    if (toButton) this.$trigger.focus({ preventScroll: true });
    this.dispatchEvent(new CustomEvent('binom-account-menu-close', { bubbles: true, composed: true }));
  };

  BinomAccountMenu.prototype.toggle = function () { if (this._open) this.close(); else this.open(); };

  Object.defineProperty(BinomAccountMenu.prototype, 'isOpen', { get: function () { return this._open; } });

  customElements.define('binom-account-menu', BinomAccountMenu);
  window.BinomAccountMenu = { labels: LABELS, selectEvent: SELECT_EVENT };
})();
