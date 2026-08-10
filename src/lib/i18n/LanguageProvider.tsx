"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { dict, type Lang, type TranslationKey } from './dictionary';

const STORAGE_KEY = 'lang';

/** Most dealers and shopkeepers on this marketplace read Bangla, so it leads. */
const DEFAULT_LANG: Lang = 'bn';

/** Accepts any string so an unknown key degrades instead of failing to compile. */
type Key = TranslationKey | (string & {});

interface LanguageContextValue {
    lang: Lang;
    setLang: (next: Lang) => void;
    t: (key: Key) => string;
}

const isLang = (v: unknown): v is Lang => v === 'en' || v === 'bn';

/* hasOwnProperty, not `in` — otherwise t('toString') would return a function. */
const lookup = (table: Record<TranslationKey, string>, key: Key): string | undefined => {
    if (!Object.prototype.hasOwnProperty.call(table, key)) return undefined;
    const hit = table[key as TranslationKey];
    return typeof hit === 'string' ? hit : undefined;
};

/** chosen → English → the key itself, so a gap reads as text, never as blank. */
const translate = (lang: Lang, key: Key): string =>
    lookup(dict[lang], key) ?? lookup(dict.en, key) ?? String(key);

/* A working default means a component rendered outside the provider (a stray
   portal, a test) still shows readable text rather than crashing. */
const LanguageContext = createContext<LanguageContextValue>({
    lang: DEFAULT_LANG,
    setLang: () => undefined,
    t: (key) => translate(DEFAULT_LANG, key),
});

export const useLanguage = () => useContext(LanguageContext);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
    const [lang, setLangState] = useState<Lang>(DEFAULT_LANG);

    // localStorage is read after mount, never during render: the server has no
    // idea what is stored there, and reading it while rendering would make the
    // first client paint disagree with the HTML and blow up hydration.
    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(STORAGE_KEY);
            if (isLang(saved) && saved !== DEFAULT_LANG) setLangState(saved);
        } catch {
            // Private mode / storage disabled — the default is a fine answer.
        }
    }, []);

    // Screen readers and the Bangla webfont both key off <html lang>.
    useEffect(() => {
        document.documentElement.lang = lang;
    }, [lang]);

    const setLang = useCallback((next: Lang) => {
        setLangState(next);
        try {
            window.localStorage.setItem(STORAGE_KEY, next);
        } catch {
            // Not persisting is survivable; the switch still works this session.
        }
    }, []);

    const t = useCallback((key: Key) => translate(lang, key), [lang]);

    const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export default LanguageProvider;
