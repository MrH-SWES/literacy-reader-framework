const bookName = "geology";
const chapters = [
  { number: 1, title: "Earth's Changing Surface", file: "chapter1.txt" },
  { number: 2, title: "Earth's Layers and Moving Plates", file: "chapter2.txt" },
  { number: 3, title: "Earth's Shakes and Quakes", file: "chapter3.txt" }
];

const list = document.getElementById("chapter-list");
chapters.forEach(ch => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = `../../engine/chapter.html?book=${bookName}&chapter=${ch.file}`;
  a.textContent = `Chapter ${ch.number}: ${ch.title}`;
  li.appendChild(a);
  list.appendChild(li);
});
