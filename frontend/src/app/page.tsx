export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">Jobseeker</h1>
        <p className="mt-4 text-lg text-muted-foreground">
          AI-enhanced job search application
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <a
            href="/login"
            className="rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
          >
            Get Started
          </a>
          <a
            href="/docs"
            className="rounded-md border border-input px-4 py-2 hover:bg-accent"
          >
            Learn More
          </a>
        </div>
      </div>
    </main>
  );
}
