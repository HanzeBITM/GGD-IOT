'use client';

import { FormEvent, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get('redirect') || '/';

    async function handleSubmit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Inloggen mislukt');
            }

            // Store user information in session storage
            if (data.user) {
                console.log("Inloggende gebruiker:", data.user);
                sessionStorage.setItem('user', JSON.stringify(data.user));
            }

            // Redirect to the original destination or dashboard
            router.push(decodeURIComponent(redirect));
        } catch (error) {
            console.error("Login fout:", error);
            setError(error instanceof Error ? error.message : 'Inloggen mislukt');
        } finally {
            setIsLoading(false);
        }
    }

    return (
        <div className="flex min-h-screen flex-col items-center justify-center p-4">
            <div className="w-full max-w-md rounded-lg border border-gray-200 bg-white p-6 shadow-md">
                <h1 className="mb-6 text-2xl font-bold text-center">Inloggen</h1>

                {error && (
                    <div className="mb-4 rounded bg-red-100 p-3 text-red-700">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label htmlFor="username" className="block mb-1 font-medium">
                            Gebruikersnaam
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full rounded border border-gray-300 p-2"
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label htmlFor="password" className="block mb-1 font-medium">
                            Wachtwoord
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full rounded border border-gray-300 p-2"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full rounded bg-blue-600 py-2 px-4 text-white hover:bg-blue-700 disabled:bg-blue-400"
                    >
                        {isLoading ? 'Bezig met inloggen...' : 'Inloggen'}
                    </button>
                </form>

                <p className="mt-4 text-center">
                    Nog geen account?{' '}
                    <Link href="/register" className="text-blue-600 hover:underline">
                        Registreer hier
                    </Link>
                </p>
            </div>
        </div>
    );
}
