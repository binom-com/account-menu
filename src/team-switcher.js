/*
 * Binom team switcher — <binom-team-switcher>
 *
 * The open team, beside the app's name on the left of the header (after <binom-switcher> and the name, as Google
 * Cloud's project picker or Railway's workspace): its logo (or initials), its name and ⇕. A click lists the user's
 * teams (round logo or initials, name, role, unread count, ✓ on the open one) and **Manage team** (the open team's
 * members page in Binom Account) at the bottom. The
 * other teams' unread total shows on the button. On a phone the list rises from the bottom as a sheet.
 *
 *   <binom-team-switcher team-id="t_1" account-url="https://account.binom.com"
 *     teams='[{"id":"t_1","name":"Team example","role":"Owner"},{"id":"t_2","name":"Beta","unread":3}]'>
 *   </binom-team-switcher>
 *
 * Choosing a team fires `binom-team-switcher-select` (bubbles, composed, cancelable; detail { item: 'team', teamId,
 * url: null }): the app opens it. **Manage team** fires it with { item: 'manage-team', teamId, url } and opens `url`
 * unless the app calls preventDefault(). The full contract: docs/INTEGRATION.md.
 */
import { PopupMenu, accountPage, countHtml, esc, hue, icon, initials } from './popup.js';

const LABELS = {
  menu: 'Teams',
  'manage-team': 'Manage team',
  unread: 'unread',
};

/** `teams`: a JSON array of { id, name, logoUrl?, role?, unread?, unreadMuted? }; anything else is no teams. */
function parseTeams(value) {
  try {
    const teams = JSON.parse(value || '[]');
    return Array.isArray(teams) ? teams.filter((team) => team && team.id != null && team.name) : [];
  } catch {
    return [];
  }
}

/** The other teams' unread total for the button: grey when every one of them is muted. */
function othersUnread(teams, openId) {
  const others = teams.filter((team) => String(team.id) !== openId && team.unread > 0);
  return {
    total: others.reduce((sum, team) => sum + team.unread, 0),
    muted: others.length > 0 && others.every((team) => team.unreadMuted),
  };
}

const CSS = [
  // The button: logo, name and ⇕, a quiet fill on hover; the name gives way first on a narrow header.
  '.trigger{gap:8px;max-width:100%;padding:0 8px 0 6px;border-radius:var(--radius);color:var(--color-text);font-weight:600;font-size:.9375rem;line-height:1.2;transition:background-color var(--motion-fast) var(--ease-standard)}',
  '@media (hover:hover){.trigger:hover{background:var(--color-surface)}}',
  '.trigger:focus-visible{box-shadow:0 0 0 3px var(--color-focus-ring)}',
  '.trigger[aria-expanded="true"]{background:var(--color-surface)}',
  '.trigger-name{min-width:0;max-width:var(--binom-team-name-max, 240px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  // `compact` (a phone's header): the mark and ⇕ only; the name is in the list and the button's name.
  ':host([compact]) .trigger{gap:4px;padding:0 4px}',
  ':host([compact]) .trigger-name{display:none}',
  '.trigger .icon{flex:none;color:var(--color-muted)}',
  '.mark{box-sizing:border-box;flex:none;display:inline-flex;align-items:center;justify-content:center;width:var(--bam-size);height:var(--bam-size);border-radius:50%;object-fit:cover;font-weight:600;font-size:calc(var(--bam-size) * .42);line-height:1;user-select:none}',
  '.mark--tinted{background:color-mix(in srgb,hsl(var(--bam-hue) 45% 62%) 32%,var(--color-bg));color:color-mix(in srgb,hsl(var(--bam-hue) 40% 45%) 40%,var(--color-text))}',
  '.heading{padding:8px 12px 4px;font-size:.75rem;font-weight:600;color:var(--color-muted)}',
  '.team-text{display:flex;flex-direction:column;flex:1;min-width:0;line-height:1.25}',
  '.team-text>*{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}',
  '.role{font-size:.8125rem;color:var(--color-muted)}',
  '.check{flex:none;color:var(--color-accent)}',
  '.item[aria-current="true"]{font-weight:600}',
  '.menu[data-sheet] .heading{padding-top:0}',
].join('');

