const chapters = [
  { title: "Earth's Changing Surface", file: "chapters/chapter1.html" }
];

const list = document.getElementById("chapter-list");
chapters.forEach(ch => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = ch.file;
  a.textContent = ch.title;
  li.appendChild(a);
  list.appendChild(li);
});
