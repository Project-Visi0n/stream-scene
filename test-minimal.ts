import express from 'express';

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Minimal TypeScript server works!' });
});

app.listen(8000, () => {
  console.log('Test TypeScript server running on http://localhost:8000');
});
