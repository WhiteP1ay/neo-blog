"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export function Nav() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { href: "/me", label: "About" },
    { href: "/topics", label: "专题" },
    { href: "/tools", label: "工具" },
    { href: "/privacy", label: "隐私政策" },
  ];

  const isActive = (href: string) => {
    if (href === "/me") {
      return pathname === "/me";
    }
    return pathname?.startsWith(href);
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo/Home Link */}
          <Link href="/" className="flex items-center">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              White Meta
            </h1>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`text-sm font-medium transition-colors ${
                  isActive(item.href)
                    ? "text-blue-600"
                    : "text-gray-600 hover:text-blue-600"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <a
              href="mailto:EthanPark2233@gmail.com"
              className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
            >
              Email
            </a>
            <Link
              href="/admin"
              className="text-sm font-medium text-gray-600 transition-opacity opacity-0 hover:opacity-100"
              title="管理后台"
            >
              管理
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden pb-4 border-t border-gray-200">
            <div className="flex flex-col gap-4 pt-4">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`text-sm font-medium transition-colors ${
                    isActive(item.href)
                      ? "text-blue-600"
                      : "text-gray-600 hover:text-blue-600"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
              <a
                href="mailto:EthanPark2233@gmail.com"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors"
              >
                Email
              </a>
              <Link
                href="/admin"
                onClick={() => setIsMobileMenuOpen(false)}
                className="text-sm font-medium text-gray-600 transition-opacity opacity-20 hover:opacity-100"
              >
                管理
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}

