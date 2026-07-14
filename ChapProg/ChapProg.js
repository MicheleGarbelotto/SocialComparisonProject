
<script>
(function () {

  function ensureContainer(){
    if (!document.getElementById('chapnav-bottom')) {
      const bottom = document.createElement('div');
      bottom.className = 'chapnav';
      bottom.id = 'chapnav-bottom';
      document.body.appendChild(bottom);
    }
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll('&','&amp;')
      .replaceAll('<','&lt;')
      .replaceAll('>','&gt;')
      .replaceAll('"','&quot;')
      .replaceAll("'","&#039;");
  }

  function titleFromSection(sec) {
    if (!sec) return '';
    const h = sec.querySelector('h1, h2, h3');
    return (h && h.textContent) ? h.textContent.trim() : '';
  }

  function isReferences(sec){
    return titleFromSection(sec).toLowerCase() === 'references';
  }

  function getAllHorizontalSections() {
    const slides = document.querySelector('.reveal .slides');
    if (!slides) return [];
    return Array.from(slides.children).filter(el => el.tagName === 'SECTION');
  }

  // Capitoli orizzontali (escludo solo la title slide; se References fosse orizzontale, la escludo comunque)
  function getHorizontalChapters() {
    const sections = getAllHorizontalSections();
    return sections.slice(1).filter(sec => !isReferences(sec));
  }

  // Verticali di un capitolo, escludendo References (anche se annidata)
  function verticalSlidesInChapter(chapterSection) {
    const nested = Array.from(chapterSection.children).filter(el => el.tagName === 'SECTION');
    const all = nested.length ? nested : [chapterSection];
    return all.filter(sec => !isReferences(sec));
  }

  function getCurrentSlideEl() {
    const api = revealApi();
    if (api && api.getCurrentSlide) return api.getCurrentSlide();

    const present = Array.from(document.querySelectorAll('.reveal .slides section.present'));
    return present.length ? present[present.length - 1] : null;
  }

  function revealApi() {
    if (window.Reveal) return window.Reveal;
    if (typeof Reveal !== 'undefined') return Reveal;
    return null;
  }

  function getActiveHorizontalSection(currentSlide) {
    if (!currentSlide) return null;
    return getAllHorizontalSections().find(sec => sec === currentSlide || sec.contains(currentSlide)) || null;
  }

  function render() {
    const container = document.getElementById('chapnav-bottom');
    if (!container) return;

    const chapters = getHorizontalChapters();
    const currentSlide = getCurrentSlideEl();
    const activeHorizontalSection = getActiveHorizontalSection(currentSlide);
    const allHorizontalSections = getAllHorizontalSections();
    const inTitle = activeHorizontalSection === allHorizontalSections[0];
    const inReferences = isReferences(currentSlide);

    // Se sei su References (anche verticale), nessun capitolo attivo (come title)
    const chapterIndex = (!inTitle && !inReferences && activeHorizontalSection)
      ? chapters.findIndex(sec => sec === activeHorizontalSection)
      : -1;

    // Per accendere il dot giusto: usa l'elemento slide corrente, non l'indice v,
    // perché References viene filtrata e gli indici numerici non coincidono più.
    const activeChapterSection = chapterIndex >= 0 ? chapters[chapterIndex] : null;
    const activeFilteredVerticals = activeChapterSection ? verticalSlidesInChapter(activeChapterSection) : [];
    const activeVIndex = (activeChapterSection && currentSlide)
      ? activeFilteredVerticals.findIndex(sec => sec === currentSlide)
      : -1;

    const html = chapters.map((sec, i) => {
      const title = titleFromSection(sec) || 'Section';

      const vSlides = verticalSlidesInChapter(sec);
      const total = vSlides.length;

      const isActive = (i === chapterIndex);

      const dots = Array.from({length: total}, (_, k) => {
        const on = (isActive && k === activeVIndex) ? ' on' : '';
        return '<span class="dot' + on + '"></span>';
      }).join('');

      const active = isActive ? ' active' : '';
      return (
        '<span class="chap' + active + '">' +
          '<span class="name">' + escapeHtml(title) + '</span>' +
          '<span class="dots">' + dots + '</span>' +
        '</span>'
      );
    }).join('');

    container.innerHTML = html;
  }

  function update(){
    ensureContainer();
    render();
  }

  function bindReveal(){
    const api = revealApi();
    if (!(api && api.on)) return false;
    api.on('ready', update);
    api.on('slidechanged', update);
    update();
    return true;
  }

  function bindDomFallback(){
    window.addEventListener('hashchange', update);

    const slides = document.querySelector('.reveal .slides');
    if (!slides) return false;

    const observer = new MutationObserver(update);
    observer.observe(slides, {
      attributes: true,
      attributeFilter: ['class'],
      subtree: true
    });
    update();
    return true;
  }

  document.addEventListener('DOMContentLoaded', function(){
    ensureContainer();
    if (bindReveal()) return;
    if (bindDomFallback()) return;

    let tries = 0;
    const t = setInterval(function(){
      tries++;
      if (bindReveal() || bindDomFallback() || tries > 60) clearInterval(t);
    }, 100);
  });

})();
</script>
