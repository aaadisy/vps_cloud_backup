const express = require('express');
const router = express.Router();
const { loginUser, refreshAuth } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/login', loginUser);
router.post('/refresh', protect, refreshAuth);

module.exports = router;
