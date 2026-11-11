/** A built-in row of the menu: the `item` of the select event, a word of `hide`. */
export type AccountMenuItem = 'photo' | 'credits' | 'manage-team' | 'settings' | 'switch-account' | 'sign-out';

/** Texts that can be replaced, one `label-<id>` attribute each (for another language). */
export type AccountMenuLabel = AccountMenuItem | 'unlimited' | 'top-up' | 'version' | 'menu';

export interface AccountMenuSelectDetail {
  item: AccountMenuItem;
  /** The Binom Account page the item opens unless the event is cancelled; null when it has none. */
  url: string | null;
}

export type AccountMenuSelectEvent = CustomEvent<AccountMenuSelectDetail>;

export interface BinomAccountMenuElement extends HTMLElement {
  readonly isOpen: boolean;
  open(): void;
  /** `toButton`: focus goes back to the avatar. */
  close(toButton?: boolean): void;
  toggle(): void;
}

declare global {
  interface HTMLElementTagNameMap {
    'binom-account-menu': BinomAccountMenuElement;
  }
  interface HTMLElementEventMap {
    'binom-account-menu-select': AccountMenuSelectEvent;
    'binom-account-menu-open': CustomEvent<void>;
    'binom-account-menu-close': CustomEvent<void>;
  }
  interface Window {
    BinomAccountMenu?: { labels: Record<AccountMenuLabel, string>; selectEvent: 'binom-account-menu-select' };
  }
}
