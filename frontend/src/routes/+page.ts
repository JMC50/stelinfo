// Pure login gate — no per-request data, so this can be generated once at
// build time and served as a static file. That way Googlebot (and anyone
// else hitting "/") always gets a working 200 page, independent of the
// Vercel serverless function's runtime state.
export const prerender = true;
