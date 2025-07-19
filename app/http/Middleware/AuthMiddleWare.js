const jwt = require('jsonwebtoken');
const SECRET_KEY = process.env.ACCESS_TOKEN_SECRET;

function AuthMiddleware(req, res, next) {
  const authorization = req.headers.authorization;
  if (!authorization) {
    return res.status(401).json({
      message: 'No Authorization Header',
    });
  }

  try {
    const token = authorization.split('Bearer ')[1];
    if (!token) {
      return res.status(401).json({
        message: 'Invalid Token Format',
      });
    }

    // ✅ Vérification et injection du user dans req
    const decoded = jwt.verify(token, SECRET_KEY);
    req.user = decoded; // contient par exemple userId ou role selon le token

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        message: 'Session Expired',
        error: error.message,
      });
    }

    if (
      error instanceof jwt.JsonWebTokenError ||
      error.name === 'TokenError'
    ) {
      return res.status(401).json({
        message: 'Invalid Token',
        error: error.message,
      });
    }

    res.status(500).json({
      message: 'Internal Server Error',
      error: error.message,
      stack: error.stack,
    });
  }
}

module.exports = AuthMiddleware;
