"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { IconContext } from 'react-icons';
import { useGetSiteContentQuery } from '@/redux/api/siteContentApi';
import brand from '@/config/brand';

interface ThemeContextType {
    primaryColor: string;
    secondaryColor: string;
    logoUrl: string;
    faviconUrl: string;
    isLoaded: boolean;
}

/**
 * The brand colour is deliberately NOT read from the database.
 *
 * It comes from the single `BRAND_PRIMARY` constant in `src/config/brand.ts`,
 * which `layout.tsx` compiles into a <style> tag on the server. That keeps one
 * editable variable in charge of the whole site and makes this codebase
 * re-skinnable for another shop by changing one line.
 *
 * Only the logo and favicon — genuine per-shop content — still come from the
 * admin/database.
 */
const defaultTheme: ThemeContextType = {
    primaryColor: brand.primary,
    secondaryColor: brand.secondary,
    logoUrl: '',
    faviconUrl: '',
    isLoaded: false,
};

const ThemeContext = createContext<ThemeContextType>(defaultTheme);

export const useTheme = () => useContext(ThemeContext);

/* ─────────────────────────────────────────────────────────────────── */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const { data: res } = useGetSiteContentQuery({});
    const [themeData, setThemeData] = useState<ThemeContextType>(defaultTheme);

    /* Pull only the non-colour branding (logo / favicon) from the API.
       Colours stay pinned to brand.ts and are never overridden here. */
    useEffect(() => {
        if (!res?.data?.theme) return;
        const t = res.data.theme;

        setThemeData({
            primaryColor: brand.primary,
            secondaryColor: brand.secondary,
            logoUrl: t.logoUrl || '',
            faviconUrl: t.faviconUrl || '',
            isLoaded: true,
        });
    }, [res]);

    return (
        <ThemeContext.Provider value={themeData}>
            {/* Global icon defaults — a consistent class on every react-icons SVG
               so outline (Lucide) icons render with a refined, uniform stroke. */}
            <IconContext.Provider value={{ className: 'app-icon' }}>
                {children}
            </IconContext.Provider>
        </ThemeContext.Provider>
    );
}
