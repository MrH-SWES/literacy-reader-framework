document.addEventListener("DOMContentLoaded", () => {
  // =========================================================
  //  CONFIG: Dynamic Book Loader
  // =========================================================
  const urlParams = new URLSearchParams(window.location.search);
  const bookName = urlParams.get("book") || "suqua"; // default book
  const chapterFile = urlParams.get("chapter") || "chapter1.txt";

  const BOOK_PATH = `../books/${bookName}/`;
  const CHAPTERS_PATH = `${BOOK_PATH}chapters/`;
  const GLOSSARY_PATH = `${BOOK_PATH}glossary.json`;
  const MANIFEST_PATH = `${CHAPTERS_PATH}manifest.json`;
  const THEME_PATH = `${BOOK_PATH}theme.css`;

  // Inject theme dynamically
  const themeLink = document.createElement("link");
  themeLink.rel = "stylesheet";
  themeLink.href = THEME_PATH;
  document.head.appendChild(themeLink);

  // =========================================================
  //  ELEMENTS
  // =========================================================
  const chapterContainer = document.querySelector(".chapter-content");
  const pageNumberDisplay = document.querySelector(".page-number");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const chapterTitleEl = document.getElementById("chapter-title");

  if (!chapterContainer) return;

  // =========================================================
  //  STATE
  // =========================================================
  let glossary = {};
  let pages = [];
  let currentPage = 0;

  // =========================================================
  //  HELPERS
  // =========================================================
  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  function makeParagraphHTML(rawText) {
    const norm = rawText.replace(/\r/g, "");

    const parts = norm
      .split(/(?:\n{2,})|\n(?=\s*[A-Z""'])/g)
      .map(s =>
        s
          .replace(/\s+([,.!?;:])/g, "$1")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    return parts.map(p => `<p>${renderGlossaryInline(p)}</p>`).join("\n\n");
  }

  function renderGlossaryInline(text) {
    if (!glossary || !Object.keys(glossary).length) return text;

    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    let processed = text;

    for (const original of terms) {
      const data = glossary[original];
      if (!data) continue;

      const regex = new RegExp(`\\b(${escapeRegExp(original)})\\b`, "i");
      const parts = processed.split(/(<span class="glossary-wrap"[^>]*>[\s\S]*?<\/span>)/);

      let foundAndReplaced = false;
      const newParts = parts.map(part => {
        if (part.match(/<span class="glossary-wrap"/)) return part;

        if (!foundAndReplaced && regex.test(part)) {
          foundAndReplaced = true;
          return part.replace(regex, (match) => {
            return `<span class="glossary-wrap" data-term="${original.toLowerCase()}">${match}</span>`;
          });
        }
        return part;
      });

      processed = newParts.join('');
    }
    return processed;
  }

  function enhanceGlossary() {
    const popupContainer = document.getElementById('glossary-popup-container');
    if (!popupContainer) {
      console.error('Popup container not found!');
      return;
    }

    let activePopup = null;
    let activeTerm = null;

    document.querySelectorAll(".glossary-wrap").forEach((wrap) => {
      const termText = wrap.textContent;
      const termKey = wrap.getAttribute('data-term');
      if (!termKey) return;

      let data = glossary[termKey];
      if (!data) {
        const glossaryKey = Object.keys(glossary).find(key => key.toLowerCase() === termKey.toLowerCase());
        if (glossaryKey) data = glossary[glossaryKey];
      }
      if (!data) return;

      const defText = typeof data === "object" ? data.definition : String(data);
      const imgHtml = typeof data === "object" && data.image
        ? `<img src="${data.image}" alt="${termText}" class="glossary-image" role="presentation">`
        : "";

      wrap.classList.add('glossary-term');
      wrap.setAttribute('role', 'button');
      wrap.setAttribute('tabindex', '0');

      const showPopup = (e) => {
        e.stopPropagation();

        if (activePopup) {
          activePopup.remove();
          activePopup = null;
          if (activeTerm) activeTerm.classList.remove('active');
        }

        const popup = document.createElement('div');
        popup.className = 'glossary-popup';
        popup.setAttribute('role', 'dialog');
        popup.setAttribute('aria-label', `Definition of ${termText}`);
        popup.innerHTML = `
          <div class="glossary-popup-content">
            <button class="glossary-popup-close" aria-hidden="true" tabindex="-1">×</button>
            <div class="glossary-popup-text">${defText}</div>
            ${imgHtml}
          </div>
        `;
        popupContainer.appendChild(popup);

        activePopup = popup;
        activeTerm = wrap;
        wrap.classList.add('active');

        const closeBtn = popup.querySelector('.glossary-popup-close');
        closeBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          popup.remove();
          activePopup = null;
          wrap.classList.remove('active');
          activeTerm = null;
          wrap.focus();
        });

        popupContainer.setAttribute('aria-live', 'assertive');
        setTimeout(() => popupContainer.setAttribute('aria-live', 'polite'), 100);
        setTimeout(() => closeBtn.focus(), 50);
      };

      wrap.addEventListener('click', showPopup);
      wrap.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          showPopup(e);
        }
      });
    });

    document.addEventListener('click', (e) => {
      if (activePopup && !e.target.closest('.glossary-popup') && !e.target.closest('.glossary-wrap')) {
        activePopup.remove();
        activePopup = null;
        if (activeTerm) {
          activeTerm.classList.remove('active');
          activeTerm = null;
        }
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && activePopup) {
        activePopup.remove();
        activePopup = null;
        if (activeTerm) {
          activeTerm.classList.remove('active');
          activeTerm.focus();
          activeTerm = null;
        }
      }
    });
  }

  function renderPage() {
    if (!pages.length) return;
    const page = pages[currentPage];

    pageNumberDisplay.textContent = `Page ${page.number}`;
    chapterContainer.innerHTML = makeParagraphHTML(page.content);
    enhanceGlossary();

    const wrapper = document.querySelector(".chapter-container");
    if (currentPage === 0) wrapper.classList.add("first-page");
    else wrapper.classList.remove("first-page");

    localStorage.setItem(`page-${bookName}-${chapterFile}`, currentPage);
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
  }

  // =========================================================
  //  FETCH DATA
  // =========================================================
  Promise.all([
    fetch(GLOSSARY_PATH)
      .then((r) => (r.ok ? r.json() : {}))
      .catch(() => ({})),

    fetch(MANIFEST_PATH)
      .then((r) => (r.ok ? r.json() : []))
      .catch(() => []),

    fetch(`${CHAPTERS_PATH}${chapterFile}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${chapterFile}`);
      return r.text();
    })
,
  ])
    .then(([glossaryData, manifestData, chapterText]) => {
      glossary = glossaryData || {};

      const chapterInfo = Array.isArray(manifestData)
        ? manifestData.find((ch) => ch.file === chapterFile)
        : null;
      if (chapterInfo && chapterTitleEl) {
        chapterTitleEl.textContent = chapterInfo.title || "Chapter";
      }

      const pageRegex = /\[startPage=(\d+)\]([\s\S]*?)\[endPage=\1\]/g;
      let m;
      while ((m = pageRegex.exec(chapterText)) !== null) {
        pages.push({ number: parseInt(m[1], 10), content: m[2].trim() });
      }

      if (!pages.length) {
        chapterContainer.innerHTML =
          '<p class="error">Error: No valid [startPage]/[endPage] markers found.</p>';
        return;
      }

      currentPage =
        parseInt(localStorage.getItem(`page-${bookName}-${chapterFile}`), 10) || 0;
      if (currentPage >= pages.length) currentPage = 0;

      prevButton.addEventListener("click", () => {
        if (currentPage > 0) {
          currentPage--;
          renderPage();
        }
      });

      nextButton.addEventListener("click", () => {
        if (currentPage < pages.length - 1) {
          currentPage++;
          renderPage();
        }
      });

      renderPage();
    })
    .catch((err) => {
      chapterContainer.innerHTML = `<p class="error">Error loading page: ${err.message}</p>`;
      if (chapterTitleEl) chapterTitleEl.textContent = "Error";
      console.error(err);
    });
});
