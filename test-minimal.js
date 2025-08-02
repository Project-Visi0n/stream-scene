const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Minimal test server works!' });
});

app.listen(8000, () => {
  console.log('Test server running on http://localhost:8000');
});
