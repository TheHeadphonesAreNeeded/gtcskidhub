import Link from "next/link";
import Logo from "@/components/Logo";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6 text-center">
      <Logo size={72} withText={false} />
      <div>
        <h1 className="text-6xl font-black accent-text">404</h1>
        <p className="mt-2 text-slate-400">
          This page skidded off the map.
        </p>
      </div>
      <Link href="/" className="btn-primary px-6 py-3">
        Back home
      </Link>
    </div>
  );
}
