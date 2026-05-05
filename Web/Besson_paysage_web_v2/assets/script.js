document.addEventListener("DOMContentLoaded", () => {
  const header = document.querySelector("[data-header]");
  const nav = document.querySelector(".nav");
  const burger = document.querySelector(".burger");
  const navLinks = document.querySelectorAll(".nav-links a");

  /* ── Header scroll ── */
  const onScroll = () =>
    header?.classList.toggle("scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  /* ── Burger menu ── */
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

  /* ── Active nav link on scroll ── */
  const sections = document.querySelectorAll("section[id]");
  if (sections.length) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = entry.target.id;
          navLinks.forEach((link) =>
            link.classList.toggle(
              "active",
              link.getAttribute("href") === `#${id}`,
            ),
          );
        });
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
  }

  /* ── Service card toggle ── */
  document.querySelectorAll(".service").forEach((service) => {
    const toggle = () => {
      if (!service.classList.contains("service-conseil"))
        service.classList.toggle("open");
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

  /* ── Reveal on scroll ── */
  const revealEls = document.querySelectorAll(".reveal");
  if (revealEls.length) {
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  }

  /* ── Parallax background on split sections ── */
  const sectionBgs = document.querySelectorAll(".section-bg");
  if (sectionBgs.length) {
    const updateParallax = () => {
      sectionBgs.forEach((bg) => {
        const section = bg.parentElement;
        const rect = section.getBoundingClientRect();
        const viewH = window.innerHeight;
        if (rect.bottom < 0 || rect.top > viewH) return;
        const progress = (viewH - rect.top) / (viewH + rect.height);
        const offset = (progress - 0.5) * 60;
        bg.style.transform = `scale(1.05) translateY(${offset}px)`;
      });
    };
    window.addEventListener("scroll", updateParallax, { passive: true });
    updateParallax();
  }

  /* ── Portfolio grid pagination ── */
  const projectSlides = document.querySelectorAll(".project-slide");
  const projectDots = document.querySelectorAll(".project-dot");
  const projectPagerBtns = document.querySelectorAll(".project-pager-btn");

  if (projectSlides.length > 1) {
    let currentPage = 0;

    function showPage(page) {
      currentPage = (page + projectSlides.length) % projectSlides.length;
      projectSlides.forEach((s, i) =>
        s.classList.toggle("active", i === currentPage),
      );
      projectDots.forEach((d, i) =>
        d.classList.toggle("active", i === currentPage),
      );
    }

    projectDots.forEach((dot) => {
      dot.addEventListener("click", () => showPage(Number(dot.dataset.page)));
    });

    projectPagerBtns.forEach((btn) => {
      btn.addEventListener("click", () =>
        showPage(currentPage + Number(btn.dataset.dir)),
      );
    });
  }

  /* ── Lightbox ── */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");

  if (lightbox && lightboxImg) {
    document
      .querySelectorAll(".project-grid img, .carousel-slide img")
      .forEach((img) => {
        img.style.cursor = "zoom-in";
        img.addEventListener("click", () => {
          lightboxImg.src = img.src;
          lightboxImg.alt = img.alt;
          lightbox.classList.add("open");
          lightbox.setAttribute("aria-hidden", "false");
          document.body.style.overflow = "hidden";
        });
      });

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", (e) => {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lightbox.classList.contains("open"))
        closeLightbox();
    });
  }

  /* ── Carousel ── */
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
      innerTimer = setTimeout(nextCarouselSlide, SINGLE_DELAY);
      return;
    }

    innerTimer = setInterval(() => {
      images[index].classList.remove("active");
      index += 1;
      if (index >= images.length) {
        clearInterval(innerTimer);
        setTimeout(nextCarouselSlide, SLIDE_DELAY);
        return;
      }
      images[index].classList.add("active");
    }, INNER_DELAY);
  }

  function nextCarouselSlide() {
    currentSlide = (currentSlide + 1) % slides.length;
    updateCarousel();
  }

  function prevCarouselSlide() {
    currentSlide = (currentSlide - 1 + slides.length) % slides.length;
    updateCarousel();
  }

  nextBtn?.addEventListener("click", nextCarouselSlide);
  prevBtn?.addEventListener("click", prevCarouselSlide);
  carousel.addEventListener(
    "touchstart",
    (event) => {
      startX = event.touches[0].clientX;
    },
    { passive: true },
  );
  carousel.addEventListener(
    "touchend",
    (event) => {
      const endX = event.changedTouches[0].clientX;
      if (startX - endX > 50) nextCarouselSlide();
      if (endX - startX > 50) prevCarouselSlide();
    },
    { passive: true },
  );

  updateCarousel();
});
