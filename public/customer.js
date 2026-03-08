(async function () {
  const form = document.getElementById('booking-form');
  const slotSelect = document.getElementById('slot');
  const submitBtn = document.getElementById('submit-btn');
  const formError = document.getElementById('form-error');
  const successCard = document.getElementById('success-card');
  const bookingCard = document.getElementById('booking-card');
  const successMessage = document.getElementById('success-message');
  const noSlots = document.getElementById('no-slots');

  // Load available slots
  try {
    const res = await fetch('/api/slots');
    const { slots } = await res.json();

    slotSelect.innerHTML = '';

    if (!slots || slots.length === 0) {
      bookingCard.classList.add('hidden');
      noSlots.classList.remove('hidden');
      return;
    }

    const placeholder = document.createElement('option');
    placeholder.value = '';
    placeholder.disabled = true;
    placeholder.selected = true;
    placeholder.textContent = 'Choose a time slot';
    slotSelect.appendChild(placeholder);

    slots.forEach(slot => {
      const opt = document.createElement('option');
      opt.value = slot;
      const hour = parseInt(slot.split(':')[0]);
      const suffix = hour < 12 ? 'AM' : 'PM';
      const display = hour > 12 ? `${hour - 12}:00 ${suffix}` : `${hour}:00 ${suffix}`;
      opt.textContent = display;
      slotSelect.appendChild(opt);
    });
  } catch (err) {
    slotSelect.innerHTML = '<option value="" disabled selected>Could not load times</option>';
  }

  // Validation helpers
  function showError(fieldId, message) {
    const el = document.getElementById(fieldId + '-error');
    const input = document.getElementById(fieldId);
    if (el) el.textContent = message;
    if (input) input.classList.add('error');
  }

  function clearError(fieldId) {
    const el = document.getElementById(fieldId + '-error');
    const input = document.getElementById(fieldId);
    if (el) el.textContent = '';
    if (input) input.classList.remove('error');
  }

  function clearAllErrors() {
    ['name', 'phone', 'slot'].forEach(clearError);
    formError.textContent = '';
    formError.classList.remove('visible');
  }

  function validatePhone(phone) {
    return /^[+]?[\d\s\-()]{7,20}$/.test(phone.trim());
  }

  // Form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearAllErrors();

    const name = document.getElementById('name').value.trim();
    const phone = document.getElementById('phone').value.trim();
    const slotTime = slotSelect.value;

    let valid = true;

    if (!name) {
      showError('name', 'Please enter your name.');
      valid = false;
    }

    if (!phone) {
      showError('phone', 'Please enter your phone number.');
      valid = false;
    } else if (!validatePhone(phone)) {
      showError('phone', 'Please enter a valid phone number.');
      valid = false;
    }

    if (!slotTime) {
      showError('slot', 'Please select a time slot.');
      valid = false;
    }

    if (!valid) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Confirming...';

    try {
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, slotTime })
      });

      const data = await res.json();

      if (res.ok && data.success) {
        const hour = parseInt(slotTime.split(':')[0]);
        const suffix = hour < 12 ? 'AM' : 'PM';
        const display = hour > 12 ? `${hour - 12}:00 ${suffix}` : `${hour}:00 ${suffix}`;
        successMessage.textContent = `Thank you, ${name}! Your table is reserved for ${display}. We look forward to seeing you at amrhala.`;
        bookingCard.classList.add('hidden');
        successCard.classList.remove('hidden');
      } else {
        formError.textContent = data.error || 'Something went wrong. Please try again.';
        formError.classList.add('visible');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Booking';
      }
    } catch (err) {
      formError.textContent = 'Network error. Please check your connection and try again.';
      formError.classList.add('visible');
      submitBtn.disabled = false;
      submitBtn.textContent = 'Confirm Booking';
    }
  });
})();
