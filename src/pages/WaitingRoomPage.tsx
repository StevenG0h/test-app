export default function WaitingRoomPage({
  waitingRoomUrl,
  onCheckAgain,
}: {
  waitingRoomUrl: string
  onCheckAgain: () => void
}) {
  return (
    <main className="card">
      <header className="card-header">
        <span className="badge badge-warn">● Waiting room</span>
        <h1>Please wait</h1>
      </header>
      <p>
        Your session is not active right now, so you&rsquo;ve been placed in the
        waiting room. When your session becomes valid, click below to check and
        you&rsquo;ll be let into the app.
      </p>
      <div className="actions">
        <button className="button" type="button" onClick={onCheckAgain}>
          Check again
        </button>
      </div>
      <p className="muted">
        Direct link to the waiting room:{' '}
        <a href={waitingRoomUrl} target="_blank" rel="noreferrer">
          {waitingRoomUrl}
        </a>
      </p>
    </main>
  )
}
