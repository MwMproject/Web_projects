const contactForm = document.querySelector(".contact-form");

if (contactForm) {
  const tokenInput = contactForm.querySelector('[name="csrf_token"]');
  const submitButton = contactForm.querySelector('button[type="submit"]');
  const status = contactForm.querySelector(".form-security-status");

  async function prepareContactForm() {
    submitButton.disabled = true;

    try {
      const response = await fetch("contact.php?action=token", {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (!response.ok) throw new Error("Token indisponible");
      const data = await response.json();
      if (!data.token) throw new Error("Token invalide");

      tokenInput.value = data.token;
      submitButton.disabled = false;
      status.textContent = "";
    } catch (_error) {
      status.textContent = "Le formulaire est momentanément indisponible. Vous pouvez nous écrire à h2o@hschumacher.ch.";
    }
  }

  prepareContactForm();
}
