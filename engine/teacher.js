document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("book-grid");
  const loading = document.getElementById("loading");

  try {
    // Try to fetch a manifest of all books from the /books folder
    // (if you ever add one later). Otherwise, we'll discover them dynamically.
    const booksDir = "./books";

    // Dynamically discover book folders
    const response = await fetch(booksDir);
    if (!response.ok) throw new Error("Cannot list /books directory on GitHub Pages (expected).");

    // (For local dev only — GitHub Pages doesn't allow folder listing)
    // Instead, manually list known books for now:
    const books = ["suqua"]; // Add "polio" later automatically

    await Promise.all(
      books.map(async (book) => {
        const manifestUrl = `${booksDir}/${book}/chapters/manifest.json`;
        const coverUrl = `${booksDir}/${book}/assets/${book}-cover.jpg`;

        let manifest;
        try {
          const res = await fetch(manifestUrl);
          manifest = await res.json();
        } catch {
          manifest = [];
        }

        const bookTitle =
          manifest.length > 0 && manifest[0].bookTitle
            ? manifest[0].bookTitle
            : book.charAt(0).toUpperCase() + book.slice(1);

        const author =
          manifest.length > 0 && manifest[0].author
            ? manifest[0].author
            : "";

        const card = document.createElement("a");
        card.href = `../books/${book}/index.html`;
        card.className = "book-card";
        card.innerHTML = `
          <img src="${coverUrl}" alt="${bookTitle} cover" onerror="this.src='../engine/default-cover.jpg'">
          <div class="book-info">
            <div class="book-title">${bookTitle}</div>
            <div class="book-author">${author}</div>
          </div>
        `;
        grid.appendChild(card);
      })
    );

    loading.style.display = "none";
  } catch (err) {
    console.error(err);
    loading.textContent = "Error loading books.";
  }
});
