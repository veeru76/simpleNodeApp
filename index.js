const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Parse JSON request bodies
app.use(express.json());

// Request logger middleware - logs every incoming request
app.use((req, res, next) => {
  const start = Date.now();
  const timestamp = new Date().toISOString();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`[${timestamp}] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
  });

  next();
});

// Health check - Load balancers and Kubernetes hit this to check if the app is alive
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Original route
app.get('/hello', (req, res) => {
  res.send('Hello World');
});

// API Routes
app.get('/api/users', (req, res) => {
  const users = [
    { id: 1, name: 'Alice', role: 'developer' },
    { id: 2, name: 'Bob', role: 'designer' },
    { id: 3, name: 'Charlie', role: 'devops' }
  ];
  res.json(users);
});

app.get('/api/users/:id', (req, res) => {
  const users = [
    { id: 1, name: 'Alice', role: 'developer' },
    { id: 2, name: 'Bob', role: 'designer' },
    { id: 3, name: 'Charlie', role: 'devops' }
  ];
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/status', (req, res) => {
  res.json({
    app: 'simple-cicd-app',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    uptime: `${Math.floor(process.uptime())} seconds`
  });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
