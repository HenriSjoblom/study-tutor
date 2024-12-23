"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User } from "@/types";
import { useHistory } from "@/lib/history";
import { HistoryCardContent } from "./HistoryCardContent";
import { HistorySkeleton } from "./HistorySkeleton";
import NoCardsFound from "./NoCardsFound";

export default function HistoryCard({ user }: { user: User }) {
    const { data: history, isLoading } = useHistory();
    const cleanedHistory = history ? history.filter((a) => a.role === "assistant") : [];
    const skeletonArray = Array(3).fill(null);

    return (
        <Card className="w-auto">
            <CardHeader>
                <CardTitle>History</CardTitle>
            </CardHeader>
            {/* display the cards, display loading skeletons while loading */}
            <CardContent className="space-y-2">
                {isLoading && skeletonArray.map((_, index) => <HistorySkeleton key={index} />)}
                {cleanedHistory &&
                    cleanedHistory.map((h) => (
                        <HistoryCardContent key={h.content} history={h} user={user} />
                    ))}
                {!isLoading && cleanedHistory && cleanedHistory.length === 0 && <NoCardsFound />}
            </CardContent>
        </Card>
    );
}
