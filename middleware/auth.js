function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'] || '';

  if (!authHeader.startsWith('Basic ')) {
    res.set('WWW-Authenticate', 'Basic realm="amrhala Owner Dashboard"');
    return res.status(401).send('Authentication required');
  }

  const base64 = authHeader.slice('Basic '.length);
  const decoded = Buffer.from(base64, 'base64').toString('utf8');
  const colonIndex = decoded.indexOf(':');
  const username = decoded.slice(0, colonIndex);
  const password = decoded.slice(colonIndex + 1);

  const validUser = process.env.OWNER_USERNAME || 'amr2025';
  const validPass = process.env.OWNER_PASSWORD || 'amr2025@123';

  if (username === validUser && password === validPass) {
    return next();
  }

  res.set('WWW-Authenticate', 'Basic realm="amrhala Owner Dashboard"');
  return res.status(401).send('Invalid credentials');
}

module.exports = authMiddleware;
