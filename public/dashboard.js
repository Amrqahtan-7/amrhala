async function loadBookings() {
  const tbody = document.getElementById('bookings-body');
  const totalCount = document.getElementById('total-count');

  try {
    const res = await fetch('/api/bookings');
    if (!res.ok) {
      tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Failed to load bookings.</td></tr>';
      return;
    }

    const { bookings } = await res.json();

    totalCount.textContent = `Total Bookings: ${bookings.length}`;

    if (!bookings || bookings.length === 0) {
      tbody.innerHTML = '<tr><td colspan="5" class="empty-row">No bookings yet.</td></tr>';
      return;
    }

    tbody.innerHTML = bookings.map((b, i) => {
      const submittedAt = new Date(b.created_at).toLocaleString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: false
      });

      const hour = parseInt(b.slot_time.split(':')[0]);
      const suffix = hour < 12 ? 'AM' : 'PM';
      const display = hour > 12 ? `${hour - 12}:00 ${suffix}` : `${hour}:00 ${suffix}`;

      return `
        <tr>
          <td>${bookings.length - i}</td>
          <td><strong>${escapeHtml(b.name)}</strong></td>
          <td>${escapeHtml(b.phone)}</td>
          <td><span class="slot-badge">${display}</span></td>
          <td>${submittedAt}</td>
        </tr>
      `;
    }).join('');

  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="loading-row">Error loading bookings.</td></tr>';
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

// Load on page open
loadBookings();

// Auto-refresh every 30 seconds
setInterval(loadBookings, 30000);
