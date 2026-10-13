const nav = document.querySelector("ul");
const links = [...nav.querySelectorAll("a[href^='#']")];

const sections = links.map(link => document.querySelector(link.getAttribute("href")));
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

let pages = [];
let current = -1;
let queued = false;
let picked = null;
let settleTimer = 0;

function measure() {
  const total = document.documentElement.scrollHeight;
  const tops = sections.map((section, i) => {
    if (!section) return null;
    if (i === 0) return 0;
    const margin = parseFloat(getComputedStyle(section).scrollMarginTop) || 0;
    return Math.max(0, Math.round(section.getBoundingClientRect().top + window.scrollY - margin));
  });

  pages = [];
  tops.forEach((start, i) => {
    if (start == null) return;
    pages.push({ link: links[i], start, end: total });
  });
  pages.sort((a, b) => a.start - b.start);
  pages.forEach((page, i) => {
    if (pages[i + 1]) page.end = pages[i + 1].start;
  });
}
function pageAt(y) {
  const bottom = y + window.innerHeight >= document.documentElement.scrollHeight - 2;
  if (bottom) return pages[pages.length - 1];
  return pages.find(page => y + 1 >= page.start && y + 1 < page.end) || pages[0];
}

function updateIndicator() {
  queued = false;
  if (!pages.length) return;

  const page = (picked && pages.find(p => p.link === picked)) || pageAt(window.scrollY);
  if (!page) return;

  const navRect = nav.getBoundingClientRect();
  const rect = page.link.getBoundingClientRect();
  nav.style.setProperty("--indicator-left", `${rect.left - navRect.left}px`);
  nav.style.setProperty("--indicator-width", `${rect.width}px`);

  const index = links.indexOf(page.link);
  if (index !== current) {
    current = index;
    links.forEach((link, i) => link.classList.toggle("active", i === index));
  }
}

const landing = location.hash.length > 1 ? document.getElementById(decodeURIComponent(location.hash.slice(1))) : null;
let holding = !!landing;

function hold() {
  if (!holding || !landing) return;
  const margin = parseFloat(getComputedStyle(landing).scrollMarginTop) || 0;
  const y = Math.max(0, Math.round(landing.getBoundingClientRect().top + window.scrollY - margin));
  if (Math.abs(y - window.scrollY) > 1) window.scrollTo({ top: y, left: 0, behavior: "instant" });
}

function release() { holding = false; }
for (const ev of ["wheel", "touchstart", "mousedown", "keydown"]) window.addEventListener(ev, release, { passive: true, once: true });
setTimeout(release, 4000);

function refresh() {
  measure();
  hold();
  updateIndicator();
}
function schedule() {
  if (picked) {
    clearTimeout(settleTimer);
    settleTimer = setTimeout(unpick, 140);
  }
  if (queued) return;
  queued = true;
  requestAnimationFrame(updateIndicator);
}

function unpick() {
  clearTimeout(settleTimer);
  if (!picked) return;
  picked = null;
  schedule();
}

links.forEach(link => {
  link.addEventListener("click", () => {
    if (!pages.some(p => p.link === link)) return;
    holding = false;
    picked = link;
    clearTimeout(settleTimer);
    settleTimer = setTimeout(unpick, 400);
    updateIndicator();
  });
});
for (const ev of ["wheel", "touchstart", "keydown"]) window.addEventListener(ev, unpick, { passive: true });

window.addEventListener("scroll", schedule, { passive: true });
window.addEventListener("resize", refresh);
window.addEventListener("load", refresh);
if (window.ResizeObserver) new ResizeObserver(refresh).observe(document.body);

refresh();
if (!reduce) {
  requestAnimationFrame(() => requestAnimationFrame(() => nav.classList.add("slide")));
}
