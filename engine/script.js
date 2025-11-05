document.addEventListener("DOMContentLoaded", () => {
  const chapterContainer = document.querySelector(".chapter-content");
  const pageNumberDisplay = document.querySelector(".page-number");
  const prevButton = document.getElementById("prev");
  const nextButton = document.getElementById("next");
  const chapterTitleEl = document.getElementById("chapter-title");

  if (!chapterContainer) return;

  // --- Book + Chapter Context ---------------------------------------------
  const urlParams = new URLSearchParams(window.location.search);
  const book = urlParams.get("book") || "suqua";
  const chapterFile = urlParams.get("chapter") || "chapter1.txt";

  const CHAPTERS_PATH = `../books/${book}/chapters/`;
  const GLOSSARY_PATH = `../books/${book}/glossary.json`;
  const MANIFEST_PATH = `../books/${book}/chapters/manifest.json`;

  let glossary = {};
  let pages = [];
  let currentPage = 0;

  const escapeRegExp = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // --- Paragraph + Glossary Rendering -------------------------------------
  function makeParagraphHTML(rawText) {
    const norm = rawText.replace(/\r/g, "");
    const parts = norm
      .split(/(?:\n{2,})|\n(?=\s*[A-Z""'])/g)
      .map((s) =>
        s
          .replace(/\s+([,.!?;:])/g, "$1")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);
    return parts.map((p) => `<p>${renderGlossaryInline(p)}</p>`).join("\n\n");
  }

  function renderGlossaryInline(text) {
    if (!glossary || !Object.keys(glossary).length) return text;

    const terms = Object.keys(glossary).sort((a, b) => b.length - a.length);
    let processed = text;

    for (const original of terms) {
      const data = glossary[original];
      if (!data) continue;

      const regex = new RegExp(`\\b(${escapeRegExp(original)})\\b`, "i");
      const parts = processed.split(
        /(<span class="glossary-wrap"[^>]*>[\s\S]*?<\/span>)/
      );

      let foundAndReplaced = false;
      const newParts = parts.map((part) => {
        if (part.match(/<span class="glossary-wrap"/)) return part;
        if (!foundAndReplaced && regex.test(part)) {
          foundAndReplaced = true;
          return part.replace(
            regex,
            (match) =>
              `<span class="glossary-wrap" data-term="${original.toLowerCase()}">${match}</span>`
          );
        }
        return part;
      });

      processed = newParts.join("");
    }

    return processed;
  }

  // --- Glossary Popup -----------------------------------------------------
  function enhanceGlossary() {
    const popupContainer = document.getElementById("glossary-popup-container");
    if (!popupContainer) return;

    let activePopup = null;
    let activeTerm = null;

    document.querySelectorAll(".glossary-wrap").forEach((wrap) => {
      const termText = wrap.textContent;
      const termKey = wrap.getAttribute("data-term");
      if (!termKey) return;

      let data = glossary[termKey];
      if (!data) {
        const glossaryKey = Object.keys(glossary).find(
          (key) => key.toLowerCase() === termKey.toLowerCase()
        );
        if (glossaryKey) data = glossary[glossaryKey];
      }
      if (!data) return;

      const defText =
        typeof data === "object" ? data.definition : String(data);
      const imgHtml =
        typeof data === "object" && data.image
          ? `<img src="${data.image}" alt="${termText}" class="glossary-image" role="presentation">`
          : "";

      wrap.classList.add("glossary-term");
      wrap.setAttribute("role", "button");
      wrap.setAttribute("tabindex", "0");

      const showPopup = (e) => {
        e.stopPropagation();
        if (activePopup) {
          activePopup.remove();
          activePopup = null;
          if (activeTerm) activeTerm.classList.remove("active");
        }

        const popup = document.createElement("div");
        popup.className = "glossary-popup";
        popup.setAttribute("role", "dialog");
        popup.setAttribute("aria-label", `Definition of ${termText}`);
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
        wrap.classList.add("active");

        const closeBtn = popup.querySelector(".glossary-popup-close");
        closeBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          popup.remove();
          activePopup = null;
          wrap.classList.remove("active");
          activeTerm = null;
          wrap.focus();
        });

        setTimeout(() => closeBtn.focus(), 50);
      };

      wrap.addEventListener("click", showPopup);
      wrap.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          showPopup(e);
        }
      });
    });

    document.addEventListener("click", (e) => {
      if (
        activePopup &&
        !e.target.closest(".glossary-popup") &&
        !e.target.closest(".glossary-wrap")
      ) {
        activePopup.remove();
        activePopup = null;
        if (activeTerm) {
          activeTerm.classList.remove("active");
          activeTerm = null;
        }
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && activePopup) {
        activePopup.remove();
        activePopup = null;
        if (activeTerm) {
          activeTerm.classList.remove("active");
          activeTerm.focus();
          activeTerm = null;
        }
      }
    });
  }

  // --- Page Rendering -----------------------------------------------------
  function renderPage() {
    if (!pages.length) return;
    const page = pages[currentPage];
    let html = page.content;

    // Handle embedded images with syntax: [image: filename | width | align]
    html = html.replace(
      /\[image:\s*([^\|\]\s]+)(?:\s*\|\s*([^\|\]\s]+))?(?:\s*\|\s*(left|right|center))?\s*\]/gi,
      (_, file, width, align) => {
        const styleParts = [];
        if (width) styleParts.push(`width:${width}`);
        if (align === "center")
          styleParts.push("display:block;margin:1.5rem auto;");
        else if (align === "left")
          styleParts.push("float:left;margin:0 1rem 1rem 0;");
        else if (align === "right")
          styleParts.push("float:right;margin:0 0 1rem 1rem;");
        const style = styleParts.join("");
        return `<img src="../books/${book}/assets/${file}" alt="" class="chapter-illustration" style="${style}">`;
      }
    );

    chapterContainer.innerHTML = makeParagraphHTML(html);
    enhanceGlossary();

    const wrapper = document.querySelector(".chapter-container");
    if (currentPage === 0) wrapper.classList.add("first-page");
    else wrapper.classList.remove("first-page");

    pageNumberDisplay.textContent = `Page ${page.number}`;
    localStorage.setItem(`page-${book}-${chapterFile}`, currentPage);
    prevButton.disabled = currentPage === 0;
    nextButton.disabled = currentPage === pages.length - 1;
  }

  // --- Header Renderer ----------------------------------------------------
  function renderChapterHeader(chapterInfo, chapterTitleEl, manifestData) {
    // Fix: Adjust numbering for multi-part chapters
    let chapterNum = chapterInfo.number ?? 1;
    if (/\(Part\s*\d+\)/i.test(chapterInfo.title || "")) {
      const idx = Array.isArray(manifestData)
        ? manifestData.indexOf(chapterInfo)
        : -1;
      if (idx > 0) {
        const prev = manifestData[idx - 1];
        const basePrev = prev.title ? prev.title.split("(Part")[0].trim() : "";
        const baseCurr = chapterInfo.title.split("(Part")[0].trim();
        if (basePrev && baseCurr && basePrev === baseCurr) {
          chapterNum = prev.number;
        }
      }
    }

    const series = chapterInfo.series || "Small Steps:";
    const bookTitle = chapterInfo.bookTitle || "The Year I Got Polio";
    const title = chapterInfo.title || chapterInfo.chapterTitle || "Untitled";
    const author = chapterInfo.author || "Peg Kehret";

    chapterTitleEl.innerHTML = `
      <div class="chapter-header">
        <p class="book-series" style="font-size:1.05rem; color:#000; font-weight:normal; margin:0 0 0.2rem 0;">${series}</p>
        <h1 class="book-main-title" style="margin:0; font-size:2.2rem;">${bookTitle}</h1>
        <h2 class="chapter-subtitle" style="margin:0.5rem 0 0.75rem 0;">Chapter ${chapterNum}: ${title}</h2>
        <p class="chapter-author" style="margin:0.25rem 0 1.5rem 0; font-size:0.95rem; font-style:italic; color:#555;">by ${author}</p>
      </div>
      <hr class="title-divider">
    `;

    document.title = `${bookTitle} — Chapter ${chapterNum}`;
  }

  // --- Load Data ----------------------------------------------------------
  Promise.all([
    fetch(GLOSSARY_PATH).then((r) => (r.ok ? r.json() : {})),
    fetch(MANIFEST_PATH).then((r) => (r.ok ? r.json() : [])),
    fetch(`${CHAPTERS_PATH}${chapterFile}`).then((r) => {
      if (!r.ok) throw new Error(`Failed to load ${chapterFile}`);
      return r.text();
    }),
  ])
    .then(([glossaryData, manifestData, chapterText]) => {
      glossary = glossaryData || {};

      const chapterInfo = Array.isArray(manifestData)
        ? manifestData.find((ch) => ch.file === chapterFile)
        : null;

      if (chapterInfo && chapterTitleEl)
        renderChapterHeader(chapterInfo, chapterTitleEl, manifestData);

      // Remove redundant header lines
      chapterText = chapterText.replace(
        /Small Steps:[\s\S]*?by Peg Kehret\s*/i,
        ""
      );

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
        parseInt(localStorage.getItem(`page-${book}-${chapterFile}`), 10) || 0;
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
