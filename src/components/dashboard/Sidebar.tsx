"use client";

import { useState } from "react";
import { Settings, PanelLeft, Home, User, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import SidebarItem from "./SidebarItem";

const SIDEBAR_ITEMS = [
  {
    label: "Home",
    icon: Home,
    href: "/dashboard",
    role: ["SOCIETY", "EM", "TECH"],
  },
  {
    label: "Users",
    icon: User,
    href: "/dashboard/users",
    role: ["TECH"],
  },
  {
    label: "Events",
    icon: Calendar,
    href: "/dashboard/events",
    role: ["TECH", "EM"],
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/dashboard/settings",
    role: ["SOCIETY", "EM", "TECH"],
  },
];

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const { data: session } = useSession();

  return (
    <aside
      className={cn(
        "bg-white border-r transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div
        className={`p-4 flex items-center ${
          isOpen ? "justify-between" : "justify-center"
        }`}
      >
        {isOpen && (
          <div className="flex items-center">
            <span className={`font-semibold text-xl`}>Moksha2025</span>
          </div>
        )}
        <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)}>
          <PanelLeft className="h-5 w-5" />
        </Button>
      </div>

      <nav className="mt-4 space-y-2 px-4">
        {SIDEBAR_ITEMS.map((item) => {
          if (item.role.includes(session?.user?.role as string)) {
            return (
              <SidebarItem
                key={item.href}
                icon={item.icon}
                label={item.label}
                href={item.href}
                isOpen={isOpen}
              />
            );
          }
        })}
      </nav>
    </aside>
  );
}
