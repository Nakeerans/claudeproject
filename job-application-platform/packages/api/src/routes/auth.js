const express = require('express');
const router = express.Router();

router.post('/login', (req, res) => {
  res.json({ success: true, message: 'Auth endpoint - TODO: Implement' });
});

router.post('/register', (req, res) => {
  res.json({ success: true, message: 'Auth endpoint - TODO: Implement' });
});

module.exports = router;
