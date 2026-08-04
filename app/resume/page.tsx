const focusAreas = [
  "Photography direction and sequencing",
  "Editorial storytelling across image and text",
  "Portfolio development and visual identity",
];

const currentSections = [
  {
    label: "Based",
    value: "Toronto, with work shaped by streets, transit, interiors, and late light.",
  },
  {
    label: "Open to",
    value: "Creative collaborations, commissions, documentation, and editorial projects.",
  },
];

export default function ResumePage() {
  return (
    <main className="paper-page min-h-[calc(100vh-65px)] bg-[var(--paper)] text-[var(--ink)]">
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pb-20 sm:pt-16 lg:px-8 lg:pt-20">
        <div className="grid gap-10 border-b border-[var(--rule)] pb-10 sm:pb-14 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-[var(--accent)]">
              About / Akash
            </p>
            <h1 className="mt-5 max-w-4xl font-serif text-4xl leading-[0.98] tracking-[-0.045em] sm:text-6xl lg:text-7xl">
              Photographs shaped by Toronto streets, transit, interiors, and
              late light.
            </h1>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[var(--muted)] sm:text-base sm:leading-8">
              Place Y Face is Akash&apos;s photographic archive and notebook,
              bringing observed frames, deliberate sequences, and short field
              notes into one place.
            </p>
          </div>

          <dl className="border-t border-[var(--rule)]">
            {currentSections.map((section) => (
              <div key={section.label} className="border-b border-[var(--rule)] py-4">
                <dt className="text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--accent)]">
                  {section.label}
                </dt>
                <dd className="mt-2 text-sm leading-6 text-[var(--muted)]">
                  {section.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="grid gap-12 py-10 sm:py-14 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] lg:gap-20 lg:py-16">
          <section>
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
              Focus
            </p>
            <ol className="mt-5 border-t border-[var(--rule)]">
              {focusAreas.map((area, index) => (
                <li
                  key={area}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-3 border-b border-[var(--rule)] py-4"
                >
                  <span className="font-mono text-[10px] tracking-[0.16em] text-[var(--muted)]">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className="text-sm leading-6 text-[var(--ink)]">{area}</span>
                </li>
              ))}
            </ol>
          </section>

          <section className="lg:border-l lg:border-[var(--rule)] lg:pl-12">
            <p className="text-[10px] font-medium uppercase tracking-[0.24em] text-[var(--accent)]">
              Short bio
            </p>
            <div className="mt-5 max-w-2xl space-y-5 font-serif text-xl leading-8 text-[var(--ink)] sm:text-2xl sm:leading-9">
              <p>
                Place Y Face brings Akash&apos;s photography and writing into
                one working record. The photographs lean toward moments that
                feel observed rather than announced.
              </p>
              <p>
                The journal holds notes on sequence, memory, and recurring
                details. Akash is open to commissions, documentation, editorial
                projects, and creative collaborations.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
