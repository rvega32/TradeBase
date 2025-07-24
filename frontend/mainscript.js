document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('serviceForm');
  const serviceList = document.getElementById('serviceList');

  if (!form || !serviceList) {
    console.error('Missing form or service list elements');
    return;
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

    // API endpoint stays /services — do NOT change this to home.html
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
      serviceList.appendChild(li);
    });
  }

  loadServices();
});