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

  /* ── Portfolio grid filters + pagination ── */
  const projectFilterBtns = document.querySelectorAll(".project-filter");
  const projectImages = Array.from(document.querySelectorAll(".project-grid img"));
  const projectPagerBtns = document.querySelectorAll(".project-pager-btn");
  const projectDotsContainer = document.querySelector(".project-dots");
  const PROJECT_PAGE_SIZE = 12;

  if (projectImages.length) {
    let currentFilter = "all";
    let currentPage = 0;

    function filteredImages() {
      return projectImages.filter(
        (img) => currentFilter === "all" || img.dataset.category === currentFilter,
      );
    }

    function renderProjectGrid() {
      const filtered = filteredImages();
      const totalPages = Math.max(1, Math.ceil(filtered.length / PROJECT_PAGE_SIZE));
      currentPage = Math.min(currentPage, totalPages - 1);
      const start = currentPage * PROJECT_PAGE_SIZE;
      const visible = new Set(filtered.slice(start, start + PROJECT_PAGE_SIZE));

      projectImages.forEach((img) => img.classList.toggle("is-hidden", !visible.has(img)));

      projectDotsContainer.innerHTML = "";
      for (let i = 0; i < totalPages; i++) {
        const dot = document.createElement("button");
        dot.className = "project-dot" + (i === currentPage ? " active" : "");
        dot.setAttribute("aria-label", `Page ${i + 1}`);
        dot.addEventListener("click", () => {
          currentPage = i;
          renderProjectGrid();
        });
        projectDotsContainer.appendChild(dot);
      }
    }

    projectFilterBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        currentFilter = btn.dataset.filter;
        currentPage = 0;
        projectFilterBtns.forEach((b) => b.classList.toggle("active", b === btn));
        renderProjectGrid();
      });
    });

    projectPagerBtns.forEach((btn) => {
      btn.addEventListener("click", () => {
        const totalPages = Math.max(1, Math.ceil(filteredImages().length / PROJECT_PAGE_SIZE));
        currentPage = (currentPage + Number(btn.dataset.dir) + totalPages) % totalPages;
        renderProjectGrid();
      });
    });

    renderProjectGrid();
  }

  /* ── Lightbox ── */
  const lightbox = document.getElementById("lightbox");
  const lightboxImg = lightbox?.querySelector("img");
  const lightboxClose = lightbox?.querySelector(".lightbox-close");

  if (lightbox && lightboxImg) {
    document
      .querySelectorAll(".project-grid img")
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

});
