"use client";
import React, { useState, FormEvent } from "react";

export default function SignUpPanel({ visible }: { visible: boolean }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [lastname, setLastname] = useState("");

  // Dummy loginSuccess/loginFailure for demonstration, replace with your logic
  function loginSuccess() {
    // Success logic
  }
  function loginFailure(msg: string) {
    // Failure logic
    alert(msg);
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(
        "https://adminsystem.schoolbright.co/api/auth/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, name, lastname }),
        }
      );
      const result = await response.json();
      if (!response.ok || result.error) {
        return loginFailure(result.message || "ไม่สามารถสมัครสมาชิกได้");
      } else {
        return loginSuccess();
      }
    } catch (error: any) {
      throw new Error(error.message);
    }
  };

  return (
    <div
      className={`absolute w-full transition-all duration-500 hidden ${
        visible
          ? "opacity-100 translate-x-0 z-10"
          : "opacity-0 -translate-x-full z-0 pointer-events-none"
      }`}
    >
      <h2 className="text-xl font-bold text-center mb-5">
        สมัครสมาชิก เพื่อเริ่มใช้งาน!
      </h2>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="ชื่อจริง"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          type="text"
          placeholder="นามสกุล"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={lastname}
          onChange={(e) => setLastname(e.target.value)}
          required
        />
        <input
          type="email"
          placeholder="name@company.com"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="••••••••"
          className="w-full border border-gray-300 px-4 py-2 rounded-lg text-black"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          type="submit"
          className="w-full bg-blue-900 text-white py-2 rounded-full font-semibold"
        >
          Free Sign Up
        </button>
      </form>
    </div>
  );
}
