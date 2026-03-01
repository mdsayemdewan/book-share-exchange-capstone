import { Link } from 'react-router-dom';

export default function Pending() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <div className="rounded-2xl border bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-gray-900">Account pending</h1>
        <p className="mt-2 text-sm text-gray-600">
          Your account is waiting for admin approval. Once approved, you can log in.
        </p>
        <div className="mt-6 flex gap-3">
          <Link
            to="/login"
            className="rounded-xl bg-gray-900 px-4 py-2.5 font-medium text-white hover:bg-gray-800"
          >
            Go to login
          </Link>
          <Link to="/signup" className="rounded-xl border px-4 py-2.5 font-medium hover:bg-gray-50">
            Create another account
          </Link>
        </div>
      </div>
    </div>
  );
}
