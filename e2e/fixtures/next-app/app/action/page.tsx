async function submitAction(formData: FormData) {
  'use server';
  // No-op; we just want a server-action reference in the RSC payload.
  const _name = formData.get('name');
}

export default function ActionPage() {
  return (
    <main>
      <h1>Server action</h1>
      <form action={submitAction}>
        <input name="name" defaultValue="alice" />
        <button type="submit">submit</button>
      </form>
    </main>
  );
}
