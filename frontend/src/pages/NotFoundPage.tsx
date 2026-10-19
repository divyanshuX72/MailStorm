/**
 * 404 — Not Found Page
 */

import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(var(--background))] p-4 gradient-auth">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center"
      >
        <h1 className="mb-2 text-8xl font-black text-[hsl(var(--primary)/0.2)]">404</h1>
        <h2 className="mb-2 text-2xl font-bold text-[hsl(var(--foreground))]">Page not found</h2>
        <p className="mb-8 text-[hsl(var(--muted-foreground))]">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 rounded-xl gradient-primary px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-[hsl(var(--primary)/0.3)] hover:opacity-90"
          >
            <Home className="h-4 w-4" /> Go to Dashboard
          </Link>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 rounded-xl border border-[hsl(var(--border))] px-5 py-2.5 text-sm font-medium text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
          >
            <ArrowLeft className="h-4 w-4" /> Go Back
          </button>
        </div>
      </motion.div>
    </div>
  );
}
