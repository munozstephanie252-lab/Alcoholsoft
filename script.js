"use strict";

// CONFIGURACIÓN FÁCIL: cambia aquí las listas y límites sin modificar las validaciones.
const CONFIG = {
  maxNameLength: 80,
  maxEmailLength: 254,
  connectors: ["de", "del", "la", "las", "los", "y", "san", "santa"],
};

const form = document.getElementById("registrationForm");
const namesInput = document.getElementById("names");
const surnamesInput = document.getElementById("surnames");
const emailInput = document.getElementById("email");
const phoneInput = document.getElementById("phone");
const consentInput = document.getElementById("consent");
const consentGroup = document.getElementById("consentGroup");

const registrationSection = document.getElementById("registrationSection");
const successSection = document.getElementById("successSection");
const successSummary = document.getElementById("successSummary");
const modal = document.getElementById("confirmModal");
const modalSummary = document.getElementById("modalSummary");
const confirmButton = document.getElementById("confirmButton");
const correctButton = document.getElementById("correctButton");
const resetButton = document.getElementById("resetButton");

let lastValidData = null;

function collapseWhitespace(value) {
  return value.trim().replace(/\s+/g, " ");
}

function normalizeEmail(value) {
  const trimmed = value.trim();
  const at = trimmed.indexOf("@");
  if (at === -1) return trimmed;
  return trimmed.slice(0, at) + "@" + trimmed.slice(at + 1).toLowerCase();
}

function cleanPhone(value) {
  let cleaned = value.trim().replace(/[ \-]/g, "");
  if (cleaned.startsWith("+57")) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith("57")) cleaned = cleaned.slice(2);
  return cleaned;
}

function normalizePhone(value) {
  const cleaned = cleanPhone(value);
  return /^\d{10}$/.test(cleaned) && cleaned.startsWith("3")
    ? "+57" + cleaned
    : cleaned;
}

function setError(input, errorId, message) {
  const error = document.getElementById(errorId);
  error.textContent = message;
  input.classList.toggle("is-error", Boolean(message));
  input.setAttribute("aria-invalid", message ? "true" : "false");
  return Boolean(message);
}

function validateNames(value, kind) {
  let normalized = collapseWhitespace(value);
  if (!normalized) return { message: kind === "names"
    ? "Escribe tus nombres completos."
    : "Escribe tus apellidos completos.", normalized };
  if (normalized.length > CONFIG.maxNameLength) {
    return { message: "Reduce este dato a 80 caracteres como máximo.", normalized };
  }

  // Solo letras latinas, tildes, ñ, ü, espacios, guion y apóstrofe.
  if (!/^[\p{Script=Latin}\p{M}\s\-’']+$/u.test(normalized)) {
    return { message: "Usa solo letras, espacios, guion o apóstrofe.", normalized };
  }

  const words = normalized.split(" ");
  if (normalized.startsWith("-") || normalized.startsWith("'") || normalized.startsWith("’") ||
      normalized.endsWith("-") || normalized.endsWith("'") || normalized.endsWith("’")) {
    return { message: "Coloca el guion o apóstrofe dentro de una palabra.", normalized };
  }

  for (const word of words) {
    if (!/^[\p{Script=Latin}\p{M}]+(?:[\-’'][\p{Script=Latin}\p{M}]+)*$/u.test(word)) {
      return { message: "Usa el guion o apóstrofe solo entre letras.", normalized };
    }
    const letterCount = (word.match(/\p{L}/gu) || []).length;
    if (letterCount < 2) {
      return { message: "Escribe cada palabra completa, sin iniciales.", normalized };
    }
  }

  const lowerWords = words.map((word) => word.toLocaleLowerCase("es"));
  if (kind === "names" && CONFIG.connectors.includes(lowerWords[0])) {
    return { message: "Escribe un nombre real antes del conector.", normalized };
  }
  if (CONFIG.connectors.includes(lowerWords[lowerWords.length - 1])) {
    return { message: "Agrega un nombre o apellido después del conector.", normalized };
  }

  return { message: "", normalized };
}

function validateNameField(input, kind) {
  const result = validateNames(input.value, kind);
  input.value = result.normalized;
  setError(input, kind === "names" ? "namesError" : "surnamesError", result.message);
  return result.message === "";
}

function validateEmail(value) {
  const normalized = normalizeEmail(value.trim());
  if (!normalized) return { message: "Escribe tu correo electrónico.", normalized };
  if (/\s/.test(normalized)) return { message: "El correo no debe contener espacios.", normalized };
  if (normalized.length > CONFIG.maxEmailLength) {
    return { message: "Acorta el correo a 254 caracteres.", normalized };
  }
  if (!normalized.includes("@")) return { message: "Agrega el símbolo @ a tu correo.", normalized };
  if ((normalized.match(/@/g) || []).length > 1) {
    return { message: "Usa solamente un símbolo @ en el correo.", normalized };
  }

  const [local, domain] = normalized.split("@");
  if (!local) return { message: "Escribe el usuario antes del símbolo @.", normalized };
  if (!domain) return { message: "Escribe el dominio después del símbolo @.", normalized };

  if (!/^[A-Za-z0-9._+-]+$/.test(local) || /^\./.test(local) || /\.$/.test(local) || /\.{2}/.test(local)) {
    return { message: "Revisa las letras y símbolos antes del @.", normalized };
  }

  const labels = domain.split(".");
  if (labels.length < 2) return { message: "Incluye una extensión válida, como .com.", normalized };
  const extension = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(extension)) {
    return { message: "Incluye una extensión válida, como .com o .edu.co.", normalized };
  }

  const validDomain = labels.every((label) =>
    /^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/.test(label)
  );
  if (!validDomain) return { message: "Revisa la escritura del dominio de tu correo.", normalized };

  return { message: "", normalized };
}

function validateEmailField() {
  const result = validateEmail(emailInput.value);
  emailInput.value = result.normalized;
  setError(emailInput, "emailError", result.message);
  return result.message === "";
}

function validatePhoneField() {
  const cleaned = cleanPhone(phoneInput.value);
  phoneInput.value = cleaned;

  let message = "";
  if (!cleaned) {
    message = "Escribe tu número celular de Colombia.";
  } else if (!/^\d+$/.test(cleaned)) {
    message = "Usa solo números para tu celular colombiano.";
  } else if (cleaned.length !== 10 || !cleaned.startsWith("3")) {
    message = "Usa 10 dígitos y comienza con 3.";
  }

  setError(phoneInput, "phoneError", message);
  if (!message) phoneInput.value = "+57" + cleaned;
  return message === "";
}

function validateConsent(showMessage) {
  let message = "";
  if (!consentInput.checked) message = "Debes aceptar el tratamiento de tus datos para continuar.";
  consentGroup.classList.toggle("has-error", Boolean(message) && showMessage);
  consentInput.setAttribute("aria-invalid", message && showMessage ? "true" : "false");
  document.getElementById("consentError").textContent = showMessage ? message : "";
  return !message;
}

function clearErrorOnCorrection(input, validator) {
  if (!input.classList.contains("is-error") &&
      !(input === consentInput && consentGroup.classList.contains("has-error"))) return;
  validator();
}

namesInput.addEventListener("blur", () => validateNameField(namesInput, "names"));
surnamesInput.addEventListener("blur", () => validateNameField(surnamesInput, "surnames"));
emailInput.addEventListener("blur", validateEmailField);
phoneInput.addEventListener("blur", validatePhoneField);
consentInput.addEventListener("change", () => validateConsent(true));

namesInput.addEventListener("input", () => clearErrorOnCorrection(namesInput, () => validateNameField(namesInput, "names")));
surnamesInput.addEventListener("input", () => clearErrorOnCorrection(surnamesInput, () => validateNameField(surnamesInput, "surnames")));
emailInput.addEventListener("input", () => clearErrorOnCorrection(emailInput, validateEmailField));
phoneInput.addEventListener("input", () => clearErrorOnCorrection(phoneInput, validatePhoneField));

function buildSummary(container, data) {
  container.replaceChildren();
  const rows = [
    ["Nombres", data.names],
    ["Apellidos", data.surnames],
    ["Correo electrónico", data.email],
    ["Celular", data.phone],
    ["Consentimiento de tratamiento de datos", "Aceptado"],
  ];

  rows.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";
    const labelElement = document.createElement("span");
    labelElement.textContent = label + ":";
    const valueElement = document.createElement("strong");
    valueElement.textContent = value;
    row.append(labelElement, valueElement);
    container.append(row);
  });
}

