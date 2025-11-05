document.addEventListener("DOMContentLoaded", async () => {
  const list = document.getElementById("chapter-list");

  try {
    const response = await fetch("chapters/manifest.json");
    const manifest = await response.json();

    manifest.forEach(ch => {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = `../../engine/chapter.html?book=suqua&chapter=${ch.file}`;
      link.textContent = ch.title || ch.file.replace(".txt", "");
      li.appendChild(link);
      list.appendChild(li);
    });
  } catch (err) {
    list.innerHTML = `<li>Error loading chapters: ${err.message}</li>`;
  }
});
