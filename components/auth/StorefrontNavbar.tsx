"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "./AuthProvider";

export default function StorefrontNavbar() {
  const router = useRouter();
  const { role, isLoading, signOut } = useAuth();

  async function handleLogout() {
    await signOut();
    router.replace("/");
  }

  const navRole = role;

  return (
    <nav className="sticky top-0 z-50 backdrop-blur-xl bg-black/40 border-b border-purple-500/10">
      <div className="max-w-[1600px] mx-auto px-8 py-5 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-[4px]">
            MJ <span className="text-purple-500">STORE</span>
          </h1>
        </div>

        <div className="hidden md:flex items-center gap-10 text-zinc-400 font-medium">
          <a href="#products" className="hover:text-white transition">
            Products
          </a>
          <a href="#reviews" className="hover:text-white transition">
            Reviews
          </a>
          <a href="#contact" className="hover:text-white transition">
            Contact
          </a>
        </div>

        <div className="flex items-center gap-4">
          <button className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition">
            EN | AR
          </button>

          <a href="#products">
            <button className="bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-xl font-bold transition">
              Buy Now
            </button>
          </a>

          {/* Auth area */}
          {!isLoading && !navRole ? (
            <>
              <Link href="/login">
                <button className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="bg-purple-500/10 hover:bg-purple-500/15 px-4 py-2 rounded-xl transition font-bold text-white">
                  Register
                </button>
              </Link>
            </>
          ) : null}

          {!isLoading && navRole === "customer" ? (
            <>
              <Link href="/account">
                <button className="bg-purple-500/10 hover:bg-purple-500/15 px-4 py-2 rounded-xl transition font-bold text-white">
                  Account
                </button>
              </Link>

              <button
                onClick={handleLogout}
                className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition"
              >
                Logout
              </button>
            </>
          ) : null}

          {!isLoading && navRole === "admin" ? (
            <>
              <Link href="/account">
                <button className="bg-purple-500/10 hover:bg-purple-500/15 px-4 py-2 rounded-xl transition font-bold text-white">
                  Account
                </button>
              </Link>

              <Link href="/admin">
                <button className="bg-purple-600 hover:bg-purple-700 px-4 py-2 rounded-xl transition font-bold text-white">
                  Admin
                </button>
              </Link>

              <button
                onClick={handleLogout}
                className="border border-purple-500/30 hover:border-purple-500 px-4 py-2 rounded-xl transition"
              >
                Logout
              </button>
            </>
          ) : null}
        </div>
      </div>
    </nav>
  );
}
