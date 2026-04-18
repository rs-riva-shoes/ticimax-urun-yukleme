import '@testing-library/jest-dom';
import { vi } from 'vitest';
import React from 'react';

// Küresel mock'lar
vi.mock('next/navigation', () => ({
    usePathname: () => '/',
    useRouter: () => ({
        push: vi.fn(),
        replace: vi.fn(),
        prefetch: vi.fn(),
        refresh: vi.fn(),
    })
}));

// Fetch Mock
global.fetch = vi.fn().mockImplementation(() =>
    Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ count: 0 }),
        text: () => Promise.resolve(''),
    })
) as unknown as typeof fetch;

// Next.js Image bileşenini standart bir <img> olarak mock'la
vi.mock('next/image', () => ({
    __esModule: true,
    default: (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
        // eslint-disable-next-line @next/next/no-img-element
        return <img alt="" {...props} />;
    },
}));

global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
}));
