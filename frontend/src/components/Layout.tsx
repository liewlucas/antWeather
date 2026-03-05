import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/", label: "Dashboard" },
  { to: "/history", label: "History" },
  { to: "/captures", label: "Captures" },
  { to: "/settings", label: "Settings" },
];

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex">
      <nav className="w-56 bg-gray-800 border-r border-gray-700 p-4 flex flex-col gap-1 shrink-0">
        <h1 className="text-lg font-bold mb-4 text-blue-400">Rain Monitor</h1>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.to === "/"}
            className={({ isActive }) =>
              `block px-3 py-2 rounded text-sm ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              }`
            }
          >
            {l.label}
          </NavLink>
        ))}
      </nav>
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}
