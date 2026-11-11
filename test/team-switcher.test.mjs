import { test } from 'node:test';
import assert from 'node:assert/strict';
import { $, $$, mount } from './setup.mjs';

const TEAMS = [
  { id: 't1', name: 'Team example.test', role: 'Owner', logoUrl: 'https://img.test/t1.png' },
  { id: 't2', name: 'Beta', role: 'Member', unread: 3 },
  { id: 't3', name: 'Gamma corp', unread: 120, unreadMuted: true },
];
const switcher = (attributes = {}, inner = '') =>
  mount({ teams: JSON.stringify(TEAMS), 'team-id': 't1', ...attributes }, inner, 'binom-team-switcher');
const teamRows = (el) => $$(el, '[data-item="team"]');

test('the button shows the open team: its logo, name and the other teams’ unread total', () => {
  const el = switcher();
  assert.equal($(el, '.trigger img.mark').getAttribute('src'), 'https://img.test/t1.png');
  assert.equal($(el, '.trigger-name').textContent, 'Team example.test');
  assert.equal($(el, '.trigger .count [aria-hidden]').textContent, '99+');
  assert.equal($(el, '.trigger .count--muted'), null, 'not grey while one team has unmuted messages');
  assert.equal($(el, '.trigger').getAttribute('aria-label'), 'Teams: Team example.test');
});

test('a team logo that does not load is dropped, the name stays', () => {
  const el = switcher();
  $(el, '.trigger img.mark').dispatchEvent(new Event('error'));
  assert.equal($(el, '.trigger img.mark'), null);
  assert.equal($(el, '.trigger-name').textContent, 'Team example.test');
});

test('a team without a logo gets its initials on its own hue', () => {
  const el = switcher({ 'team-id': 't3' });
  assert.equal($(el, '.trigger .mark--tinted').textContent, 'GC');
});

test('the list has every team with its role, the open one checked and without a count, then Manage team', () => {
  const el = switcher();
  const rows = teamRows(el);
  assert.deepEqual(rows.map((row) => row.dataset.teamId), ['t1', 't2', 't3']);
  assert.equal(rows[0].getAttribute('aria-current'), 'true');
  assert.ok(rows[0].querySelector('.check'));
  assert.equal(rows[0].querySelector('.count'), null);
  assert.equal(rows[0].querySelector('.role').textContent, 'Owner');
  assert.equal(rows[1].querySelector('.count [aria-hidden]').textContent, '3');
  assert.ok(rows[2].querySelector('.count--muted'));
  assert.ok($(el, '[data-item="manage-team"]'));
});

test('choosing a team fires the select event with its id and closes the list', () => {
  const el = switcher();
  const seen = [];
  el.addEventListener('binom-team-switcher-select', (e) => seen.push(e.detail));
  el.open();
  teamRows(el)[1].click();
  assert.deepEqual(seen, [{ item: 'team', teamId: 't2', url: null }]);
  assert.equal(el.isOpen, false);
});

test('Manage team opens the open team’s members page in Binom Account unless the app prevents it', () => {
  const el = switcher({ 'account-url': 'https://account.binom.test' });
  const assigned = [];
  const seen = [];
  window.location.assign = (url) => assigned.push(url);
  el.addEventListener('binom-team-switcher-select', (e) => seen.push(e.detail));
  $(el, '[data-item="manage-team"]').click();
  const url = `https://account.binom.test/account/teams/t1/members?return=${encodeURIComponent('https://chat.binom.com/c/42')}`;
  assert.deepEqual(assigned, [url]);
  assert.deepEqual(seen, [{ item: 'manage-team', teamId: 't1', url }]);

  el.addEventListener('binom-team-switcher-select', (e) => e.preventDefault());
  $(el, '[data-item="manage-team"]').click();
  assert.equal(assigned.length, 1);
});

test('the team marks are round', () => {
  const el = switcher();
  assert.match(el.shadowRoot.querySelector('style').textContent, /\.mark\{[^}]*border-radius:50%/);
});

test('hide="manage-team" drops Manage team, and so does no open team; label-* renames the texts', () => {
  const el = switcher({ hide: 'manage-team', 'label-menu': 'Команды' });
  assert.equal($(el, '[data-item="manage-team"]'), null);
  assert.equal($(switcher({ 'team-id': '' }), '[data-item="manage-team"]'), null);
  assert.equal($(el, '.heading').textContent, 'Команды');
});

test('the other teams’ total is grey when every one of them is muted, and gone at 0', () => {
  const muted = [TEAMS[0], { ...TEAMS[1], unreadMuted: true }];
  const el = mount({ teams: JSON.stringify(muted), 'team-id': 't1' }, '', 'binom-team-switcher');
  assert.ok($(el, '.trigger .count--muted'));
  el.setAttribute('teams', JSON.stringify([TEAMS[0], { ...TEAMS[1], unread: 0 }]));
  assert.equal($(el, '.trigger .count'), null);
});

test('broken teams JSON means no teams, not a crash', () => {
  const el = mount({ teams: '{oops', 'team-id': 't1' }, '', 'binom-team-switcher');
  assert.deepEqual(teamRows(el), []);
  assert.equal($(el, '.trigger-name').textContent, '');
});

test('the app’s own rows go after the teams and arrows move through all of them', () => {
  const el = switcher({}, '<button id="manage">All teams</button>');
  el.open();
  assert.deepEqual(el.items().map((row) => row.dataset?.teamId ?? row.dataset?.item ?? row.id), ['t1', 't2', 't3', 'manage', 'manage-team']);
});
