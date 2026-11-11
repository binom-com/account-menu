// React wrapper of <binom-account-menu>: typed props instead of attributes, and `onSelect` for the select event
// (React 18 passes no custom events to JSX). The element itself is in ./account-menu.js.
import { createElement, useEffect, useRef } from 'react';
import './account-menu.js';

const SELECT_EVENT = 'binom-account-menu-select';

/** `credits`: a number, `'unlimited'` or `'loading'`; null or undefined hides the row. */
function creditsAttribute(credits) {
  return credits === null || credits === undefined ? undefined : String(credits);
}

function labelAttributes(labels) {
  const attributes = {};
  for (const [id, text] of Object.entries(labels ?? {})) attributes[`label-${id}`] = text;
  return attributes;
}

/**
 * The Binom account menu for React apps. Extra items are its children: plain `<button>`s or `<a>`s,
 * `slot="start"` for those right after the credits, no slot for those after Settings.
 */
export function AccountMenu({
  user,
  team,
  credits,
  canTopUp,
  accountUrl,
  version,
  hide,
  labels,
  size,
  isPhotoBusy,
  onSelect,
  className,
  children,
}) {
  const ref = useRef(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const element = ref.current;
    const listener = (event) => onSelectRef.current?.(event.detail.item, event);
    element.addEventListener(SELECT_EVENT, listener);
    return () => element.removeEventListener(SELECT_EVENT, listener);
  }, []);

  return createElement(
    'binom-account-menu',
    {
      ref,
      class: className,
      'user-name': user.name,
      'user-email': user.email ?? undefined,
      'user-photo': user.photoUrl ?? undefined,
      'user-id': user.id ?? undefined,
      'team-name': team?.name ?? undefined,
      'team-logo': team?.logoUrl ?? undefined,
      'team-id': team?.id ?? undefined,
      credits: creditsAttribute(credits),
      'can-top-up': canTopUp ? '' : undefined,
      'account-url': accountUrl ?? undefined,
      version: version ?? undefined,
      hide: hide?.length ? hide.join(' ') : undefined,
      size: size === undefined ? undefined : String(size),
      'photo-busy': isPhotoBusy ? '' : undefined,
      ...labelAttributes(labels),
    },
    children,
  );
}
