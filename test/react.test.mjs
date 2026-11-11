import { test } from 'node:test';
import assert from 'node:assert/strict';
import './setup.mjs';
import { createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { act } from 'react';
import { AccountMenu, TeamSwitcher } from '../src/react.js';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;

test('AccountMenu sets the attributes and calls onSelect', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  const chosen = [];
  const openings = [];
  const ref = { current: null };
  const root = createRoot(document.getElementById('root'));
  await act(async () => {
    root.render(
      createElement(
        AccountMenu,
        {
          ref,
          onOpenChange: (isOpen) => openings.push(isOpen),
          user: { name: 'Design Check', email: 'dc@example.test' },
          team: { name: 'Team', id: 't1' },
          credits: 0,
          canTopUp: true,
          version: '1.0.0',
          hide: ['photo'],
          labels: { settings: 'Настройки' },
          onSelect: (item, event) => {
            chosen.push(item);
            event.preventDefault();
          },
        },
        createElement('button', { slot: 'start' }, 'Vault'),
      ),
    );
  });
  const menu = document.querySelector('binom-account-menu');
  assert.equal(menu.getAttribute('credits'), '0');
  assert.equal(menu.getAttribute('can-top-up'), '');
  assert.equal(menu.getAttribute('hide'), 'photo');
  assert.equal(menu.getAttribute('label-settings'), 'Настройки');
  assert.equal(menu.querySelector('button[slot="start"]').textContent, 'Vault');
  assert.equal(ref.current, menu);
  menu.open();
  menu.shadowRoot.querySelector('[data-item="settings"]').click();
  assert.deepEqual(chosen, ['settings']);
  assert.deepEqual(openings, [true, false]);
  await act(async () => root.unmount());
});

test('TeamSwitcher passes the teams as JSON and calls onSelect with the chosen team', async () => {
  document.body.innerHTML = '<div id="root"></div>';
  const chosen = [];
  const root = createRoot(document.getElementById('root'));
  const teams = [{ id: 't1', name: 'Team' }, { id: 't2', name: 'Beta', unread: 2 }];
  await act(async () => {
    root.render(createElement(TeamSwitcher, { teams, teamId: 't1', onSelect: (teamId) => chosen.push(teamId) }));
  });
  const el = document.querySelector('binom-team-switcher');
  assert.deepEqual(JSON.parse(el.getAttribute('teams')), teams);
  el.shadowRoot.querySelector('[data-team-id="t2"]').click();
  el.shadowRoot.querySelector('[data-item="create"]').click();
  assert.deepEqual(chosen, ['t2', null]);
  await act(async () => root.unmount());
});
