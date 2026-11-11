// A browser for the tests: happy-dom's window as the global one, then both elements are defined.
import { GlobalRegistrator } from '@happy-dom/global-registrator';

GlobalRegistrator.register({ url: 'https://chat.binom.com/c/42', width: 1280, height: 800 });
await import('../src/index.js');

/** A connected menu with these attributes and inner HTML (the app's own items). */
export function mount(attributes = {}, inner = '', tag = 'binom-account-menu') {
  document.body.innerHTML = '';
  const menu = document.createElement(tag);
  for (const [name, value] of Object.entries(attributes)) menu.setAttribute(name, value);
  menu.innerHTML = inner;
  document.body.append(menu);
  return menu;
}

export const $ = (menu, selector) => menu.shadowRoot.querySelector(selector);
export const $$ = (menu, selector) => [...menu.shadowRoot.querySelectorAll(selector)];
export const rows = (menu) => $$(menu, '[data-item]').map((el) => el.dataset.item);
