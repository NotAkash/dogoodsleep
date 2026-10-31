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
        <header className="site-header">
            <nav
                aria-label="Primary navigation"
                className="site-nav"
            >
                <Link
                    href="/"
                    aria-label="Do Good Sleep, home"
                    aria-current={pathname === "/" ? "page" : undefined}
                    className="site-brand"
                >
                    Home
                </Link>

                <div className="site-nav-links">
                    {links.map((link) => {
                        const isCurrent =
                            pathname === link.href || pathname.startsWith(`${link.href}/`);

                        return (
                            <Link
                                key={link.href}
                                href={link.href}
                                aria-current={isCurrent ? "page" : undefined}
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