class BinomTeamSwitcher extends PopupMenu {
  static tag = 'binom-team-switcher';
  static eventPrefix = 'binom-team-switcher';
  static align = 'start';
  static labels = LABELS;
  static observedAttributes = ['teams', 'team-id', 'account-url', 'hide', 'compact', ...Object.keys(LABELS).map((id) => `label-${id}`)];

  css() {
    return CSS;
  }

  menuLabel() {
    return this.label('menu');
  }

  teams() {
    return parseTeams(this.getAttribute('teams'));
  }

  openTeam() {
    const id = this.getAttribute('team-id');
    return this.teams().find((team) => String(team.id) === id) ?? null;
  }

  mark(team, size) {
    const style = `--bam-size:${size}px`;
    if (team.logoUrl) return `<img class="mark" style="${style}" src="${esc(team.logoUrl)}" alt="" data-drop-on-error>`;
    return `<span class="mark mark--tinted" style="${style};--bam-hue:${hue(team.id)}" aria-hidden="true">${esc(initials(team.name))}</span>`;
  }

  triggerHtml() {
    const team = this.openTeam();
    const unread = othersUnread(this.teams(), this.getAttribute('team-id'));
    const spoken = `${unread.total} ${this.label('unread')}`;
    const name = team ? team.name : '';
    return `<button type="button" class="trigger" part="trigger" aria-haspopup="menu" aria-expanded="false" aria-label="${esc(`${this.label('menu')}: ${name}`)}">` +
      (team ? this.mark(team, 22) : '') +
      `<span class="trigger-name">${esc(name)}</span>` +
      countHtml(unread.total, { muted: unread.muted, spoken }) +
      `${icon('chevrons', 16)}</button>`;
  }

  menuHtml() {
    const openId = this.getAttribute('team-id');
    const rows = this.teams().map((team) => {
      const isOpen = String(team.id) === openId;
      const role = team.role ? `<span class="role">${esc(team.role)}</span>` : '';
      const unread = isOpen ? '' : countHtml(team.unread, { muted: team.unreadMuted, spoken: `${team.unread} ${this.label('unread')}` });
      return `<button type="button" class="item" role="menuitem" data-item="team" data-team-id="${esc(team.id)}"${isOpen ? ' aria-current="true"' : ''}>` +
        `${this.mark(team, 28)}<span class="team-text"><span>${esc(team.name)}</span>${role}</span>${unread}` +
        `${isOpen ? `<span class="check">${icon('check', 18)}</span>` : ''}</button>`;
    }).join('');
    const canManage = openId && !this.isHidden('manage-team');
    const manage = canManage
      ? `<div class="separator"></div><button type="button" class="item" role="menuitem" data-item="manage-team">${icon('users', 18)}<span class="label">${esc(this.label('manage-team'))}</span></button>`
      : '';
    return `<div class="heading">${esc(this.label('menu'))}</div>${rows}<slot></slot>${manage}`;
  }

  /** Manage team: the open team's members page in Binom Account (people, roles, invites, leaving the team). */
  urlOf(item) {
    const teamId = this.getAttribute('team-id');
    if (item !== 'manage-team' || !teamId) return null;
    return accountPage(this.getAttribute('account-url'), `/teams/${encodeURIComponent(teamId)}/members`);
  }

  detailOf(item, data) {
    if (item === 'team') return { teamId: data.teamId };
    return item === 'manage-team' ? { teamId: this.getAttribute('team-id') } : {};
  }
}

if (typeof window !== 'undefined' && window.customElements && !customElements.get(BinomTeamSwitcher.tag)) {
  customElements.define(BinomTeamSwitcher.tag, BinomTeamSwitcher);
}

export { BinomTeamSwitcher, LABELS as TEAM_SWITCHER_LABELS };
