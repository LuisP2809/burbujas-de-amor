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
