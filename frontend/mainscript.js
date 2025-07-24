document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('serviceForm');
  const serviceList = document.getElementById('serviceList');

  const adminUsername = 'RicardoVegaJr07102005*';

  if (!form || !serviceList) {
    console.error('Missing form or service list elements');
    return;
  }

  // Get logged-in username from backend session
  async function getCurrentUser() {
    try {
      const res = await fetch('/whoami');
      if (!res.ok) throw new Error('Not logged in');
      const data = await res.json();
      return data.username;
    } catch {
      return null;
    }
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const name = form.name.value.trim();
    const description = form.description.value.trim();
    const provider = form.provider.value.trim();

    if (!name || !description || !provider) {
      alert('All fields are required!');
      return;
    }

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
    const currentUser = await getCurrentUser();
    if (!currentUser) {
      alert('Please login first.');
      window.location.href = '/login';
      return;
    }

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

      // Show delete button if admin or owner
      if (currentUser === service.provider || currentUser === adminUsername) {
        const deleteBtn = document.createElement('button');
        deleteBtn.textContent = 'Delete';
        deleteBtn.style.marginTop = '10px';
        deleteBtn.addEventListener('click', async () => {
          if (!confirm('Are you sure you want to delete this post?')) return;

          // Since backend expects name and provider in body for delete, send accordingly
          const delRes = await fetch(currentUser === adminUsername ? '/admin/delete-post' : '/services/delete', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: service.name, provider: service.provider }),
          });

          if (delRes.ok) {
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
