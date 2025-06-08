"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) return;

    const res = await fetch("http://localhost:8080/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const text = await res.text();

    if (text.includes("successful")) {
      localStorage.setItem("username", username.trim());
      router.push("/chat");
    } else {
      setError(text);
    }
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) return;

    const res = await fetch("http://localhost:8080/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: username.trim(), password }),
    });

    const text = await res.text();
    alert(text);
  };

  return (
    <main className="p-4 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Logga in</h1>

      <input
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded w-full mb-2"
        placeholder="Användarnamn"
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded w-full mb-4"
        placeholder="Lösenord"
      />

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <button
        onClick={handleLogin}
        className="bg-blue-500 text-white px-4 py-2 rounded w-full mb-2"
      >
        Logga in
      </button>

      <button
        onClick={handleRegister}
        className="bg-green-500 text-white px-4 py-2 rounded w-full"
      >
        Registrera
      </button>
    </main>
  );
}
