import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/app-sidebar"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    return (
        <SidebarProvider>
            <AppSidebar />
            <main className="w-full">
                <div className="p-4 border-b flex items-center gap-4">
                    <SidebarTrigger />
                    <h1 className="text-xl font-bold">Admin Dashboard</h1>
                </div>
                <div className="p-4">
                    {children}
                </div>
            </main>
        </SidebarProvider>
    )
}
