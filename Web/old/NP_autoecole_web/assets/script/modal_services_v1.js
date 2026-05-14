// MODAL SERVICES
const modal = document.querySelector(".service-modal");
const modalBody = document.querySelector(".modal-body");
const closeBtn = document.querySelector(".modal-close");

document.querySelectorAll(".toggle-card").forEach((btn) => {
  btn.addEventListener("click", () => {
    const card = btn.closest(".card");
    const details = card.querySelector(".card-details").innerHTML;

    modalBody.innerHTML = details;
    modal.classList.add("active");

    document.body.style.overflow = "hidden";
  });
});

closeBtn.addEventListener("click", () => {
  modal.classList.remove("active");
  document.body.style.overflow = "";
});

modal.addEventListener("click", (e) => {
  if (e.target === modal) {
    modal.classList.remove("active");
    document.body.style.overflow = "";
  }
});
