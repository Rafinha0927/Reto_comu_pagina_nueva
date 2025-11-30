const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Habilitar CORS globalmente
app.use(cors({
  origin: '*',
  methods: ['GET', 'HEAD', 'OPTIONS'],
  credentials: false
}));

// Proxy para CloudFront
app.use('/s3-proxy', createProxyMiddleware({
  target: 'https://d2h8nqd60uagyp.cloudfront.net',
  changeOrigin: true,
  pathRewrite: {
    '^/s3-proxy': ''
  },
  onProxyRes: (proxyRes) => {
    // Agregar headers CORS a la respuesta
    proxyRes.headers['Access-Control-Allow-Origin'] = '*';
    proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, HEAD, OPTIONS';
    proxyRes.headers['Access-Control-Allow-Headers'] = '*';
    proxyRes.headers['Access-Control-Max-Age'] = '3000';
  },
  onError: (err, req, res) => {
    console.error('Proxy error:', err);
    res.status(500).json({ error: 'Proxy error: ' + err.message });
  }
}));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Proxy CORS para CloudFront activo' });
});

app.listen(PORT, () => {
  console.log(`✓ Proxy CORS escuchando en http://localhost:${PORT}`);
  console.log(`✓ Proxy para S3/CloudFront disponible en http://localhost:${PORT}/s3-proxy`);
});
