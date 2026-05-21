/* Theme toggle */
const themeBtn = document.querySelector('.theme-toggle');
const iconMoon = themeBtn.querySelector('.icon-moon');
const iconSun = themeBtn.querySelector('.icon-sun');

function applyThemeIcons(isDark) {
  iconMoon.style.display = isDark ? 'none' : 'block';
  iconSun.style.display = isDark ? 'block' : 'none';
}

try {
  if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark');
    applyThemeIcons(true);
  }
} catch(e) {}

themeBtn.addEventListener('click', () => {
  document.body.classList.toggle('dark');
  const isDark = document.body.classList.contains('dark');
  applyThemeIcons(isDark);
  try { localStorage.setItem('theme', isDark ? 'dark' : 'light'); } catch(e) {}
});

/* Reveal on scroll */
const observer = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
document.querySelectorAll('.reveal').forEach(el => observer.observe(el));

/* Year */
document.getElementById('year').textContent = new Date().getFullYear();

/* Active nav highlight */
const sections = document.querySelectorAll('section[id]');
const navLinks = document.querySelectorAll('.nav a');
window.addEventListener('scroll', () => {
  let current = '';
  sections.forEach(s => {
    if (window.scrollY >= s.offsetTop - 200) current = s.id;
  });
  navLinks.forEach(a => {
    const active = a.getAttribute('href') === '#' + current;
    a.style.color = active ? 'var(--accent)' : '';
    a.style.background = active ? 'var(--accent-light)' : '';
  });
});
