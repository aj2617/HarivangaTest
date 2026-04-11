export const ADMIN_SETTINGS_KEY = 'harivanga_admin_settings';
export const LEGACY_ADMIN_SETTINGS_KEY = 'mangobd_admin_settings';
export const ADMIN_SETTINGS_CHANGED_EVENT = 'harivanga:admin-settings-changed';

export const notifyAdminSettingsChanged = () => {
  if (typeof window === 'undefined') {
    return;
  }

  window.dispatchEvent(new CustomEvent(ADMIN_SETTINGS_CHANGED_EVENT));
};
