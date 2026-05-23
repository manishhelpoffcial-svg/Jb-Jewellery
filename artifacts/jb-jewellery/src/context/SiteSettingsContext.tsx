import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  fetchSettings,
  loadCachedSettings,
  saveSettings as persist,
  SiteSettings,
  DEFAULT_SETTINGS,
} from '@/lib/siteSettings';

type Ctx = {
  settings: SiteSettings;
  setSettings: (s: SiteSettings) => Promise<void>;
  reload: () => Promise<void>;
  loading: boolean;
};

const SiteSettingsContext = createContext<Ctx>({
  settings: DEFAULT_SETTINGS,
  setSettings: async () => {},
  reload: async () => {},
  loading: true,
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<SiteSettings>(() => loadCachedSettings());
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      const fresh = await fetchSettings();
      setSettingsState(fresh);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
    const onUpdate = () => { reload(); };
    window.addEventListener('jb-settings-updated', onUpdate);
    return () => window.removeEventListener('jb-settings-updated', onUpdate);
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

  const setSettings = async (s: SiteSettings) => {
    setSettingsState(s);
    await persist(s);
  };

  return (
    <SiteSettingsContext.Provider value={{ settings, setSettings, reload, loading }}>
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
