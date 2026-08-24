// Custom properties several middleware files read off `req` (request ID,
// authenticated user ID) but nothing in this codebase currently assigns --
// they're always undefined today. Declared here anyway so the properties
// are typed rather than requiring `as any` at every read site, and so a
// future middleware that does set them has a real type to satisfy.
declare global {
  namespace Express {
    interface Request {
      id?: string;
      userId?: string;
    }
  }
}

export {};