function openModal(data) {
  lastValidData = data;
  buildSummary(modalSummary, data);
  modal.hidden = false;
  registrationSection.setAttribute("inert", "");
  confirmButton.disabled = false;
  confirmButton.textContent = "Confirmar e inscribirme";
  confirmButton.focus();
  document.body.style.overflow = "hidden";
}

function closeModal(returnToNames) {
  modal.hidden = true;
  registrationSection.removeAttribute("inert");
  document.body.style.overflow = "";
  if (returnToNames) namesInput.focus();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const namesValid = validateNameField(namesInput, "names");
  const surnamesValid = validateNameField(surnamesInput, "surnames");
  const emailValid = validateEmailField();
  const phoneValid = validatePhoneField();
  const consentValid = validateConsent(true);

  if (!namesValid) {
    namesInput.focus();
    return;
  }
  if (!surnamesValid) {
    surnamesInput.focus();
    return;
  }
  if (!emailValid) {
    emailInput.focus();
    return;
  }
  if (!phoneValid) {
    phoneInput.focus();
    return;
  }
  if (!consentValid) {
    consentInput.focus();
    return;
  }

  openModal({
    names: namesInput.value,
    surnames: surnamesInput.value,
    email: emailInput.value,
    phone: normalizePhone(phoneInput.value),
  });
});

correctButton.addEventListener("click", () => closeModal(true));

modal.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.preventDefault();
    closeModal(true);
    return;
  }

  if (event.key !== "Tab") return;
  const focusable = [confirmButton, correctButton].filter((element) => !element.disabled);
  if (!focusable.length) return;
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (event.shiftKey && document.activeElement === first) {
    event.preventDefault();
    last.focus();
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault();
    first.focus();
  }
});

confirmButton.addEventListener("click", () => {
  confirmButton.disabled = true;
  confirmButton.textContent = "Inscribiendo...";
  window.setTimeout(() => {
    closeModal(false);
    registrationSection.hidden = true;
    successSection.hidden = false;
    buildSummary(successSummary, lastValidData);
    successSection.querySelector("h2").focus?.();
    document.getElementById("successTitle").setAttribute("tabindex", "-1");
    document.getElementById("successTitle").focus();
  }, 350);
});

resetButton.addEventListener("click", () => {
  form.reset();
  [namesInput, surnamesInput, emailInput, phoneInput].forEach((input) => {
    input.value = "";
    input.classList.remove("is-error");
    input.setAttribute("aria-invalid", "false");
  });
  ["namesError", "surnamesError", "emailError", "phoneError", "consentError"].forEach((id) => {
    document.getElementById(id).textContent = "";
  });
  consentInput.checked = false;
  consentInput.setAttribute("aria-invalid", "false");
  consentGroup.classList.remove("has-error");
  document.getElementById("consentPolicy").open = false;
  successSection.hidden = true;
  registrationSection.hidden = false;
  namesInput.focus();
});
