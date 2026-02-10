'use client';

import { useEffect, useState } from 'react';
import { listItems, createItem, deleteItem, Item } from '../lib/api';

export default function Home() {
  const [items, setItems] = useState<Item[]>([]);
  const [newItemName, setNewItemName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await listItems();
      setItems(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Only fetch if API URL is set, otherwise show instruction
    if (process.env.NEXT_PUBLIC_API_URL) {
      fetchItems();
    }
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    try {
      setLoading(true);
      const created = await createItem(newItemName, 'Created via Web UI');
      setItems([...items, created]);
      setNewItemName('');
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      setLoading(true);
      await deleteItem(itemId);
      setItems(items.filter((item) => item.itemId !== itemId));
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unknown error occurred');
      }
    } finally {
      setLoading(false);
    }
  };

  if (!process.env.NEXT_PUBLIC_API_URL) {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-100">
        <div className="rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">Configuration Required</h1>
          <p className="mb-4 text-gray-700">
            Please configure the <code className="bg-gray-200 px-1 py-0.5 rounded">NEXT_PUBLIC_API_URL</code> environment variable.
          </p>
          <ol className="list-decimal list-inside space-y-2 text-gray-600">
            <li>Deploy the backend using <code className="bg-gray-200 px-1 py-0.5 rounded">make deploy</code> (or <code className="bg-gray-200 px-1 py-0.5 rounded">cd infra && npx cdk deploy</code>)</li>
            <li>Copy the <strong>ApiUrl</strong> from the output.</li>
            <li>Create <code className="bg-gray-200 px-1 py-0.5 rounded">frontend/.env.local</code> and add:</li>
          </ol>
          <pre className="mt-4 bg-gray-800 p-4 rounded text-white overflow-x-auto">
            NEXT_PUBLIC_API_URL=https://your-api-url...
          </pre>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-8 text-3xl font-bold text-center text-gray-800">Serverless Template App</h1>

        <div className="flex justify-end gap-4 mb-8">
          <a href="/login" className="text-blue-600 hover:underline">Login / Sign Up</a>
          <a href="/profile" className="text-blue-600 hover:underline">Profile</a>
          <a href="/admin" className="text-blue-600 hover:underline">Admin Dashboard</a>
        </div>

        {error && (
          <div className="mb-6 rounded-md bg-red-50 p-4 text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <div className="mb-8 rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">Add New Item</h2>
          <form onSubmit={handleCreate} className="flex gap-4">
            <input
              type="text"
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Item name..."
              className="flex-1 rounded-md border border-gray-300 px-4 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading || !newItemName.trim()}
              className="rounded-md bg-blue-600 px-6 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Add
            </button>
          </form>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-800">Items List</h2>
            <button
              onClick={fetchItems}
              disabled={loading}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Refresh
            </button>
          </div>

          {loading && items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">Loading...</div>
          ) : items.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No items found. Create one above!</div>
          ) : (
            <ul className="space-y-3">
              {items.map((item) => (
                <li
                  key={item.itemId}
                  className="flex items-center justify-between rounded-md bg-gray-50 p-4 hover:bg-gray-100 transition-colors"
                >
                  <div>
                    <span className="font-medium text-gray-900">{item.name}</span>
                    <span className="ml-2 text-xs text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDelete(item.itemId)}
                    disabled={loading}
                    className="text-red-600 hover:text-red-800 font-medium text-sm px-3 py-1 rounded hover:bg-red-50 transition-colors"
                  >
                    Delete
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </main>
  );
}
