import Link from "next/link";
import { Button } from "../ui/button";

export default function SidebarItem({
  icon: Icon,
  label,
  href,
  isOpen,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  isOpen: boolean;
}) {
  return (
    <Link href={href}>
      <Button variant="ghost" className="w-full justify-start space-x-2">
        <Icon className="h-5 w-5" />
        {isOpen && <span>{label}</span>}
      </Button>
    </Link>
  );
}
