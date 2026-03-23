const jwt = require('jsonwebtoken');
const User = require('../models/User');
const ActivityLog = require('../models/Log');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d'
  });
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });

    if (user && (await user.comparePassword(password))) {
      await ActivityLog.create({
        user_id: user.id,
        action: 'LOGIN',
        description: `User logged in from ${req.ip}`
      });

      res.json({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        token: generateToken(user.id)
      });
    } else {
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const refreshAuth = async (req, res) => {
  // Simple refresh logic for this internal tool
  if (req.user) {
    res.json({
      token: generateToken(req.user.id)
    });
  } else {
    res.status(401).json({ message: 'Session expired' });
  }
};

module.exports = { loginUser, refreshAuth };
