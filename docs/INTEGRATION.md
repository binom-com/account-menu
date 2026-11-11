# Integrating the Binom header menus

This guide is for a person or an AI agent (Claude) adding the shared header menus to a Binom app: Meet, Ideas, Calendar, Synergy, or a new one. Read all of it before you start. Chat already uses both menus; section 9 shows how it wires them, as a worked example.

## 1. What you are adding

Every Binom app has the same header:

```
[b-icon] Chat / [TE] Team example.test ⇕          [app's own pills]  [DC]
 └ <binom-switcher>  └ <binom-team-switcher>                          └ <binom-account-menu>
```

| Piece | Where it comes from | What it does |
| --- | --- | --- |
| `<binom-switcher>` | `https://binom.com/switcher/v1.js`, a script tag | Lists the Binom apps and Help & support. Not part of this package. |
| `<binom-team-switcher>` | this package | Shows the open team. Its list holds every team of the user and **Create team**. |
| `<binom-account-menu>` | this package | Opens from the user's photo: profile, credits, Manage team, Settings, your own rows, Sign out, version. |

Teams are switched only in the team switcher, never in the account menu. Like a project in Google Cloud's header or a workspace in Railway's, the open team stands after the app's name.

Both elements:

- are custom elements with a Shadow DOM and no dependencies;
- work in any stack: React + MUI, Tailwind, Next.js, plain HTML;
- take their look from the `@binom/ui` tokens on the page, so they follow the app's light or dark theme (`data-theme` on `<html>`, else the system);
- open as a popover on a wide window and as a bottom sheet below 800px;
- close on Escape, on a press outside, or when a row is chosen, with focus returning to the trigger;
- move between rows, your own rows included, with the arrow keys, Home and End;
- fire `<tag>-select`, `<tag>-open` and `<tag>-close` events.

Rows are built in. You decide what each row does through the select event. Do not restyle the elements, and do not copy their markup into your app.

## 2. Install

```json
"@binom/account-menu": "https://github.com/binom-com/account-menu/archive/refs/tags/v0.1.0.tar.gz",
"@binom/ui": "https://github.com/binom-com/ui/archive/refs/tags/v0.1.1.tar.gz"
```

Install from the tag's HTTPS archive, not from `github:…`, because a `git+ssh` URL fails in slim build images. The page must load the `@binom/ui` tokens: `theme.css` for plain CSS, `tailwind.css` for Tailwind 4, `tokens.css` + `fonts.css` with MUI (see the `@binom/ui` README). Without the tokens the menus have no colours.

Load the elements once:

```js
import '@binom/account-menu';            // both elements
// or only one: import '@binom/account-menu/account-menu.js' / '/team-switcher.js'
```

React apps import the wrappers instead (`@binom/account-menu/react`), which load the elements themselves. In Next.js, use the wrappers in a client component (`'use client'`). The module can be imported on the server, where it defines nothing.

## 3. The account menu (`<binom-account-menu>`)

### Rows, top to bottom

| # | Row | `item` id | Default action (when you do not call `preventDefault()`) |
| --- | --- | --- | --- |
| 1 | Profile card: photo with a camera badge, name, email, team (logo + name) | `photo` (the photo) | Opens Profile in Binom Account. The menu stays open. |
| 2 | **Credits**: the balance, `Unlimited` or a spinner | `credits` | When `can-top-up` is set, the whole row is a button with a **+** that opens the team's Billing page. Without it the row is read-only. |
| — | Your rows with `slot="start"` | — | Your own `onClick`. |
| 3 | **Manage team** (shown only when there is a team) | `manage-team` | The team's members page in Binom Account. |
| 4 | **Settings** | `settings` | None: open your settings. |
| — | Your rows (no slot) | — | Your own `onClick`. |
| 5 | **Sign out** | `sign-out` | None: sign the user out. |
| 6 | `Version X` | — | Shown only when `version` is set. |

### Attributes and React props

