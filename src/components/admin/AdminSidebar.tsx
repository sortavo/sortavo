import { AdminSidebarContent } from "./AdminSidebarContent";

export function AdminSidebar() {
  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r border-border/50 h-screen sticky top-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl">
      <AdminSidebarContent />
    </aside>
  );
}
