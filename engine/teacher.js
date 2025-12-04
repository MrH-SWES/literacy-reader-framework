document.addEventListener("DOMContentLoaded", async () => {
  const grid = document.getElementById("book-grid");
  const loading = document.getElementById("loading");
  
  try {
    // Use absolute path for GitHub Pages
    const booksDir = "/literacy-reader-framework/books";
    
    // Manually list known books
    const books = ["suqua", "polio", "jane_goodall"];
    
    await Promise.all(
      books.map(async (book) => {
        const manifestUrl = `${booksDir}/${book}/chapters/manifest.json`;
        const coverUrl = `${booksDir}/${book}/assets/${book}-cover.jpg`;
        
        let manifest;
        try {
          const res = await fetch(manifestUrl);
          manifest = await res.json();
        } catch {
          manifest = {};
        }
        
        // Get title from manifest.title OR from first chapter's bookTitle
        const bookTitle = manifest.title 
            || (manifest.chapters && manifest.chapters[0]?.bookTitle)
            || book.charAt(0).toUpperCase() + book.slice(1);
            
        // Get author from manifest.author OR from first chapter's author
        const author = manifest.author 
            || (manifest.chapters && manifest.chapters[0]?.author)
            || "Unknown Author";
        
        const card = document.createElement("a");
        card.href = `/literacy-reader-framework/books/${book}/index.html`;
        card.className = "book-card";
        card.innerHTML = `
          <img src="${coverUrl}" alt="${bookTitle} cover" onerror="this.src='/literacy-reader-framework/engine/default-cover.jpg'">
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
