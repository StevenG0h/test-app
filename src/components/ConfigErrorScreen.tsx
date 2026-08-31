export default function ConfigErrorScreen({ message }: { message: string }) {
  return (
    <main className="card result result-error">
      <h1>App is not configured</h1>
      <pre className="pre">{message}</pre>
    </main>
  )
}
