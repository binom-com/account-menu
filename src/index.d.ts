/** A built-in row of the account menu: the `item` of its select event, a word of `hide`. */
export type AccountMenuItem = 'photo' | 'credits' | 'manage-team' | 'settings' | 'switch-account' | 'sign-out';

/** Account menu texts that can be replaced, one `label-<id>` attribute each (for another language). */
export type AccountMenuLabel = AccountMenuItem | 'unlimited' | 'top-up' | 'version' | 'menu' | 'loading';

export interface AccountMenuSelectDetail {
  item: AccountMenuItem;
  /** The Binom Account page the row opens unless the event is cancelled; null when it has none. */
  url: string | null;
}

export type AccountMenuSelectEvent = CustomEvent<AccountMenuSelectDetail>;

/** What both elements can do from code. */
interface BinomPopupMenu extends HTMLElement {
  readonly isOpen: boolean;
  open(): void;
  /** `toButton`: focus goes back to the trigger. */
  close(toButton?: boolean): void;
  toggle(): void;
}

export type BinomAccountMenuElement = BinomPopupMenu;
export type BinomTeamSwitcherElement = BinomPopupMenu;

/** A team in the switcher's `teams`. */
export interface TeamSwitcherTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
  /** The user's role there, shown under the name (Owner, Admin, Billing, Member). */
  role?: string | null;
  /** Unread messages there (not shown for the open team); the others' total shows on the button. */
  unread?: number;
  /** Only muted chats' messages: a grey count. */
  unreadMuted?: boolean;
}

export type TeamSwitcherLabel = 'menu' | 'create' | 'unread';

export interface TeamSwitcherSelectDetail {
  item: 'team' | 'create';
  /** The chosen team (item `team`). */
  teamId?: string;
  /** Create team: Binom Account's home, opened unless the event is cancelled. */
  url: string | null;
}

export type TeamSwitcherSelectEvent = CustomEvent<TeamSwitcherSelectDetail>;

export declare const ACCOUNT_MENU_LABELS: Record<AccountMenuLabel, string>;
export declare const TEAM_SWITCHER_LABELS: Record<TeamSwitcherLabel, string>;
export declare class BinomAccountMenu extends HTMLElement {}
export declare class BinomTeamSwitcher extends HTMLElement {}

declare global {
  interface HTMLElementTagNameMap {
    'binom-account-menu': BinomAccountMenuElement;
    'binom-team-switcher': BinomTeamSwitcherElement;
  }
  interface HTMLElementEventMap {
    'binom-account-menu-select': AccountMenuSelectEvent;
    'binom-account-menu-open': CustomEvent<void>;
    'binom-account-menu-close': CustomEvent<void>;
    'binom-team-switcher-select': TeamSwitcherSelectEvent;
    'binom-team-switcher-open': CustomEvent<void>;
    'binom-team-switcher-close': CustomEvent<void>;
  }
}
