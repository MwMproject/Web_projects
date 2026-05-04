document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");
  const navLinks = document.querySelectorAll(".nav-links a");

  const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  burger?.addEventListener("click", () => {
    const isOpen = nav.classList.toggle("open");
    burger.setAttribute("aria-expanded", String(isOpen));
  });

  navLinks.forEach((link) => {
    link.addEventListener("click", () => {
      nav?.classList.remove("open");
      burger?.setAttribute("aria-expanded", "false");
    });
  });

  const sections = document.querySelectorAll("section[id]");
  if (sections.length) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id;
        navLinks.forEach((link) => link.classList.toggle("active", link.getAttribute("href") === `#${id}`));
      });
    }, { rootMargin: "-35% 0px -55% 0px", threshold: 0 });
    sections.forEach((section) => observer.observe(section));
  }

  document.querySelectorAll(".service").forEach((service) => {
    const toggle = () => {
      if (!service.classList.contains("service-conseil")) service.classList.toggle("open");
    };
    service.addEventListener("click", (event) => {
      if (event.target.closest("a")) return;
      toggle();
    });
    service.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        toggle();
      }
    });
  });

  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("visible");
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  const track = document.querySelector(".carousel-track");
  const slides = document.querySelectorAll(".carousel-slide");
  const nextBtn = document.querySelector(".carousel-btn.next");
  const prevBtn = document.querySelector(".carousel-btn.prev");
  const carousel = document.querySelector(".carousel");

  if (!track || !slides.length || !carousel) return;

  let currentSlide = 0;
  let innerTimer = null;
  let startX = 0;
  const INNER_DELAY = 2600;
  const SINGLE_DELAY = 3600;
  const SLIDE_DELAY = 600;

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
    if (!images.length) return;
    let index = 0;
    images.forEach((img) => img.classList.remove("active"));
    images[0].classList.add("active");

    if (images.length === 1) {
      innerTimer = setTimeout(nextSlide, SINGLE_DELAY);
      return;
    }

    innerTimer = setInterval(() => {
      images[index].classList.remove("active");
      index += 1;
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

  nextBtn?.addEventListener("click", nextSlide);
  prevBtn?.addEventListener("click", prevSlide);
  carousel.addEventListener("touchstart", (event) => { startX = event.touches[0].clientX; }, { passive: true });
  carousel.addEventListener("touchend", (event) => {
    const endX = event.changedTouches[0].clientX;
    if (startX - endX > 50) nextSlide();
    if (endX - startX > 50) prevSlide();
  }, { passive: true });

  updateCarousel();
});