| Attribute | React prop | Meaning |
| --- | --- | --- |
| `user-name`, `user-email`, `user-photo`, `user-id` | `user={{ name, email, photoUrl, id }}` | Without a photo the avatar shows initials on a pastel; `user-id` (else the name) picks the hue, so a person has the same colour in every app. |
| `team-name`, `team-logo`, `team-id` | `team={{ name, logoUrl, id }}` | The profile card's team. `team-id` builds the Billing and Manage team links. A logo that fails to load is dropped. |
| `credits` | `credits` | A number, `unlimited` or `loading`. With no value the row is hidden (use that when the balance could not be read). |
| `can-top-up` | `canTopUp` | The owner, admins and billing members, and only on a team that is not unlimited. Leave it out in an Android app, where Google Play allows no payments elsewhere. |
| `account-url` | `accountUrl` | Binom Account's address (`https://account.binom.com`). Without it, the photo, credits and Manage team rows only fire the event. |
| `version` | `version` | The app's version. |
| `hide` | `hide={['manage-team']}` | Built-in rows to drop, by id: `photo`, `credits`, `manage-team`, `settings`, `sign-out`. |
| `label-<id>` | `labels={{ settings: 'Настройки' }}` | Your text for `photo`, `credits`, `unlimited`, `top-up`, `manage-team`, `settings`, `sign-out`, `version`, `menu` (the trigger is named `<menu> — <name>`) or `loading`. |
| `badge-<id>`, `-muted`, `-label` | `badges={{ settings: { count, isMuted, label } }}` | A count on `manage-team` or `settings` (99+ above 99). |
| `size` | `size` | The header avatar in px (default 32; Chat uses 40 on a phone). The tap target stays at least `--tap-size`. |
| `photo-busy` | `isPhotoBusy` | A new photo is uploading; the photo is disabled. |
| — | `onSelect(item, event)` | The select event. |
| — | `onOpenChange(isOpen)` | The open and close events. |
| — | `ref` | The element: `open()`, `close(toButton?)`, `toggle()`, `isOpen`. |

### Events

`binom-account-menu-select` bubbles, is composed and is cancelable. Its `detail` is `{ item, url }`, where `url` is the Binom Account page with `?return=<this page>`, or `null`. After the event, the element opens `url` in the same tab, unless you called `preventDefault()`. Call `preventDefault()` whenever you open the page your own way, for example in a new tab or, in an Electron app, in the system browser.

## 4. The team switcher (`<binom-team-switcher>`)

The button shows the open team's logo (else initials on its own hue), its name, the other teams' unread total and ⇕. The list, **Teams**, shows every team with its logo, name and the user's role, an unread count on each other team, and a ✓ on the open team. Below the teams come your own rows, then **Create team**.

| Attribute | React prop | Meaning |
| --- | --- | --- |
| `teams` | `teams` | A JSON array of `{ id, name, logoUrl?, role?, unread?, unreadMuted? }`, in the order to list them. The React prop is the array itself. |
| `team-id` | `teamId` | The open team. |
| `account-url` | `accountUrl` | **Create team** opens `<account-url>/account?return=<this page>`. |
| `hide="create"` | `hide={['create']}` | No **Create team**, for example without Binom Account. |
| `compact` | `isCompact` | A phone's header: only the team's mark and ⇕ on the button. |
| `label-menu`, `label-create`, `label-unread` | `labels` | Your texts: the list's heading and button name (`<menu>: <team>`), **Create team**, and the word spoken after a count. |
| — | `onSelect(teamId, event)` | `teamId` is the chosen team; `null` with `event.detail.item === 'create'` means **Create team**. |
| — | `onOpenChange`, `ref` | As for the account menu. |

`binom-team-switcher-select` has the `detail` `{ item: 'team', teamId, url: null }` or `{ item: 'create', url }`. The element never switches the team itself: open the chosen team in your app, and do nothing when the open team is chosen again. **Create team** opens `url` unless you call `preventDefault()`.

`unreadMuted: true` means every unread message of that team is in a muted chat; its count is then grey. The button's total is grey only when every other team with unread messages is muted. Omit `unread` if your app has no unread counts.

## 5. Your own rows

Add them as children, as plain `<button>` or `<a href>` elements, with an 18px icon (`<svg>`, e.g. Lucide `size={18}`) before the text:

```tsx
<AccountMenu …>
  <button type="button" slot="start" onClick={openVault}><KeyRound size={18} aria-hidden /> Vault</button>
  <button type="button" onClick={openImport}><Download size={18} aria-hidden /> Import chats</button>
</AccountMenu>
```

- They get the same row look as the built-in rows (a page stylesheet, `#binom-account-menu-styles` / `#binom-team-switcher-styles`), including the taller rows of the phone sheet.
- They close the menu when clicked.
- Only direct children are rows. Wrapping them in a `<div>` or a fragment that renders one breaks the slot. A React component that returns a `<button>` is fine.
- Add a separator by leaving it out: the menus have their own.
- A row that opens a dialog: when the dialog closes, focus returns to the avatar, because the menu has already handed it there.

## 6. Binom Account pages

Every app uses the same pages:

| Page | URL |
| --- | --- |
| Profile | `{account-url}/account/profile` |
| Home (create a team) | `{account-url}/account` |
| Billing | `{account-url}/account/teams/{team-id}/credits` |
| Members | `{account-url}/account/teams/{team-id}/members` |

Each one takes `?return=<current page>`. The elements build these URLs for you. If your app opens them some other way, cancel the event and use `event.detail.url`.

