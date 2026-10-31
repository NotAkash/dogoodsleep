export default function ResumePage() {
  return (
    <main id="main-content" className="page-wrap about-page">
      <p className="eyebrow">About / Akash</p>
      <h1 className="page-title">Hobbyist and engineer.</h1>
      <div className="about-layout">
        <div className="about-bio">
          <p>Do Good Sleep is a personal portfolio and notebook, made to hold a lot of my work together.</p>
          <p>A Queen&apos;s Computing graduate, Akash is a Toronto-based data engineer. He has a passion for exploring the intersection of technology, art, and experience. Originally from New Delhi, India.</p>
          <p>This website serves as a personal portfolio accumulating passion projects and creative work. It is not to be taken seriously.</p>
          <p>Akash is also very passionate about Leeds United.</p>
        </div>
        <aside>
          <dl className="about-details"><div><dt>Based</dt><dd>Toronto</dd></div></dl>
          <section className="about-project">
            <h2>Building</h2>
            <a href="https://transit-tracker.dogoodsleep.com/" target="_blank" rel="noopener noreferrer"
              aria-label="Transit tracker (opens in a new tab)">Transit tracker <span aria-hidden="true">↗</span></a>
          </section>
        </aside>
      </div>
    </main>
  );
}
