"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
    { href: "/places-faces", label: "Places & Faces" },
    { href: "/journal", label: "Journal" },
    { href: "/resume", label: "About" },
];

export function MainNav() {
    const pathname = usePathname();

    return (
        <header className="site-header sticky top-0 z-30 w-full bg-[var(--surface)]">
            <nav
                aria-label="Primary navigation"
                className="mx-auto flex w-full max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8"
            >
                <Link
                    href="/"
                    aria-label="Do Good Sleep, home"
                    aria-current={pathname === "/" ? "page" : undefined}
                    className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.16em] text-[var(--ink)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:text-sm sm:tracking-[0.2em]"
                >
                    Home
                </Link>

                <div className="flex items-center gap-4 sm:gap-7">
                    {links.map((link) => {
                        const isCurrent =
                            pathname === link.href || pathname.startsWith(`${link.href}/`);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isCurrent ? "page" : undefined}
                                className={`border-b py-1 text-[10px] font-medium uppercase tracking-[0.15em] transition-opacity hover:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--ink)] sm:text-[11px] sm:tracking-[0.2em] ${isCurrent
                                        ? "border-[var(--ink)] text-[var(--ink)]"
                                        : "border-transparent text-[var(--ink)] opacity-55"
                                    }`}
                            >
                                {link.label}
                            </Link>
                        );
                    })}
                </div>
            </nav>
        </header>
    );
}
