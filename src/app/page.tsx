import { redirect } from 'next/navigation';

export default function RootPage() {
  // The middleware handles auth checks.
  // If user is authenticated + has profile → they see the dashboard.
  // If not authenticated → middleware redirects to /login.
  // If no profile → middleware redirects to /setup.
  redirect('/customers');
}
