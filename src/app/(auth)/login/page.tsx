import { LoginForm } from "./login-form";

function safeRedirect(next: string | undefined): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) return next;
  return "/feed";
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  return (
    <div className="flex flex-1 items-center justify-center p-6">
      <LoginForm redirectTo={safeRedirect(next)} />
    </div>
  );
}
