/**
 * Server entry point - starts the Express application
 * Configures port and starts listening for HTTP requests
 */
import {app} from './app.js';
import dotenv from 'dotenv';
dotenv.config();

// Backend API and Frontend run on port 4000 (single server)
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Roastery Management System running on http://localhost:${PORT}`);
  console.log(`API: http://localhost:${PORT}/api/`);
  console.log(`Frontend: http://localhost:${PORT}/`);
});