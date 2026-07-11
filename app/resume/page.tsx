const focusAreas = [
  "Photography direction and sequencing",
  "Editorial storytelling across image and text",
  "Portfolio development and visual identity",
];

const currentSections = [
  {
    label: "Now",
    value: "Building a sharper home for photographs, notes, and selected work.",
  },
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
    <main className="relative min-h-[calc(100vh-84px)] overflow-hidden bg-[#050505]">
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.05),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,0.08),transparent_20%)]" />
      <section className="relative mx-auto w-full max-w-6xl px-6 py-8 sm:px-8 sm:py-10 lg:px-10">
        <div className="grid gap-10 border-b border-white/10 pb-10 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-white/45">
              Resume / About
            </p>
            <h1 className="mt-4 max-w-4xl text-4xl font-medium tracking-[-0.05em] text-white sm:text-5xl lg:text-6xl">
              A working profile for the person behind the archive.
            </h1>
            <p className="mt-5 max-w-2xl text-sm leading-8 text-white/62 sm:text-base">
              This page stays intentionally lean for now: a short introduction,
              the kind of work this site is moving toward, and the shape of the
              collaborations it can support.
            </p>
          </div>

          <div className="grid gap-4">
            {currentSections.map((section) => (
              <div
                key={section.label}
                className="border border-white/10 bg-white/[0.03] p-4"
              >
                <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
                  {section.label}
                </p>
                <p className="mt-3 text-sm leading-7 text-white/72">
                  {section.value}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-6 py-10 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Focus
            </p>
            <div className="mt-5 space-y-4">
              {focusAreas.map((area, index) => (
                <div key={area} className="border-t border-white/10 pt-4 first:border-t-0 first:pt-0">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/34">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-sm leading-7 text-white/74">{area}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="border border-white/10 bg-white/[0.03] p-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-white/38">
              Short bio
            </p>
            <div className="mt-5 space-y-5 text-sm leading-8 text-white/72 sm:text-base">
              <p>
                Place Y Face is becoming a small editorial portfolio: part image
                archive, part notebook, part profile. The work leans toward
                photographs that feel observed rather than announced.
              </p>
              <p>
                The strongest direction for the site is not a corporate resume,
                but a selective working biography that can support freelance,
                artistic, and collaborative opportunities without flattening the
                tone of the project.
              </p>
              <p>
                As the site grows, this page can expand with concrete client
                history, exhibitions, publications, a downloadable CV, and more
                direct contact details.
              </p>
            </div>
          </section>
        </div>
      </section>
    </main>
  );
}
