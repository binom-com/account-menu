# @binom/account-menu

The user menu for the right corner of every Binom app (Chat, Meet, Ideas, Calendar, Synergy), so it is the same everywhere. It is the partner of the app switcher `<binom-switcher>` on the left (`https://binom.com/switcher/v1.js`) and is built the same way: one custom element, `<binom-account-menu>`, Shadow DOM, no dependencies. It works in any app: React + MUI, Tailwind, Next.js, plain HTML. React apps also get a typed wrapper, `AccountMenu`.

The look comes from the Binom design system [`@binom/ui`](https://github.com/binom-com/ui). The menu reads its tokens from the page (`--color-*`, `--radius*`, `--shadow-popover`, `--menu-item-size`, `--motion-*`, `--font`), so it follows the app's theme, `data-theme` included. It is based on Chat's user menu.

## What is in the menu

The user's photo in the header (or their initials on a pastel of their own hue) opens the menu. From top to bottom:

| Row | Id | What it does |
| --- | --- | --- |
| Profile card: photo with a camera badge, name, email, team (logo + name) | `photo` (the photo) | A click on the photo changes it. By default it opens Profile in Binom Account; an app with its own upload cancels the event and sets `photo-busy` while uploading. The menu stays open. |
| **Credits** with the team's balance, `Unlimited`, or a spinner | `credits` | For the owner, admins and billing members (`can-top-up`), the whole row is a button with **+**. It opens the team's Billing page in Binom Account, as the credits pill in Meet does. For everyone else the row is read-only. |
| The app's items, `slot="start"` | — | Optional, e.g. Chat's Vault. |
| **Manage team** | `manage-team` | The team's members page in Binom Account. Shown only when there is a team. |
| **Settings** | `settings` | The app's own settings; only an event. |
| The app's items, no slot | — | Optional, e.g. Import chats, Watch demo, Download app. |
| **Switch account** | `switch-account` | Choose another account or team; only an event. |
| **Sign out** | `sign-out` | Only an event. |
| `Version X` | — | Small print at the bottom, when `version` is set. |

On a window narrower than 800px (Chat's phone layout) the menu rises from the bottom as a sheet over the dimmed page, with taller rows. Escape, a press outside, or choosing an item closes it. Arrow keys, Home and End move through every row, the app's items included. When an item is chosen, focus returns to the avatar.

## Install

```json
"@binom/account-menu": "https://github.com/binom-com/account-menu/archive/refs/tags/v0.1.0.tar.gz",
"@binom/ui": "https://github.com/binom-com/ui/archive/refs/tags/v0.1.1.tar.gz"
```

It installs from a GitHub tag, like `@binom/ui`. The page must load the `@binom/ui` tokens (`theme.css`, `tokens.css` or `tailwind.css`; see its README), because without them the menu has no colours.

## Use

### React (Chat, Meet, Calendar, Synergy)

```tsx
import { AccountMenu } from '@binom/account-menu/react';

<AccountMenu
  user={{ id: user.id, name: user.name, email: user.email, photoUrl: user.avatarUrl }}
  team={{ id: team.id, name: team.name, logoUrl: team.logoUrl }}
  credits={balance.isPending ? 'loading' : balance.data?.unlimited ? 'unlimited' : balance.data?.credits}
  canTopUp={role !== 'member'}
  accountUrl={config.accountUrl}            // https://account.binom.com
  version={APP_VERSION}
  onSelect={(item, event) => {
    if (item === 'settings') openSettings();
    if (item === 'switch-account') switchAccount();
    if (item === 'sign-out') signOut();
  }}
>
  <button type="button" slot="start" onClick={openVault}><KeyRound size={18} /> Vault</button>
  <button type="button" onClick={startDemo}><CirclePlay size={18} /> Watch demo</button>
</AccountMenu>
```

### Any page

```html
<script type="module">import '@binom/account-menu';</script>

<binom-account-menu user-name="Design Check" user-email="design-check@example.test" user-id="u_1"
  team-name="Team example.test" team-id="t_1" credits="1250" can-top-up
  account-url="https://account.binom.com" version="1.4.0">
  <button type="button" slot="start">Vault</button>
</binom-account-menu>

<script>
  document.querySelector('binom-account-menu').addEventListener('binom-account-menu-select', (e) => {
    if (e.detail.item === 'sign-out') signOut();
  });
</script>
```

### Attributes

| Attribute | Meaning |
| --- | --- |
| `user-name`, `user-email` | The profile card; the name is also the avatar's tooltip. |
| `user-photo` | The photo URL. Without it the avatar shows initials. |
| `user-id` | The key the initials' colour comes from (the name when absent): the same person gets the same colour in every app. |
| `team-name`, `team-logo`, `team-id` | The open team. `team-id` builds the Billing and Manage team links. |
| `credits` | A number, `unlimited` or `loading`. With no attribute there is no credits row. |
| `can-top-up` | The user may pay (owner, admin, billing). The credits row then opens Billing. Leave it out in the Android app, where Google Play allows no payments. |
| `account-url` | Binom Account's address. Without it, the photo, credits and Manage team rows only fire the event. |
| `version` | `Version X` at the bottom. |
| `hide` | Built-in rows to drop, by id, separated by spaces: `hide="switch-account photo"`. |
| `label-<id>` | Your own text for a row: `label-sign-out="Выйти"`. Also `label-unlimited`, `label-top-up`, `label-version`, `label-menu`. |
| `badge-<id>` | A count after the label of `manage-team`, `settings` or `switch-account` (99+ above 99), e.g. unread messages of other teams. `badge-<id>-muted` greys it; `badge-<id>-label` is its text for screen readers. React: `badges={{ 'switch-account': { count, isMuted, label } }}`. |
| `size` | The header avatar in px (default 32; the tap target stays at least `--tap-size`). |
| `photo-busy` | A new photo is uploading: the photo is disabled. |

### Events

- `binom-account-menu-select` (bubbles, composed, cancelable) is fired by every built-in row. Its `detail` is `{ item, url }`. For `photo`, `credits` and `manage-team`, `url` is the Binom Account page, with `?return=` set to the current page, and the element opens it in the same tab, as Meet does. Call `event.preventDefault()` to open it your own way instead: a new tab, or the desktop app's system browser.
- `binom-account-menu-open` and `binom-account-menu-close` fire when the menu opens and closes.

Methods: `open()`, `close(toButton?)`, `toggle()`, and `isOpen`.

### Your own items

Add them as children: plain `<button>` or `<a href>`, with an 18px icon (`<svg>`) before the text. They get the same row look as the built-in items, through a small stylesheet the element adds to the page once (`#binom-account-menu-styles`). They close the menu when clicked. Use `slot="start"` to place an item after the credits; items without a slot go after Settings.

## Binom Account pages

Every app uses the same pages:

- `{account-url}/account/profile`
- `{account-url}/account/teams/{team-id}/credits` (Billing)
- `{account-url}/account/teams/{team-id}/members`

Each takes `?return=<current page>`.

## Develop

```bash
npm install
npm test        # node --test with happy-dom
npm run demo    # then open http://localhost:5190/demo/
```

The source is `src/account-menu.js` (the element, plain ES5-style JS with no build step) and `src/react.js` (the wrapper), with their `.d.ts` files. Any change to the look must be approved by the design owner of `@binom/ui`, and must use its tokens rather than literal colours. Versions are tags `vX.Y.Z`, each with a `CHANGELOG.md` entry.

## Licence

MIT. Icons: [Lucide](https://lucide.dev) (ISC).
