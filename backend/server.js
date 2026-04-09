require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRouter = require('./routes/api');
const imageProxy = require('./routes/imageProxy');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: 'BriefAI is running', mode: process.env.DEMO_MODE === 'true' ? 'DEMO' : 'LIVE' });
});

app.use('/api', apiRouter);
app.use('/image', imageProxy);

app.listen(PORT, () => {
  const mode = process.env.DEMO_MODE === 'true' ? 'DEMO' : 'LIVE';
  console.log(`BriefAI backend running on port ${PORT} [${mode} mode]`);
});
