const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
  secret: 'tradebase-secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Serve static files (CSS, JS, etc)
app.use(express.static(path.join(__dirname, 'frontend')));

// Root route serves signup page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'signup.html'));
});

// Login page
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'login.html'));
});

// Services page (renamed to home.html) - require login
app.get('/home.html', (req, res) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  res.sendFile(path.join(__dirname, 'frontend', 'home.html'));
});

// Get current logged-in user info (for frontend)
app.get('/whoami', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json({ username: req.session.user.username, fullName: req.session.user.fullName });
});

// In-memory users and services
const users = [];
const services = [];

// Signup POST
app.post('/signup', (req, res) => {
  const { fullName, username, email, phone, password } = req.body;

  console.log('--- New Signup ---');
  console.log('Full Name:', fullName);
  console.log('Username:', username);
  console.log('Email:', email);
  console.log('Phone:', phone);
  console.log('Password:', password);

  if (!fullName || !username || !email || !phone || !password) {
    return res.status(400).send('All fields are required.');
  }
  if (users.find(u => u.username === username)) {
    return res.status(400).send('Username already in use.');
  }
  if (users.find(u => u.email === email)) {
    return res.status(400).send('Email already in use.');
  }
  if (users.find(u => u.phone === phone)) {
    return res.status(400).send('Phone number already in use.');
  }
  users.push({ fullName, username, email, phone, password });
  console.log('New user signed up:', username);
  res.redirect('/login');
});

// Login POST
app.post('/login', (req, res) => {
  const { loginId, password } = req.body;
  if (!loginId || !password) {
    return res.status(400).send('Username/email and password required.');
  }
  const user = users.find(u =>
    (u.username === loginId || u.email === loginId) && u.password === password
  );
  if (!user) {
    return res.status(401).send('Invalid credentials.');
  }
  req.session.user = { username: user.username, fullName: user.fullName };
  console.log('User logged in:', loginId);
  res.redirect('/home.html');
});

// Logout route
app.get('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

// Get all services (auth required)
app.get('/services', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  res.json(services);
});

// Post new service (auth required)
app.post('/services', (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  const { name, description, provider } = req.body;
  if (!name || !description || !provider) {
    return res.status(400).json({ error: 'All fields required' });
  }
  services.push({ name, description, provider });
  console.log('New service posted:', name, 'by', provider);
  res.status(201).json({ message: 'Service posted' });
});

// ======================
// 🗑 DELETE POST ROUTES
// ======================

// Admin-only delete (you)
app.delete('/admin/delete-post', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { username } = req.session.user;
  if (username !== 'RicardoVegaJr07102005*') {
    return res.status(403).json({ error: 'Only admin can use this route.' });
  }

  const { name, provider } = req.body;
  const index = services.findIndex(s => s.name === name && s.provider === provider);
  if (index === -1) {
    return res.status(404).json({ error: 'Service not found.' });
  }

  services.splice(index, 1);
  console.log(`Admin deleted service "${name}" by ${provider}`);
  res.json({ message: 'Service deleted by admin.' });
});

// User deletes own post
app.delete('/services/delete', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  const { username } = req.session.user;
  const { name } = req.body;

  const index = services.findIndex(s => s.name === name && s.provider === username);
  if (index === -1) {
    return res.status(404).json({ error: 'Service not found or not owned by user.' });
  }

  services.splice(index, 1);
  console.log(`User ${username} deleted their service "${name}"`);
  res.json({ message: 'Service deleted.' });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
