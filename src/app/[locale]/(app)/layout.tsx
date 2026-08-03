import AppHeader from "@/components/layout/app-header";
import { TabBar } from "@/features/tracking/components/tab-bar";

/**
 * The application shell. Everything the product does lives inside it: a slim
 * header, a phone-width column, and the dark tab bar pinned to the bottom.
 * Primary navigation is the tab bar, so the header stays out of the way.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-surface">
            <AppHeader />
            <div className="mx-auto flex min-h-[calc(100vh-3.5rem)] max-w-md flex-col px-4 pt-4">
                <div className="flex-1">{children}</div>
                <TabBar />
            </div>
        </div>
    );
}
