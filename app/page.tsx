import Link from "next/link";

const entryLinks = [
  {
    href: "/places-faces",
    label: "Places & Faces",
    kicker: "Archive",
    description:
      "A full sequence of photographs presented as a slow editorial wall.",
  },
  {
    href: "/journal",
    label: "Journal",
    kicker: "Writing",
    description:
      "Field notes, process fragments, and short essays around the work.",
  },
  {
    href: "/resume",
    label: "Resume",
    kicker: "About",
    description:
      "A simple bio and working history space that can keep growing from here.",
  },
];

export default function HomePage() {
  return (
    <main className="relative min-h-[calc(100vh-84px)] overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.14),transparent_32%),radial-gradient(circle_at_80%_20%,rgba(120,119,198,0.08),transparent_24%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_45%)]" />
      <section className="relative mx-auto flex min-h-[calc(100vh-84px)] w-full max-w-6xl flex-col justify-center px-6 py-16 sm:px-8 lg:px-10">
        <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">
          Akash / Place Y Face
        </p>
        <h1 className="mt-6 max-w-4xl text-5xl font-medium tracking-[-0.05em] text-white sm:text-6xl lg:text-7xl">
          Photography, notes, and quiet sequencing for images that deserve more
          than a random grid.
        </h1>
        <p className="mt-6 max-w-2xl text-base leading-8 text-white/62 sm:text-lg">
          This site is becoming a sharper home for images, writing, and the
          slower details around both. The archive leads, the journal adds
          context, and the rest of the profile can grow around that.
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-3">
          {entryLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group border border-white/10 bg-white/[0.03] p-6 transition duration-300 hover:border-white/20 hover:bg-white/[0.05]"
            >
              <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                {link.kicker}
              </p>
              <h2 className="mt-4 text-2xl font-medium tracking-[-0.03em] text-white">
                {link.label}
              </h2>
              <p className="mt-4 text-sm leading-7 text-white/60">
                {link.description}
              </p>
              <p className="mt-8 text-xs uppercase tracking-[0.24em] text-white/48 transition group-hover:text-white/72">
                Enter
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
