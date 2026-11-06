import { AuthScreen } from "@/components/auth/auth-screen";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const { error } = await searchParams;
  return <AuthScreen mode="login" initialError={Array.isArray(error) ? error[0] : error} />;
}
