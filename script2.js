document.addEventListener("DOMContentLoaded", function () {
  // Detecta cada vez que se escribe algo
  document.addEventListener("input", function (e) {
    const target = e.target;

    // Solo aplicar si el elemento permite entrada de texto
    const isTextInput =
      target.tagName === "INPUT" ||
      target.tagName === "TEXTAREA" ||
      target.isContentEditable;

    if (isTextInput) {
      // Reemplaza caracteres incorrectos
      target.value = target.value
        .replace(/'/g, "-")  // Reemplaza apóstrofe por guion normal
        .replace(/\?/g, "_"); // Reemplaza ? por guion bajo
    }
  });
});

