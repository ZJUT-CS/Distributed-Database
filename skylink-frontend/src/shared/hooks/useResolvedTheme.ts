import { useEffect, useState } from 'react';

/**
 * 获取当前系统/用户主题状态
 * 返回 'light' | 'dark'
 */
export function useResolvedTheme(): 'light' | 'dark' {
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => {
        if (typeof window === 'undefined') return 'light';
        const saved = localStorage.getItem('theme');
        if (saved === 'light' || saved === 'dark') return saved;
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    });

    useEffect(() => {
        const updateTheme = () => {
            const saved = localStorage.getItem('theme');
            if (saved === 'light' || saved === 'dark') {
                setResolvedTheme(saved);
            } else {
                setResolvedTheme(
                    window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
                );
            }
        };

        // 监听 localStorage 变化（其他标签页切换主题）
        const handleStorage = (e: StorageEvent) => {
            if (e.key === 'theme') updateTheme();
        };

        // 监听系统主题变化
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleMediaChange = () => {
            const saved = localStorage.getItem('theme');
            if (!saved || saved === 'system') updateTheme();
        };

        // 监听 DOM class 变化（同一标签页切换主题）
        const observer = new MutationObserver(() => {
            const isDark = document.documentElement.classList.contains('dark');
            setResolvedTheme(isDark ? 'dark' : 'light');
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['class'],
        });

        window.addEventListener('storage', handleStorage);
        mediaQuery.addEventListener('change', handleMediaChange);

        return () => {
            observer.disconnect();
            window.removeEventListener('storage', handleStorage);
            mediaQuery.removeEventListener('change', handleMediaChange);
        };
    }, []);

    return resolvedTheme;
}

export default useResolvedTheme;
