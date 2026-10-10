import { redirect } from 'next/navigation';

/** proxy.ts sends signed-in staff to their home module; this is only a fallback. */
export default function IndexPage() {
  redirect('/login');
}
