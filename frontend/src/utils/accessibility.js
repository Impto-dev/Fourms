import React from 'react';

// ARIA role constants
export const ROLES = {
  BUTTON: 'button',
  LINK: 'link',
  MENU: 'menu',
  MENUITEM: 'menuitem',
  NAVIGATION: 'navigation',
  SEARCH: 'search',
  FORM: 'form',
  ALERT: 'alert',
  DIALOG: 'dialog',
  TABLIST: 'tablist',
  TAB: 'tab',
  TABPANEL: 'tabpanel',
};

// Keyboard navigation keys
export const KEYS = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
};

// Generate ARIA attributes for a component
export const getAriaAttributes = ({
  role,
  label,
  description,
  expanded,
  pressed,
  selected,
  disabled,
  hidden,
  invalid,
  required,
  current,
  controls,
  describedby,
  labelledby,
  owns,
  haspopup,
  level,
  posinset,
  setsize,
}) => {
  const attributes = {};

  if (role) attributes.role = role;
  if (label) attributes['aria-label'] = label;
  if (description) attributes['aria-description'] = description;
  if (expanded !== undefined) attributes['aria-expanded'] = expanded;
  if (pressed !== undefined) attributes['aria-pressed'] = pressed;
  if (selected !== undefined) attributes['aria-selected'] = selected;
  if (disabled !== undefined) attributes['aria-disabled'] = disabled;
  if (hidden !== undefined) attributes['aria-hidden'] = hidden;
  if (invalid !== undefined) attributes['aria-invalid'] = invalid;
  if (required !== undefined) attributes['aria-required'] = required;
  if (current !== undefined) attributes['aria-current'] = current;
  if (controls) attributes['aria-controls'] = controls;
  if (describedby) attributes['aria-describedby'] = describedby;
  if (labelledby) attributes['aria-labelledby'] = labelledby;
  if (owns) attributes['aria-owns'] = owns;
  if (haspopup !== undefined) attributes['aria-haspopup'] = haspopup;
  if (level) attributes['aria-level'] = level;
  if (posinset) attributes['aria-posinset'] = posinset;
  if (setsize) attributes['aria-setsize'] = setsize;

  return attributes;
};

// Generate keyboard navigation handlers
export const getKeyboardHandlers = ({
  onEnter,
  onSpace,
  onEscape,
  onArrowUp,
  onArrowDown,
  onArrowLeft,
  onArrowRight,
  onHome,
  onEnd,
}) => {
  return {
    onKeyDown: (e) => {
      switch (e.key) {
        case KEYS.ENTER:
          onEnter?.(e);
          break;
        case KEYS.SPACE:
          e.preventDefault(); // Prevent page scroll
          onSpace?.(e);
          break;
        case KEYS.ESCAPE:
          onEscape?.(e);
          break;
        case KEYS.ARROW_UP:
          onArrowUp?.(e);
          break;
        case KEYS.ARROW_DOWN:
          onArrowDown?.(e);
          break;
        case KEYS.ARROW_LEFT:
          onArrowLeft?.(e);
          break;
        case KEYS.ARROW_RIGHT:
          onArrowRight?.(e);
          break;
        case KEYS.HOME:
          onHome?.(e);
          break;
        case KEYS.END:
          onEnd?.(e);
          break;
      }
    },
  };
};

// Generate focus management attributes
export const getFocusAttributes = ({
  tabIndex = 0,
  autoFocus = false,
  focusable = true,
}) => {
  return {
    tabIndex: focusable ? tabIndex : -1,
    autoFocus,
  };
};

// Generate live region attributes
export const getLiveRegionAttributes = ({
  atomic = false,
  busy = false,
  live = 'polite',
  relevant = 'additions text',
}) => {
  return {
    'aria-atomic': atomic,
    'aria-busy': busy,
    'aria-live': live,
    'aria-relevant': relevant,
  };
};

// Generate landmark attributes
export const getLandmarkAttributes = ({
  role,
  label,
  description,
}) => {
  return {
    role,
    'aria-label': label,
    'aria-description': description,
  };
};

// Generate form control attributes
export const getFormControlAttributes = ({
  required,
  invalid,
  disabled,
  readOnly,
  errorMessage,
  description,
}) => {
  return {
    'aria-required': required,
    'aria-invalid': invalid,
    'aria-disabled': disabled,
    'aria-readonly': readOnly,
    'aria-errormessage': errorMessage,
    'aria-describedby': description,
  };
};

// Generate list attributes
export const getListAttributes = ({
  role = 'list',
  label,
  description,
}) => {
  return {
    role,
    'aria-label': label,
    'aria-description': description,
  };
};

// Generate list item attributes
export const getListItemAttributes = ({
  posinset,
  setsize,
  selected,
}) => {
  return {
    'aria-posinset': posinset,
    'aria-setsize': setsize,
    'aria-selected': selected,
  };
}; 