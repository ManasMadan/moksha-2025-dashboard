"use client";

import { useState } from "react";
import { Users, Settings, PanelLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSession } from "next-auth/react";
import { ROLES } from "@/lib/constants";
import SidebarItem from "./SidebarItem";

export function Sidebar() {
  const [isOpen, setIsOpen] = useState(true);
  const {data: session} = useSession();

  return (
    <aside
      className={cn(
        "bg-white border-r transition-all duration-300 ease-in-out",
        isOpen ? "w-64" : "w-20"
      )}
    >
      <div className={`p-4 flex items-center ${isOpen ? "justify-between" : "justify-center"}`}>
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
        <SidebarItem
          icon={Home}
          label="Dashboard"
          href="/dashboard"
          isOpen={isOpen}
        />
        {session?.user?.role === ROLES.ADMIN && (
          <SidebarItem icon={Users} label="Users" href="/dashboard/users" isOpen={isOpen} />
        )}
        <SidebarItem
          icon={Settings}
          label="Settings"
          href="/dashboard/settings"
          isOpen={isOpen}
        />
      </nav>
    </aside>
  );
}