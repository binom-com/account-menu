# @binom/account-menu

The shared header menus of every Binom app: `<binom-account-menu>` at the right (the user's photo) and `<binom-team-switcher>` beside the app's name. React wrappers are in `@binom/account-menu/react`.

- **Adding the menus to an app, or changing how an app uses them:** read `docs/INTEGRATION.md` first and follow its checklist (section 8).
- **Changing this package:** read `docs/INTEGRATION.md` section 10. Take every visual value from the `@binom/ui` tokens, and give buttons no borders. Keep the rows built in: apps change behaviour through the select events, labels and their own child rows, not by restyling.
- **Tests:** `npm test` must pass. Add a test for every new attribute, row or event.
- **Releasing:** bump `package.json`, add a `CHANGELOG.md` entry and tag `vX.Y.Z`. Apps install the tag's tarball URL.
- **Docs:** keep `README.md` (overview) and `docs/INTEGRATION.md` (the full contract) in step with the code in the same commit.
