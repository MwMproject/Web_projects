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
  const counter = document.querySelector(".carousel-counter");

  if (!track || !slides.length || !carousel) return;

  let current = 0;
  let startX = 0;
  let autoTimer = null;
  const TOTAL = slides.length;
  const AUTO_DELAY = 4000;

  // Précharger toutes les images
  slides.forEach((slide) => {
    const img = slide.querySelector("img");
    if (img) { const p = new Image(); p.src = img.src; }
  });

  function goTo(index) {
    current = (index + TOTAL) % TOTAL;
    track.style.transform = `translateX(-${current * 100}%)`;
    if (counter) counter.textContent = `${current + 1} / ${TOTAL}`;
  }

  function next() { goTo(current + 1); }
  function prev() { goTo(current - 1); }

  function startAuto() {
    clearInterval(autoTimer);
    autoTimer = setInterval(next, AUTO_DELAY);
  }

  function resetAuto() {
    startAuto();
  }

  nextBtn?.addEventListener("click", () => { next(); resetAuto(); });
  prevBtn?.addEventListener("click", () => { prev(); resetAuto(); });

  // Swipe mobile
  carousel.addEventListener("touchstart", (e) => {
    startX = e.touches[0].clientX;
  }, { passive: true });

  carousel.addEventListener("touchend", (e) => {
    const diff = startX - e.changedTouches[0].clientX;
    if (diff > 50) { next(); resetAuto(); }
    if (diff < -50) { prev(); resetAuto(); }
  }, { passive: true });

  // Pause au hover
  carousel.addEventListener("mouseenter", () => clearInterval(autoTimer));
  carousel.addEventListener("mouseleave", startAuto);

  goTo(0);
  startAuto();
});
