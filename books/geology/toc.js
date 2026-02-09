const bookName = "geology";
const chapters = [
  { title: "Earth's Changing Surface", file: "chapter1.txt" }
];

const list = document.getElementById("chapter-list");
chapters.forEach(ch => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `../../engine/chapter.html?book=${bookName}&chapter=${ch.file}`;
  a.textContent = ch.title;
  li.appendChild(a);
  list.appendChild(li);
});
