import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;
  const isProd = process.env.NODE_ENV === "production";

  console.log(`Starting server in ${isProd ? 'production' : 'development'} mode...`);

  // API routes go here
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  if (!isProd) {
    console.log("Initializing Vite middleware...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    console.log(`Serving static files from: ${distPath}`);
    
    // Serve static assets
    app.use(express.static(distPath, { index: false }));
    
    // Fallback to index.html for SPA routing
    app.get('*', (req, res) => {
      const indexPath = path.join(distPath, 'index.html');
      console.log(`Serving index.html for: ${req.url}`);
      res.sendFile(indexPath);
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