Where the data comes from (your server asks Binom Account with the app's key, `Authorization: Bearer <app key>`):

- **Credits:** `GET {BINOM_ACCOUNT_URL}/api/v1/teams/{teamId}/balance` returns `{ balance, unlimited, canUse }`. Cache it for about 60s and read it again after the user comes back from Billing.
- **Teams and roles:** `GET {BINOM_ACCOUNT_URL}/api/v1/users/{publicId}/teams`, or your own `/me` that already has them.
- **Who may top up:** the roles `owner`, `admin` and `billing`, and never on an unlimited team.

## 7. The phone

- Below 800px both menus are bottom sheets over a dimmed page.
- In the account menu, pass a larger `size` (40) on a phone.
- In the team switcher, set `compact`/`isCompact` and hide the app's name and the slash in your header CSS. Otherwise a 400px header overflows.
- If your app maps the system Back button to closing layers (Android, PWA), listen to `onOpenChange` and add a history entry while the menu is open, calling `ref.current.close()` on Back. If a dialog is opened from the sheet, open it after that entry is gone (Chat: `useBackCloses`, `afterLayersClose`).

## 8. Checklist for a new app

1. Add both packages (section 2) and load the `@binom/ui` tokens.
2. In the header: `<binom-switcher app="<app>">`, the app's name, a slash, then `<TeamSwitcher>` on the left; `<AccountMenu>` at the right end.
3. Remove the app's old avatar menu, its team picker or `<select>`, and any separate credits pill (Meet's `UsageBadge`). They live in these menus now.
4. Account menu:
   - Pass the user, team, `credits` (`'loading'` until the first answer, no value on an error) and `canTopUp`.
   - Pass `accountUrl`, `version`, and labels if the app is not in English.
   - In `onSelect`, handle `settings` and `sign-out`. For `photo`, `credits` and `manage-team`, keep the default or call `preventDefault()` and open the page yourself.
5. Team switcher: pass `teams` with roles (and unread counts if you have them) and `teamId`; open the chosen team in `onSelect`.
6. Add the app's own rows as children.
7. Hide what the app cannot do: `hide={['manage-team']}` and `hide={['create']}` without Binom Account, and no `canTopUp` in a store app.
8. In tests: the built-in rows are in the shadow root. With Testing Library use `within(element.shadowRoot)`; built-in rows have the role `menuitem`, while the photo and the triggers are `button`. Your own rows are in the light DOM, so `screen` finds them.
9. Update your app's user help and README in the same change.

## 9. Worked example: Chat

Chat (`binom-com/chat`) wires the elements in these files:

- `apps/ui/src/layout/AppHeader.tsx`: the switcher, **Chat**, `/`, `<HeaderTeamSwitcher>`, and on the right the pills and `<UserMenu>`.
- `apps/ui/src/features/orgs/HeaderTeamSwitcher.tsx`:
  - `teams` are built from the session's orgs, with `strings.members.role[role]` and the unread counts per team from `GET /api/me/unread`.
  - `onSelect`: `selectOrg(teamId)`. **Create team** calls `preventDefault()` and opens Binom Account in a new tab, or in the system browser in the desktop app.
  - `isCompact` on a phone.
  - The system Back closes the sheet.
- `apps/ui/src/features/account/UserMenu.tsx`:
  - `onSelect` always calls `preventDefault()`.
  - `photo` opens Chat's picker and crop dialog (`isPhotoBusy` while uploading).
  - `credits` and `manage-team` open Billing and Members through Chat's `useAccountPages`.
  - `settings` opens the Settings dialog, and `sign-out` calls `signOut()`.
  - The children are Vault (owners and admins), Import chats, Watch demo and Download app.
  - All labels come from Chat's `strings`.
- Tests:
  - `UserMenu.test.tsx` and `HeaderTeamSwitcher.test.tsx` query the shadow roots.
  - `features/account/test-helpers.ts` has `accountMenu()`, `openAccountMenu()`, `teamSwitcher()` and `openTeamSwitcher()`.

## 10. Changing the package

- **Source:**
  - `src/popup.js`: what both elements share (trigger, popover or sheet, keyboard, events, own-row styles).
  - `src/account-menu.js` and `src/team-switcher.js`: the two elements.
  - `src/react.js`: the wrappers.
  - The `.d.ts` files: the types.
- **Look:** take every colour, radius, shadow and duration from `@binom/ui` tokens (`var(--color-…)`), never a literal. Buttons have no borders. The design owner of `@binom/ui` approves any change to the look.
- **Testing:** `npm test` runs node's test runner with happy-dom. `npm run demo` serves the demo; then open http://localhost:5190/demo/.
- **Releasing:**
  1. Add a `CHANGELOG.md` entry and bump `package.json`'s version.
  2. Tag `vX.Y.Z` and push the tag.
  3. In each app, bump the tarball URL.
- A breaking change (a row removed or renamed, an attribute changed) is a minor version while the package is 0.x. List it in the changelog under **Breaking**.
