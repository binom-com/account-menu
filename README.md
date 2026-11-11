# @binom/account-menu

This package holds the header menus that every Binom app (Chat, Meet, Ideas, Calendar, Synergy) shares, so the header looks and works the same in each of them:

```
[b-icon] Chat / [TE] Team example.test ⇕                    [DC]
 └ <binom-switcher>  └ <binom-team-switcher>                 └ <binom-account-menu>
```

**Team switcher** (`<binom-team-switcher>`) sits beside the app's name, the way a project does in Google Cloud's header or a workspace in Railway's. Its button shows the open team. The list it opens has:
- every team, with the user's role and unread count;
- a ✓ on the open team;
- **Create team**, which opens Binom Account.

**Account menu** (`<binom-account-menu>`) opens from the user's photo at the right. It contains:
- a profile card: photo with a camera badge, name and email (the team is in the team switcher);
- **Credits**: a click opens the team's Billing page in Binom Account, as in Meet; payers also get a **+**;
- **Manage team**, the app's own rows, **Settings**, **Switch account** (sign in as another Binom account) and **Sign out**;
- the app's version.

Both are custom elements with a Shadow DOM and no dependencies, built the same way as the app switcher `<binom-switcher>` (`https://binom.com/switcher/v1.js`). Both have React wrappers, `AccountMenu` and `TeamSwitcher`.

- **Look:** the colours, corners, shadows and motion come from the [`@binom/ui`](https://github.com/binom-com/ui) tokens on the page, so the menus follow the app's light or dark theme.
- **Phone:** both menus rise from the bottom as a sheet.
- **Behaviour:** the app decides what each row does through the menus' select events.

**→ The full contract and a step-by-step checklist for adding the menus to an app: [docs/INTEGRATION.md](docs/INTEGRATION.md).**

## Install

```json
"@binom/account-menu": "https://github.com/binom-com/account-menu/archive/refs/tags/v0.1.0.tar.gz",
"@binom/ui": "https://github.com/binom-com/ui/archive/refs/tags/v0.1.1.tar.gz"
```

## React in one glance

```tsx
import { AccountMenu, TeamSwitcher } from '@binom/account-menu/react';

<header>
  <binom-switcher app="meet" size="36" /> Meet <span>/</span>
  <TeamSwitcher
    teams={teams.map((t) => ({ id: t.id, name: t.name, logoUrl: t.logoUrl, role: t.roleLabel, unread: t.unread }))}
    teamId={team.id}
    accountUrl={ACCOUNT_URL}
    isCompact={isPhone}
    onSelect={(teamId) => teamId && openTeam(teamId)}
  />
  …
  <AccountMenu
    user={{ id: user.id, name: user.name, email: user.email, photoUrl: user.photo }}
    teamId={team.id}
    credits={balance.isLoading ? 'loading' : balance.data?.unlimited ? 'unlimited' : balance.data?.credits}
    canTopUp={['owner', 'admin', 'billing'].includes(role)}
    accountUrl={ACCOUNT_URL}
    version={APP_VERSION}
    onSelect={(item) => {
      if (item === 'settings') openSettings();
      if (item === 'switch-account') switchAccount();
      if (item === 'sign-out') signOut();
    }}
  >
    <button type="button" onClick={openAdmin}><Shield size={18} /> Admin console</button>
  </AccountMenu>
</header>
```

Without React, set the attributes (`user-name`, `credits`, `teams`, `team-id`, …) and listen to `binom-account-menu-select` and `binom-team-switcher-select`. See [docs/INTEGRATION.md](docs/INTEGRATION.md).

## Develop

```bash
npm install
npm test        # node --test with happy-dom
npm run demo    # then open http://localhost:5190/demo/
```

Source:
- `src/popup.js`: what both elements share.
- `src/account-menu.js` and `src/team-switcher.js`: the two elements.
- `src/react.js`: the React wrappers.
- `src/*.d.ts`: the types.

Changes to the look are approved by the design owner of `@binom/ui`. Versions are tags `vX.Y.Z`, each with a `CHANGELOG.md` entry.

## Licence

MIT. Icons: [Lucide](https://lucide.dev) (ISC).
