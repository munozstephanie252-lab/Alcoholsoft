// Todas las reglas y mensajes fáciles de ajustar están juntas en esta sección.
const CONFIG = {
  maxNamesLength: 80,
  maxEmailLength: 254,
  connectors: ["de", "del", "la", "las", "los", "y", "san", "santa"],
  messages: {
    required: "Escribe la información solicitada para continuar.",
    namesLetters: "Usa letras y separadores válidos, sin números ni símbolos.",
    namesWordLength: "Escribe cada nombre completo; no uses iniciales.",
    namesConnector: "Completa el conector para evitar dejarlo solo o al final.",
    namesStart: "Escribe un nombre antes del conector al inicio.",
    surnameWordLength: "Escribe cada apellido completo; no uses iniciales.",
    surnameLetters: "Usa letras y separadores válidos, sin números ni símbolos.",
    surnameConnector: "Completa el conector para evitar dejarlo solo o al final.",
    emailEmpty: "Escribe tu correo electrónico.",
    emailSpaces: "El correo no debe tener espacios internos.",
    emailAtMissing: "Agrega el símbolo @ a tu correo.",
    emailAtMany: "Usa solo un símbolo @ en tu correo.",
    emailUserMissing: "Escribe el usuario antes del símbolo @.",
    emailDomainMissing: "Escribe el dominio después del símbolo @.",
    emailUserChars: "Usa letras, números, punto, guion bajo, guion o más.",
    emailTooLong: "Acorta tu correo; puede tener máximo 254 caracteres.",
    emailDomainFormat: "Escribe un dominio válido, por ejemplo gmail.com.",
    emailExtension: "Agrega una extensión válida de mínimo dos letras.",
    phoneFormat: "Escribe solo un celular colombiano válido de 10 dígitos.",
    phoneStart: "El celular debe comenzar por 3.",
    consent: "Debes aceptar el tratamiento de tus datos para continuar.",
  }
};

const form = document.querySelector("#registrationForm");
const registrationView = document.querySelector("#registrationView");
const successView = document.querySelector("#successView");
const modal = document.querySelector("#confirmationModal");
const modalPanel = modal.querySelector(".modal");
const confirmButton = document.querySelector("#confirmButton");
const correctButton = document.querySelector("#correctButton");
const resetButton = document.querySelector("#resetButton");

const fields = {
  names: {
    input: document.querySelector("#names"),
    field: document.querySelector("#namesField"),
    error: document.querySelector("#namesError")
  },
  surnames: {
    input: document.querySelector("#surnames"),
    field: document.querySelector("#surnamesField"),
    error: document.querySelector("#surnamesError")
  },
  email: {
    input: document.querySelector("#email"),
    field: document.querySelector("#emailField"),
    error: document.querySelector("#emailError")
  },
  phone: {
    input: document.querySelector("#phone"),
    field: document.querySelector("#phoneField"),
    error: document.querySelector("#phoneError")
  },
  consent: {
    input: document.querySelector("#consent"),
    field: document.querySelector("#consentField"),
    error: document.querySelector("#consentError")
  }
};

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ");
}

function setError(key, message) {
  const item = fields[key];
  item.error.textContent = message || "";

  if (key === "consent") {
    item.field.classList.toggle("invalid", Boolean(message));
  } else {
    item.input.classList.toggle("invalid", Boolean(message));
  }

  if (key === "consent") {
    item.input.setAttribute("aria-invalid", message ? "true" : "false");
  } else {
    item.input.setAttribute("aria-invalid", message ? "true" : "false");
  }
}

