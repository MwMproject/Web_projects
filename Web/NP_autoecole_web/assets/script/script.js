// --- Scroll par section avec dots ---

const sections = Array.from(document.querySelectorAll("section"));
const dots = Array.from(document.querySelectorAll(".scroll-dots .dot"));
let currentSection = 0;
let isScrolling = false;

function setActiveDot(index) {
  dots.forEach((dot) => dot.classList.remove("active"));
  if (dots[index]) dots[index].classList.add("active");
}
function scrollToSection(index) {
  if (index < 0 || index >= sections.length) return;
  isScrolling = true;
  currentSection = index;
  sections[index].scrollIntoView({ behavior: "smooth" });
  setActiveDot(index);
  setTimeout(() => (isScrolling = false), 1000);
}
window.addEventListener("wheel", (e) => {
  if (isScrolling) return;
  if (e.deltaY > 0) {
    scrollToSection(currentSection + 1);
  } else if (e.deltaY < 0) {
    scrollToSection(currentSection - 1);
  }
});
dots.forEach((dot, i) => {
  dot.addEventListener("click", () => scrollToSection(i));
});
window.addEventListener("scroll", () => {
  const scrollPosition = window.scrollY + window.innerHeight / 2;
  sections.forEach((section, index) => {
    if (
      scrollPosition >= section.offsetTop &&
      scrollPosition < section.offsetTop + section.offsetHeight
    ) {
      currentSection = index;
      setActiveDot(index);
    }
  });
});

// Gestion du formulaire de contact
document
  .getElementById("contactForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const name = this.name.value.trim();
    const email = this.email.value.trim();
    const message = this.message.value.trim();

    if (!name || !email || !message) {
      alert("Merci de compléter tous les champs.");
      return;
    }

    // Option 1 : via mailto (simple, mais limité)
    const subject = encodeURIComponent("Contact depuis le site – auto-école");
    const body = encodeURIComponent(
      `Nom : ${name}\nEmail : ${email}\nMessage : ${message}`
    );
    window.location.href = `mailto:tonadresse@example.com?subject=${subject}&body=${body}`;

    // Option 2 : envoyer via fetch à un backend (PHP, Node, etc.)
    /*
  fetch('/send-mail.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, message })
  })
  .then(res => res.json())
  .then(resJson => {
    alert('Message envoyé !');
    this.reset();
  })
  .catch(err => {
    console.error(err);
    alert('Erreur, réessayez plus tard.');
  });
  */
  });
