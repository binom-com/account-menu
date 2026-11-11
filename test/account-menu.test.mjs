import { test } from 'node:test';
import assert from 'node:assert/strict';
import { $, $$, mount, rows } from './setup.mjs';

const USER = { 'user-name': 'Design Check', 'user-email': 'design-check@example.test', 'user-id': 'u1' };
const TEAM = { 'team-name': 'Team example.test', 'team-id': 't 1' };

test('the avatar shows initials without a photo, the photo with one', () => {
  const menu = mount(USER);
  assert.equal($(menu, '.trigger .avatar').textContent, 'DC');
  menu.setAttribute('user-photo', 'https://img.test/me.png');
  assert.equal($(menu, '.trigger img.avatar').getAttribute('src'), 'https://img.test/me.png');
});

test('the menu lists the profile card and every built-in item in order, with the version last', () => {
  const menu = mount({ ...USER, ...TEAM, credits: '1250', 'can-top-up': '', version: '2.3.0' });
  assert.equal($(menu, '.name').textContent, 'Design Check');
  assert.equal($(menu, '.email').textContent, 'design-check@example.test');
  assert.equal($(menu, '.team-name').textContent, 'Team example.test');
  assert.deepEqual(rows(menu), ['photo', 'credits', 'manage-team', 'settings', 'switch-account', 'sign-out']);
  assert.equal($(menu, '.version').textContent, 'Version 2.3.0');
});

test('credits: a balance, Unlimited, a spinner, or no row', () => {
  const menu = mount({ ...USER, credits: '12345' });
  assert.equal($(menu, '.credits .value').textContent, '12,345');
  menu.setAttribute('credits', 'unlimited');
  assert.equal($(menu, '.credits .value').textContent, 'Unlimited');
  menu.setAttribute('credits', 'loading');
  assert.ok($(menu, '.credits .spinner'));
  menu.removeAttribute('credits');
  assert.equal($(menu, '.credits'), null);
});

test('credits are a button to Billing only for those who may pay', () => {
  const menu = mount({ ...USER, ...TEAM, credits: '10' });
  assert.equal($(menu, '.credits').tagName, 'DIV');
  menu.setAttribute('can-top-up', '');
  assert.equal($(menu, '.credits').tagName, 'BUTTON');
  menu.setAttribute('credits', 'unlimited');
  assert.equal($(menu, '.credits').tagName, 'DIV');
});

test('a built-in item fires the select event with its Binom Account page and opens it', () => {
  const menu = mount({ ...USER, ...TEAM, credits: '10', 'can-top-up': '', 'account-url': 'https://account.binom.test/' });
  const seen = [];
  menu.addEventListener('binom-account-menu-select', (e) => seen.push(e.detail));
  const assigned = [];
  window.location.assign = (url) => assigned.push(url);
  menu.open();
  $(menu, '[data-item="credits"]').click();
  const back = encodeURIComponent('https://chat.binom.com/c/42');
  const url = `https://account.binom.test/account/teams/t%201/credits?return=${back}`;
  assert.deepEqual(seen, [{ item: 'credits', url }]);
  assert.deepEqual(assigned, [url]);
  assert.equal(menu.isOpen, false);
});

test('preventDefault keeps the page from opening: the app opens it its own way', () => {
  const menu = mount({ ...USER, ...TEAM, 'account-url': 'https://account.binom.test' });
  const assigned = [];
  window.location.assign = (url) => assigned.push(url);
  menu.addEventListener('binom-account-menu-select', (e) => e.preventDefault());
  $(menu, '[data-item="manage-team"]').click();
  assert.deepEqual(assigned, []);
});

test('items without a page (Settings, Switch account, Sign out) only fire the event', () => {
  const menu = mount({ ...USER, 'account-url': 'https://account.binom.test' });
  const seen = [];
  menu.addEventListener('binom-account-menu-select', (e) => seen.push(e.detail));
  for (const item of ['settings', 'switch-account', 'sign-out']) $(menu, `[data-item="${item}"]`).click();
  assert.deepEqual(seen.map((d) => d.url), [null, null, null]);
  assert.deepEqual(seen.map((d) => d.item), ['settings', 'switch-account', 'sign-out']);
});

test('the photo keeps the menu open and is disabled while it uploads', () => {
  const menu = mount(USER);
  menu.open();
  $(menu, '[data-item="photo"]').click();
  assert.equal(menu.isOpen, true);
  menu.setAttribute('photo-busy', '');
  assert.equal($(menu, '[data-item="photo"]').disabled, true);
  assert.equal(menu.isOpen, true);
});

test('hide drops built-in items, label-* renames them', () => {
  const menu = mount({ ...USER, ...TEAM, hide: 'switch-account photo', 'label-sign-out': 'Выйти' });
  assert.deepEqual(rows(menu), ['manage-team', 'settings', 'sign-out']);
  assert.equal($(menu, '[data-item="sign-out"] .label').textContent, 'Выйти');
});

test("the app's own items take their slots and close the menu when chosen", () => {
  const menu = mount(USER, '<button slot="start" id="vault">Vault</button><button id="import">Import</button>');
  const [start, rest] = $$(menu, 'slot');
  assert.equal(start.assignedElements()[0].id, 'vault');
  assert.equal(rest.assignedElements()[0].id, 'import');
  menu.open();
  document.getElementById('import').click();
  assert.equal(menu.isOpen, false);
});

test('Escape closes the menu, arrows move through every row including the app items', () => {
  const menu = mount({ ...USER, ...TEAM }, '<button id="own">Own</button>');
  menu.open();
  assert.deepEqual(menu.items().map((el) => el.dataset?.item ?? el.id), [
    'photo', 'manage-team', 'settings', 'own', 'switch-account', 'sign-out',
  ]);
  document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
  assert.equal(menu.isOpen, false);
});

test('a press outside closes the menu', () => {
  const menu = mount(USER);
  menu.open();
  document.body.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, composed: true }));
  assert.equal(menu.isOpen, false);
});
