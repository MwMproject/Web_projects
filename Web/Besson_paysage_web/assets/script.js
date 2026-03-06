document.addEventListener("DOMContentLoaded", () => {
  /* =====================================================
     NAVBAR
  ===================================================== */
  const nav = document.querySelector(".nav");

  if (nav) {
    window.addEventListener("scroll", () => {
      nav.classList.toggle("scrolled", window.scrollY > 20);
    });
  }

  /* =====================================================
     BURGER MENU
  ===================================================== */
  const burger = document.querySelector(".burger");
  const navLinks = document.querySelectorAll(".nav-links a");

  if (burger) {
    burger.addEventListener("click", () => {
      nav.classList.toggle("open");
    });
  }

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
    });
  });

  /* =====================================================
     SCROLL SPY
  ===================================================== */
  const sections = document.querySelectorAll("section");

  if (sections.length && navLinks.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const id = entry.target.id;
          navLinks.forEach((link) => {
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`
            );
          });
        });
      },
      { threshold: 0.4 }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* =====================================================
     SERVICES : accordion
  ===================================================== */
  document.querySelectorAll(".service").forEach((service) => {
    service.addEventListener("click", (e) => {
      if (e.target.closest("a")) return;
      service.classList.toggle("open");
    });
  });

  /* =====================================================
     CAROUSEL + INNER SLIDER
  ===================================================== */
  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-slide");
  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const carousel = document.querySelector(".carousel");

  if (!track || !slides.length || !carousel) return;

  let currentSlide = 0;
  let innerTimer = null;
  let startX = 0;

  /* Timings */
  const INNER_DELAY = 3000; // durée entre images internes
  const SINGLE_DELAY = 4000; // pause si une seule image
  const SLIDE_DELAY = 800; // délai avant slide suivant

  /* Préchargement images */
  document.querySelectorAll(".inner-slider img").forEach((img) => {
    const preload = new Image();
    preload.src = img.src;
  });

  function updateCarousel() {
    track.style.transform = `translateX(-${currentSlide * 100}%)`;
    startInnerSlider(slides[currentSlide]);
  }

  function startInnerSlider(slide) {
    clearInterval(innerTimer);

    const images = slide.querySelectorAll(".inner-slider img");
    let index = 0;

    images.forEach((img) => img.classList.remove("active"));
    images[0].classList.add("active");

    if (images.length === 1) {
      innerTimer = setTimeout(nextSlide, SINGLE_DELAY);
      return;
    }

    innerTimer = setInterval(() => {
      images[index].classList.remove("active");
      index++;

      if (index >= images.length) {
        clearInterval(innerTimer);
        setTimeout(nextSlide, SLIDE_DELAY);
        return;
      }

      images[index].classList.add("active");
    }, INNER_DELAY);
  }

  function nextSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
  }

  function prevSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateCarousel();
  }

  /* Boutons */
  if (nextBtn) nextBtn.addEventListener("click", nextSlide);
  if (prevBtn) prevBtn.addEventListener("click", prevSlide);

  /* Swipe mobile */
  carousel.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  });

  carousel.addEventListener("touchend", (e) => {
    const endX = e.changedTouches[0].clientX;
    if (startX - endX > 50) nextSlide();
    if (endX - startX > 50) prevSlide();
  });

  /* INIT */
  updateCarousel();
});
