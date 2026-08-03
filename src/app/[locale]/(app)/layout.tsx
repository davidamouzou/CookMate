import { TabBar } from "@/features/tracking/components/tab-bar";

/**
 * The application shell: a content column and the dark navigation, and nothing
 * else. There is no header — the brand, the locale picker and the theme toggle
 * moved into the navigation, which was already on screen, rather than holding a
 * 56px bar above every page for three controls that are touched about once.
 *
 * The column follows the five tiers of the responsive system — 28rem in the
 * pocket, 42 on a tablet, 64 on a laptop, 78 on a desktop — with the gutter
 * stepping 16 → 24 → 32 alongside. From `lg` it turns into a row: the
 * navigation leaves the bottom of the screen for a rail on the left, which is
 * where a pointer expects it and frees the vertical space a thumb no longer
 * needs.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-surface">
            {/* The row deliberately stretches rather than starting its items:
                a stretched content column can be a full-height flex column of
                its own, which is what lets a page push its footer row to the
                bottom of the viewport instead of leaving it floating under
                short content. The rail sets its own height. */}
            <div className="mx-auto flex min-h-screen w-full max-w-md flex-col px-4 pt-4 sm:max-w-2xl sm:px-6 lg:max-w-5xl lg:flex-row lg:gap-8 lg:py-4 desk:max-w-[78rem] desk:gap-10 desk:px-8">
                {/* `min-w-0` keeps wide children (charts, long titles) from
                    stretching the row instead of scrolling inside it. */}
                <div className="flex min-w-0 flex-1 flex-col">{children}</div>
                <TabBar />
            </div>
        </div>
    );
}
