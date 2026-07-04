import Link from "next/link";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center px-6 py-32 text-center">
      <p className="text-sm font-medium uppercase tracking-widest text-indigo-600 dark:text-indigo-400">
        404
      </p>
      <h1 className="mt-2 text-3xl font-semibold text-slate-900 dark:text-white">
        Page not found
      </h1>
      <p className="mt-3 text-slate-500 dark:text-slate-400">
        The page you&apos;re looking for doesn&apos;t exist or may have moved.
      </p>
      <Link href="/" className="mt-8">
        <Button size="lg">Back to home</Button>
      </Link>
    </div>
  );
}
