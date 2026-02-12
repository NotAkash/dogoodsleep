import Link from "next/link";

const links = [
    { href: "/", label: "Home" },
    { href: "/places-faces", label: "Places & Faces" },
    { href: "/resume", label: "Resume" }
];

export function MainNav() {
    return (
        <header className="sticky top-0 z-20 w-full bg-[#050505]/80 backdrop-blur-sm">
            <nav className="mx-auto flex max-w-4xl items-center justify-center gap-8 px-6 py-6 text-sm tracking-wide text-[#a3a3a3]">
                {links.map((link) => (
                    <Link
                        key={link.href}
                        href={link.href}
                        className="transition-colors hover:text-[#d4d4d4]"
                    >
                        [{link.label}]
                    </Link>
                ))}
            </nav>
        </header>
    );
}
