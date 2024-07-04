const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Enable CORS with credentials
app.use(cors({
  origin: 'http://localhost:3000', // Replace with your React app's URL
  credentials: true
}));

app.use(express.json());

app.post('/estimate', (req, res) => {
  const { accessories, good_client } = req.body;

  const charactersCount = accessories.reduce((sum, acc) => sum + acc.replace(/\s+/g, '').length, 0);
  const baseEstimation = charactersCount * 3 + Math.floor(Math.random() * 90) + 1;

  let estimation;
  if (good_client) {
    const discountFactor = Math.random() * (4 - 2) + 2;
    estimation = Math.round(baseEstimation / discountFactor);
  } else {
    estimation = Math.round(baseEstimation);
  }

  res.json({ estimation });
});

app.listen(PORT, () => {
  console.log(`Estimation server is running on http://localhost:${PORT}`);
});
