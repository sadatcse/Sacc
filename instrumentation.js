// Runs once when the Next.js server starts. On the Node.js runtime: starts the background jobs (donation reminder
// emails, src/server/jobs.js) and loads the public page data into memory, so the first visitors don't wait for
// MongoDB (src/server/warm.js).
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { startJobs } = await import('./src/server/jobs');
    startJobs();
    const { warmPublicData } = await import('./src/server/warm');
    // Not awaited: the server starts answering while the data loads
    warmPublicData().then(({ ms, ok, error }) => console.log(ok ? `> Public data loaded in ${ms} ms` : `> Public data not loaded yet (${error})`));
  }
}
