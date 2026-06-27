import { auth, currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';

export default async function Home() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="space-y-3">
        <p className="text-sm font-medium uppercase tracking-wide text-zinc-500">
          LinkedIn Post
        </p>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-900">
          {user
            ? `Welcome${user.firstName ? `, ${user.firstName}` : ''}`
            : 'Sign in to get started'}
        </h1>
        <p className="max-w-2xl text-base leading-7 text-zinc-600">
          Core auth and document upload plumbing is in place. Connect Clerk,
          PostgreSQL, and R2 when you have the keys, then build onboarding and
          posting flows on top.
        </p>
      </div>

      {user ? (
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-medium text-zinc-900">Your account</h2>
          <dl className="mt-4 grid gap-3 text-sm text-zinc-600 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-zinc-500">Email</dt>
              <dd>{user.emailAddresses[0]?.emailAddress ?? '—'}</dd>
            </div>
            <div>
              <dt className="font-medium text-zinc-500">Clerk user ID</dt>
              <dd className="break-all font-mono text-xs">{user.id}</dd>
            </div>
          </dl>
        </section>
      ) : (
        <Link
          href="/sign-in"
          className="inline-flex w-fit rounded-full bg-zinc-900 px-5 py-3 text-sm font-medium text-white"
        >
          Continue with LinkedIn or Google
        </Link>
      )}
    </main>
  );
}
