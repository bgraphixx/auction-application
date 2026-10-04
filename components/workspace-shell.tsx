"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { canPerform, canUseOperations } from "@/lib/permissions";
import { authClient } from "@/lib/auth-client";
import styles from "./workspace-shell.module.css";

export function WorkspaceShell({ children, user, operations = false }: { children: React.ReactNode; user: { name: string; role: string }; operations?: boolean }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const toggle = useRef<HTMLButtonElement>(null);
  useEffect(() => setOpen(false), [pathname]);
  const links = operations ? [
    { href: "/operations", label: "Overview", show: true },
    { href: "/operations/listings", label: "Listings", show: true },
    { href: "/operations/approvals", label: "Approvals", show: canPerform(user.role, "AUCTION_ADMIN") },
    { href: "/operations/payments", label: "Payments", show: canPerform(user.role, "FINANCE") },
    { href: "/operations/pickups", label: "Pickups", show: canPerform(user.role, "FACILITIES") },
    { href: "/operations/audit", label: "Audit & disputes", show: canPerform(user.role, "COMPLIANCE") },
    { href: "/operations/reports", label: "Reports", show: true },
    { href: "/operations/admin", label: "People & settings", show: canPerform(user.role, "SUPER_ADMIN") },
  ] : [
    { href: "/employee/dashboard", label: "Dashboard", show: true },
    { href: "/employee/auctions", label: "Auctions", show: true },
    { href: "/employee/watchlist", label: "Watchlist", show: true },
    { href: "/employee/bids", label: "My bids", show: true },
    { href: "/employee/payments", label: "Payments", show: true },
    { href: "/employee/pickups", label: "Pickups", show: true },
    { href: "/employee/notifications", label: "Notifications", show: true },
    { href: "/employee/disputes", label: "Disputes", show: true },
  ];
  const [menuOpen, setMenuOpen] = useState(false);
  return <div className={styles.shell} onKeyDown={event => { if (open && event.key === "Escape") { setOpen(false); toggle.current?.focus(); } }}>
    <a className={styles.skip} href="#workspace-content">Skip to content</a>
    <header className={styles.header}>
      <Link className={styles.brand} href={operations ? "/operations" : "/employee/dashboard"}><img src="/assets/ffcl-icon.png" alt="" /><span><strong>Fewchore</strong><small>Asset disposal</small></span></Link>
      <div className={styles.identity}>
        <span>{user.name}<small>{operations ? user.role.toLowerCase().replaceAll("_", " ") : "Employee workspace"}</small></span>
        <button className={styles.avatarBtn} aria-expanded={menuOpen} aria-haspopup="menu" onClick={() => setMenuOpen(!menuOpen)}>
          <b aria-hidden="true">{user.name.split(" ").map(word => word[0]).slice(0, 2).join("")}</b>
        </button>
        {menuOpen && <div className={styles.userMenu}>
          <button onClick={() => { authClient.signOut({ fetchOptions: { onSuccess: () => { window.location.href = "/"; } } }); }}>Sign out</button>
        </div>}
      </div>
      <button ref={toggle} className={styles.toggle} aria-expanded={open} aria-controls="workspace-navigation" onClick={() => setOpen(!open)}>{open ? "Close" : "Menu"}</button>
    </header>
    <aside id="workspace-navigation" className={`${styles.navigation} ${open ? styles.open : ""}`}>
      <p>{operations ? "Operations" : "My workspace"}</p>
      <nav aria-label={operations ? "Operations navigation" : "Employee navigation"}>{links.filter(link => link.show).map(link => <Link key={link.href} href={link.href} aria-current={(link.href === "/operations" ? pathname === link.href : (pathname.startsWith(link.href) || (link.href === "/employee/auctions" && pathname === "/employee/results"))) ? "page" : undefined} onClick={() => setOpen(false)}>{link.label}</Link>)}</nav>
      {(operations || canUseOperations(user.role)) && <Link className={styles.switcher} href={operations ? "/employee/dashboard" : "/operations"}>{operations ? "Employee workspace" : "Operations workspace"}</Link>}
    </aside>
    <div id="workspace-content" className={`workspace-content ${styles.content}`} tabIndex={-1} onClick={() => setMenuOpen(false)}>{children}</div>
  </div>;
}
