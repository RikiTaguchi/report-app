"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { LogoutIcon } from "@/components/icons";

export interface NavSubItem {
  href: string;
  label: string;
}

export interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  submenu?: NavSubItem[];
  alsoMatch?: string[];
}

interface AppHeaderProps {
  brand: string;
  items: NavItem[];
  userLabel: string;
  logoutHref: string;
}

export function AppHeader({ brand, items, userLabel, logoutHref }: AppHeaderProps) {
  const { logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleOutside(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    }
    document.addEventListener("click", handleOutside);
    return () => document.removeEventListener("click", handleOutside);
  }, []);

  useEffect(() => {
    setOpenMenu(null);
  }, [pathname]);

  const handleLogout = async () => {
    await logout();
    router.replace(logoutHref);
  };

  function isActive(item: NavItem): boolean {
    if (item.submenu) {
      return item.submenu.some((s) => pathname === s.href || pathname.startsWith(s.href + "/"));
    }
    if (item.alsoMatch?.some((prefix) => pathname === prefix || pathname.startsWith(prefix + "/"))) {
      return true;
    }
    if (item.exact) return pathname === item.href;
    return pathname === item.href || pathname.startsWith(item.href + "/");
  }

  function mobileHref(item: NavItem): string {
    return item.submenu ? item.submenu[0].href : item.href;
  }

  return (
    <>
      <nav className="app-topbar">
        <span className="brand">{brand}</span>
        <div className="app-toplinks" ref={navRef}>
          {items.map((item) => (
            <div key={item.href} className="nav-item-wrap">
              {item.submenu ? (
                <>
                  <button
                    type="button"
                    className={`nav-link ${isActive(item) ? "active" : ""}`}
                    onClick={() => setOpenMenu(openMenu === item.href ? null : item.href)}
                  >
                    <item.icon className="nav-icon" />
                    {item.label}
                  </button>
                  {openMenu === item.href && (
                    <div className="nav-submenu">
                      {item.submenu.map((sub) => (
                        <Link key={sub.href} href={sub.href} className="nav-submenu-item">
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={item.href} className={`nav-link ${isActive(item) ? "active" : ""}`}>
                  <item.icon className="nav-icon" />
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
        <span className="spacer" />
        <span className="nav-user">{userLabel}</span>
        <button className="icon-btn" onClick={handleLogout} aria-label="ログアウト">
          <LogoutIcon />
        </button>
      </nav>
      <nav className="bottom-nav">
        {items.map((item) => (
          <Link
            key={item.href}
            href={mobileHref(item)}
            className={`bottom-nav-item ${isActive(item) ? "active" : ""}`}
          >
            <span className="bottom-nav-icon-wrap">
              <item.icon />
            </span>
            {item.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
