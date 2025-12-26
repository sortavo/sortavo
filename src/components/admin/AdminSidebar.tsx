import { AdminSidebarContent } from "./AdminSidebarContent";

export function AdminSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border h-screen sticky top-0">
      <AdminSidebarContent />
    </aside>
  );
}
