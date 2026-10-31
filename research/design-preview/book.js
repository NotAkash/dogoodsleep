// Assembles the editable full-site review sheet from the same prototype views.
const book = document.querySelector('#book');
const names={home:'01 / Home — split contrast',archive:'02 / Places & Faces',viewer:'03 / Photo viewer',journal:'04 / Journal index',entry:'05 / Journal entry',about:'06 / About',states:'07 / States and recovery'};
book.innerHTML='<header class="book-intro"><h1>Do Good Sleep / Revised full-site direction</h1><p>30 October 2026 · Desktop 1440 / Mobile 390 · Supersedes the first editorial-notebook exploration</p><p>Keep the light/dark rhythm and Inter. Smaller landing title. Keep film posters, titles, years and ratings. Remove Thinking about and update timestamps. Keep Elsewhere’s links and full comments; use one modest heading and consistent rows.</p><p>Static designs using existing content. No new biography or project capabilities. About omits age, employment and placeholder Focus content pending copy review. Sample photographs and films are snapshots. The archive and viewer are layout studies; retain production folder/history/pagination behaviour during implementation.</p></header>';
for(const [route,name] of Object.entries(names)){
 const row=document.createElement('section');row.className='book-row';
 for(const width of [1440,390]){
  const group=document.createElement('div');group.className='book-board';group.style.width=width+'px';
  const title=document.createElement('h2');title.textContent=name+' / '+(width===390?'Mobile 390':'Desktop 1440');group.append(title);
  const screen=document.createElement('div');screen.className='screen';screen.style.width=width+'px';
  screen.innerHTML=(route==='viewer'?'':header)+views[route]()+(route==='viewer'?'':footer);
  for(const a of screen.querySelectorAll('.site-header nav a')){a.removeAttribute('aria-current');if(a.getAttribute('href').includes('page='+(route==='entry'?'journal':route)))a.setAttribute('aria-current','page');}
  if(route==='viewer'){screen.querySelector('.viewer-shell').style.height=(width===390?844:900)+'px';screen.querySelector('.viewer-screen').style.minHeight='0';}
  group.append(screen);row.append(group);
 }
 book.append(row);
}
