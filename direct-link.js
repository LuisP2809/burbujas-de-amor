'use strict';

(() => {
  const rawName = new URLSearchParams(location.search).get('para');
  const hasPersonalizedName = Boolean(
    rawName && rawName.replace(/[<>]/g, '').trim().replace(/\s+/g, ' ')
  );

  if (!hasPersonalizedName || typeof HTMLDialogElement === 'undefined') return;

  const originalShowModal = HTMLDialogElement.prototype.showModal;
  let skipAutomaticWelcome = true;

  HTMLDialogElement.prototype.showModal = function showModalWithoutRepeatedWelcome() {
    if (skipAutomaticWelcome && this.id === 'welcome') {
      skipAutomaticWelcome = false;
      return;
    }

    return originalShowModal.call(this);
  };
})();

(() => {
  const form = document.getElementById('nameForm');
  if (!form) return;

  form.addEventListener('submit', event => {
    event.preventDefault();
    event.stopImmediatePropagation();

    const input = document.getElementById('nameInput');
    const selectedName = input?.value || 'Dally';

    if (typeof applyName === 'function') applyName(selectedName);

    const createButton = form.querySelector('button[type="submit"]');
    if (createButton) {
      const originalText = 'Crear sorpresa';
      createButton.textContent = 'Sorpresa creada ✓';
      window.setTimeout(() => {
        createButton.textContent = originalText;
      }, 1800);
    }
  }, true);
})();
