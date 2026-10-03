"use client";
export default function WorkspaceError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return <main className="simple-page"><section className="workspace-panel"><h1>This page could not load</h1><p className="muted" role="alert">Check your connection and try again. If the issue continues, return to another section using the navigation.</p><button className="primary-button" onClick={retry}>Try again</button></section></main>;
}
