import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { loadSettings, saveSettings as persist, SiteSettings, DEFAULT_SETTINGS } from '@/lib/siteSettings';

type Ctx = {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => void;
  reload: () => void;
};

const SiteSettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  setSettings: () => {},
  reload: () => {},
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<SiteSettings>(() => loadSettings());

  const reload = useCallback(() => setSettingsState(loadSettings()), []);

  useEffect(() => {
    const onUpdate = () => reload();
    window.addEventListener('jb-settings-updated', onUpdate);
    window.addEventListener('storage', onUpdate);
    return () => {
      window.removeEventListener('jb-settings-updated', onUpdate);
      window.removeEventListener('storage', onUpdate);
    };
  }, [reload]);

  // Apply SEO meta tags to <head>
  useEffect(() => {
    document.title = settings.seo.title;
    setMeta('description', settings.seo.description);
    setMeta('keywords', settings.seo.keywords);
    setMetaProperty('og:title', settings.seo.title);
    setMetaProperty('og:description', settings.seo.description);
    if (settings.seo.ogImage) setMetaProperty('og:image', settings.seo.ogImage);
  }, [settings.seo]);

  const setSettings = (s: SiteSettings) => {
    setSettingsState(s);
    persist(s);
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, setSettings, reload }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

function setMeta(name: string, content: string) {
  let el = document.querySelector(`meta[name="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('name', name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setMetaProperty(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute('property', property);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
