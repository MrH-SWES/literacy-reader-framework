// Shared engine script for modular reading framework

const bookListEl = document.getElementById("book-list");
const chapterTitleEl = document.getElementById("chapter-title");
const chapterContentEl = document.getElementById("chapter-content");

const basePath = "../books/";
const defaultCover = "default-cover.jpg";

// Utility: get query parameters
function getQueryParam(key) {
  return new URLSearchParams(window.location.search).get(key);
}

// ============ LIBRARY PAGE ============
if (bookListEl) {
  fetchBooks();
}

async function fetchBooks() {
  try {
    const res = await fetch(basePath);
    if (!res.ok) throw new Error("Unable to load book list");
    // GitHub Pages doesn’t allow directory listing — use known manifest fallback
    const bookDirs = ["suqua", "polio"]; // manually list known folders here for now

    bookListEl.innerHTML = "";
    for (const dir of bookDirs) {
      try {
        const manifestRes = await fetch(`${basePath}${dir}/chapters/manifest.json`);
        const manifest = manifestRes.ok ? await manifestRes.json() : [];
        const cover = `${basePath}${dir}/assets/cover.jpg`;

        const img = document.createElement("img");
        img.src = cover;
        img.onerror = () => (img.src = defaultCover);
        img.alt = `${dir} cover`;

        const div = document.createElement("div");
        div.className = "book-card";
        div.innerHTML = `<h2>${capitalize(dir)}</h2>`;
        div.prepend(img);
        div.onclick = () => window.location.href = `chapter.html?book=${dir}&chapter=1`;
        bookListEl.appendChild(div);
      } catch (e) {
        console.warn(`Could not load manifest for ${dir}`, e);
      }
    }
  } catch (err) {
    bookListEl.innerHTML = `<p>Error loading books.</p>`;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// ============ CHAPTER PAGE ============
if (chapterTitleEl) {
  const book = getQueryParam("book");
  const chapterIndex = parseInt(getQueryParam("chapter") || "1");
  if (book) loadChapter(book, chapterIndex);
}

async function loadChapter(book, chapterIndex) {
  try {
    const manifestRes = await fetch(`${basePath}${book}/chapters/manifest.json`);
    const manifest = await manifestRes.json();

    const chapter = manifest[chapterIndex - 1];
    const textRes = await fetch(`${basePath}${book}/chapters/${chapter.file}`);
    const text = await textRes.text();

    // Apply book-specific theme
    const themePath = `${basePath}${book}/theme.css`;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = themePath;
    document.head.appendChild(link);

    chapterTitleEl.textContent = chapter.title;
    chapterContentEl.innerHTML = text
      .split("\n")
      .map(p => `<p>${p}</p>`)
      .join("");

    // Buttons
    const prevBtn = document.getElementById("prev-btn");
    const nextBtn = document.getElementById("next-btn");

    prevBtn.onclick = () => {
      if (chapterIndex > 1)
        window.location.href = `chapter.html?book=${book}&chapter=${chapterIndex - 1}`;
    };

    nextBtn.onclick = () => {
      if (chapterIndex < manifest.length)
        window.location.href = `chapter.html?book=${book}&chapter=${chapterIndex + 1}`;
    };

  } catch (err) {
    console.error("Error loading chapter:", err);
    chapterContentEl.innerHTML = `<p>Error loading this chapter.</p>`;
  }
}
