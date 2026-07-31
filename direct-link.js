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
  const createButton = document.getElementById('createSurprise');
  const input = document.getElementById('nameInput');

  if (!createButton || !input) return;

  createButton.addEventListener('click', () => {
    const selectedName = input.value || 'Dally';

    if (typeof applyName === 'function') applyName(selectedName);

    createButton.textContent = 'Sorpresa creada ✓';
    window.setTimeout(() => {
      createButton.textContent = 'Crear sorpresa';
    }, 1800);
  });
})();
