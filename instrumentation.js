// Runs once when the Next.js server starts. Starts the background jobs (donation reminder emails) on the
// Node.js runtime only — see src/server/jobs.js.
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startJobs } = await import('./src/server/jobs');
    startJobs();
  }
}
