const toggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");
if (toggle) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
  });
}
document.querySelectorAll("[data-modal]").forEach((button) =>
  button.addEventListener("click", () => {
    const modal = document.getElementById(button.dataset.modal);
    modal.classList.add("open");
    modal.setAttribute("aria-hidden", "false");
    modal.querySelector(".modal-close").focus();
  }),
);
document.querySelectorAll(".modal").forEach((modal) => {
  const close = () => {
    modal.classList.remove("open");
    modal.setAttribute("aria-hidden", "true");
  };
  modal.querySelector(".modal-close")?.addEventListener("click", close);
  modal.addEventListener("click", (e) => {
    if (e.target === modal) close();
  });
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape")
    document.querySelectorAll(".modal.open").forEach((m) => {
      m.classList.remove("open");
      m.setAttribute("aria-hidden", "true");
    });
});
document.querySelectorAll(".contact-form").forEach((form) =>
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const d = new FormData(form);
    location.href = `mailto:info@mabasi.com?subject=${encodeURIComponent("Website enquiry from " + d.get("first"))}&body=${encodeURIComponent(d.get("message") + "\n\n" + d.get("first") + " " + d.get("last") + "\n" + d.get("email") + "\n" + (d.get("phone") || ""))}`;
  }),
);
