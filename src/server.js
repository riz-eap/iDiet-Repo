import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import authRouter from './routes.auth.js';

const app = express();

// CORS for your frontend
app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',').map(s => s.trim()) || true,
  credentials: true
}));

app.use(helmet());
app.use(express.json());
app.use(cookieParser());

// Health check
app.get('/health', (req, res) => res.json({ ok: true, service: 'AI Diet Planner Auth' }));

// Auth routes
app.use('/auth', authRouter);

// 404
app.use((req, res) => res.status(404).json({ error: 'Not found' }));

const port = process.env.PORT || 8080;
app.listen(port, () => {
  console.log(`Auth server listening on http://localhost:${port}`);
});
