document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('serviceForm');
  const serviceList = document.getElementById('serviceList');

  // Admin username you gave me
  const ADMIN_USERNAME = 'RicardoVegaJr07102005*';

  // Get current logged-in username from localStorage (set after login or post)
  let currentUser = localStorage.getItem('username');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const description = form.description.value.trim();
    const provider = form.provider.value.trim();

    if (!name || !description || !provider) {
      alert('All fields are required!');
      return;
    }

    // Save provider as current user in localStorage for this example
    localStorage.setItem('username', provider);
    currentUser = provider;

    const response = await fetch('/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, description, provider }),
    });

    if (response.ok) {
      form.reset();
      loadServices();
    } else if (response.status === 401) {
      alert('You must be logged in to post.');
      window.location.href = '/login';
    } else {
      alert('Failed to post service.');
    }
  });

  async function loadServices() {
    const res = await fetch('/services');
    if (res.status === 401) {
      alert('Please login first.');
      window.location.href = '/login';
      return;
    }
    const services = await res.json();

    serviceList.innerHTML = '';

    services.forEach(service => {
      const li = document.createElement('li');
      li.className = 'service-card';
      li.innerHTML = `
        <h3>${service.name}</h3>
        <p><strong>Description:</strong> ${service.description}</p>
        <p><strong>Provider:</strong> ${service.provider}</p>
      `;

      // Show Delete button ONLY if current user is admin or the post owner
      if (currentUser === service.provider || currentUser === ADMIN_USERNAME) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginTop = '10px';
        deleteBtn.addEventListener('click', async () => {
          if (!confirm(`Are you sure you want to delete "${service.name}"?`)) return;

          // Delete request to backend - using service name & provider (adjust if your backend expects ID)
          const delResponse = await fetch('/services/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: service.name, provider: service.provider }),
          });

          if (delResponse.ok) {
            loadServices();
          } else {
            alert('Failed to delete service.');
          }
        });
        li.appendChild(deleteBtn);
      }

      serviceList.appendChild(li);
    });
  }

  loadServices();
});
