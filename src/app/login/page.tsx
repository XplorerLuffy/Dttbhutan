import Link from "next/link";
import AuthLayout from "@/components/auth/AuthLayout";
import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthLayout>
      <h1 className="mb-6 text-center text-2xl font-bold">Log in</h1>

      <LoginForm />

      <p className="mt-4 text-center text-sm text-stone-600">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-brand-700 hover:underline">
          Sign up
        </Link>
      </p>
    </AuthLayout>
  );
}
