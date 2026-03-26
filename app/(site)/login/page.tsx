import { redirect } from 'next/navigation';
import { checkAuth } from '@/server/actions/login';
import { LoginForm } from './LoginForm';

export default async function LoginPage() {
  const { success } = await checkAuth();
  if (success) {
    redirect('/');
  }

  return (
    <LoginForm />
  );
}