function validateName(value, kind) {
  const normalized = normalizeText(value);
  if (!normalized) return CONFIG.messages.required;
  if (normalized.length > CONFIG.maxNamesLength) {
    return `Usa máximo ${CONFIG.maxNamesLength} caracteres para este dato.`;
  }

  // Permite letras latinas y las tildes separadas Unicode, pero rechaza emoji y otros símbolos.
  if (!/^[A-Za-zÀ-ÖØ-öø-ÿĀ-žƀ-ɏḀ-ỿ\u1E00-\u1EFF\p{M}\s'-]+$/u.test(normalized)) {
    return kind === "names" ? CONFIG.messages.namesLetters : CONFIG.messages.surnameLetters;
  }

  if (/^[-']|[-']$/.test(normalized) || /[-']{2}/.test(normalized)) {
    return kind === "names" ? CONFIG.messages.namesLetters : CONFIG.messages.surnameLetters;
  }

  const words = normalized.split(/\s+/);
  for (const word of words) {
    if (CONFIG.connectors.includes(word.toLowerCase())) continue;

    // Los apóstrofes pueden iniciar una forma como D'Angelo.
    const parts = word.split(/[-']/);
    const meaningfulParts = parts.filter(part => part.length > 0);
    if (meaningfulParts.length === 0) {
      return kind === "names" ? CONFIG.messages.namesWordLength : CONFIG.messages.surnameWordLength;
    }
    for (let i = 0; i < meaningfulParts.length; i++) {
      const letters = meaningfulParts[i].match(/\p{L}/gu) || [];
      if (letters.length < 2 && !(i === 0 && word.includes("'") && letters.length === 1)) {
        return kind === "names" ? CONFIG.messages.namesWordLength : CONFIG.messages.surnameWordLength;
      }
    }
  }

  if (kind === "names" && CONFIG.connectors.includes(words[0].toLowerCase())) {
    return CONFIG.messages.namesStart;
  }

  for (let i = 0; i < words.length - 1; i++) {
    if (CONFIG.connectors.includes(words[i].toLowerCase()) &&
        CONFIG.connectors.includes(words[i + 1].toLowerCase())) {
      return kind === "names" ? CONFIG.messages.namesConnector : CONFIG.messages.surnameConnector;
    }
  }

  if (CONFIG.connectors.includes(words[words.length - 1].toLowerCase())) {
    return kind === "names" ? CONFIG.messages.namesConnector : CONFIG.messages.surnameConnector;
  }

  // Un conector nunca puede formar solo todo el texto.
  if (words.length === 1 && CONFIG.connectors.includes(words[0].toLowerCase())) {
    return kind === "names" ? CONFIG.messages.namesConnector : CONFIG.messages.surnameConnector;
  }

  return "";
}

function validateEmail(value) {
  const normalized = value.trim();
  if (!normalized) return CONFIG.messages.emailEmpty;
  if (/\s/.test(normalized)) return CONFIG.messages.emailSpaces;
  if (normalized.length > CONFIG.maxEmailLength) return CONFIG.messages.emailTooLong;

  const atCount = (normalized.match(/@/g) || []).length;
  if (atCount === 0) return CONFIG.messages.emailAtMissing;
  if (atCount > 1) return CONFIG.messages.emailAtMany;

  const parts = normalized.split("@");
  const local = parts[0];
  const domain = parts[1];

  if (!local) return CONFIG.messages.emailUserMissing;
  if (!domain) return CONFIG.messages.emailDomainMissing;
  if (!/^[A-Za-z0-9._+-]+$/.test(local)) return CONFIG.messages.emailUserChars;

  const domainNormalized = domain.toLowerCase();
  if (!domainNormalized.includes(".")) return CONFIG.messages.emailExtension;
  if (!/^[A-Za-z0-9.-]+\.[A-Za-z0-9-]+$/.test(domainNormalized)) {
    return CONFIG.messages.emailDomainFormat;
  }

  const labels = domainNormalized.split(".");
  if (labels.some(label => !label || label.startsWith("-") || label.endsWith("-"))) {
    return CONFIG.messages.emailDomainFormat;
  }

  const extension = labels[labels.length - 1];
  if (!/^[A-Za-z]{2,}$/.test(extension)) return CONFIG.messages.emailExtension;

  return "";
}

function normalizeEmail(value) {
  const normalized = value.trim();
  const parts = normalized.split("@");
  return parts.length === 2
    ? `${parts[0]}@${parts[1].toLowerCase()}`
    : normalized;
}

function normalizePhone(value) {
  if (!/^[0-9+\s-]+$/.test(value)) return null;

  let digits = value.replace(/[\s-]/g, "");
  if (digits.startsWith("+57")) digits = digits.slice(3);
  else if (digits.startsWith("57")) digits = digits.slice(2);

  if (!/^\d+$/.test(digits)) return null;
  return digits;
}

function validatePhone(value) {
  const cleaned = normalizePhone(value);
  if (!cleaned) return CONFIG.messages.phoneFormat;
  if (cleaned.length !== 10) return CONFIG.messages.phoneStart;
  if (!cleaned.startsWith("3")) return CONFIG.messages.phoneStart;
  return "";
}

function formatPhone(value) {
  const digits = normalizePhone(value);
  return digits ? `+57${digits}` : "";
}

function validateConsent() {
  return fields.consent.input.checked ? "" : CONFIG.messages.consent;
}

function validateField(key) {
  let message = "";
  if (key === "names") message = validateName(fields.names.input.value, "names");
  if (key === "surnames") message = validateName(fields.surnames.input.value, "surnames");
  if (key === "email") message = validateEmail(fields.email.input.value);
  if (key === "phone") message = validatePhone(fields.phone.input.value);
  if (key === "consent") message = validateConsent();
  setError(key, message);
  return message;
}

["names", "surnames", "email", "phone"].forEach(key => {
  const input = fields[key].input;
  input.addEventListener("blur", () => validateField(key));
  input.addEventListener("input", () => {
    if (input.classList.contains("invalid")) validateField(key);
  });
});

fields.consent.input.addEventListener("change", () => validateField("consent"));

form.addEventListener("submit", event => {
  event.preventDefault();

  const keyOrder = ["names", "surnames", "email", "phone", "consent"];
  keyOrder.forEach(key => validateField(key));

  const firstError = keyOrder.find(key => fields[key].error.textContent);
  if (firstError) {
    fields[firstError].input.focus();
    return;
  }

  // Las cajas quedan limpias y normalizadas antes de mostrar la confirmación.
  fields.names.input.value = normalizeText(fields.names.input.value);
  fields.surnames.input.value = normalizeText(fields.surnames.input.value);
  fields.email.input.value = normalizeEmail(fields.email.input.value);
  fields.phone.input.value = formatPhone(fields.phone.input.value);
  showConfirmation();
});

function createSummary(parent, data) {
  parent.replaceChildren();
  data.forEach(([label, value]) => {
    const row = document.createElement("div");
    row.className = "summary-row";

    const labelElement = document.createElement("span");
    labelElement.textContent = `${label}:`;

    const valueElement = document.createElement("strong");
    valueElement.textContent = value;

    row.append(labelElement, valueElement);
    parent.append(row);
  });
}

function getCurrentData() {
  return [
    ["Nombres", fields.names.input.value],
    ["Apellidos", fields.surnames.input.value],
    ["Correo electrónico", fields.email.input.value],
    ["Celular", formatPhone(fields.phone.input.value)],
    ["Consentimiento de tratamiento de datos", "Aceptado"]
  ];
}

function showConfirmation() {
  createSummary(document.querySelector("#confirmationSummary"), getCurrentData());
  confirmButton.disabled = false;
  modal.hidden = false;
  document.body.classList.add("modal-open");
  modalPanel.focus();
}

function closeConfirmation() {
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  fields.names.input.focus();
}

correctButton.addEventListener("click", closeConfirmation);

document.addEventListener("keydown", event => {
  if (event.key === "Escape" && !modal.hidden) {
    event.preventDefault();
    closeConfirmation();
  }

  if (event.key === "Tab" && !modal.hidden) {
    const buttons = [confirmButton, correctButton].filter(button => !button.disabled);
    if (buttons.length === 0) return;

    const first = buttons[0];
    const last = buttons[buttons.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

confirmButton.addEventListener("click", () => {
  if (confirmButton.disabled) return;
  confirmButton.disabled = true;

  createSummary(document.querySelector("#successSummary"), getCurrentData());
  modal.hidden = true;
  document.body.classList.remove("modal-open");
  registrationView.hidden = true;
  successView.hidden = false;
  document.querySelector("#successTitle").focus?.();
  window.scrollTo({ top: 0, behavior: "smooth" });
});

resetButton.addEventListener("click", () => {
  form.reset();
  document.querySelectorAll(".field-error").forEach(error => {
    error.textContent = "";
  });
  document.querySelectorAll(".invalid").forEach(element => {
    element.classList.remove("invalid");
  });
  document.querySelectorAll('[aria-invalid="true"]').forEach(element => {
    element.setAttribute("aria-invalid", "false");
  });
  document.querySelector(".policy").open = false;
  successView.hidden = true;
  registrationView.hidden = false;
  fields.names.input.focus();
});
