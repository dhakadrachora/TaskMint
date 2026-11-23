import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 text-center bg-slate-50">
      <h2 className="text-xl font-bold text-slate-800">Page Not Found</h2>
      <p className="text-xs text-slate-500 mt-1">Could not find requested resource</p>
      <Link href="/" className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold">
        Return Home
      </Link>
    </div>
  );
}
