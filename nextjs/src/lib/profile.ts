import useSWR, { mutate } from "swr";

// fetcher function for use with SWR
const fetcher = async (url: string) => {
    const res = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json"
        }
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || "Failed to fetch data");
    }

    return json;
};

interface Profile {
    id: string;
    first_name: string;
    last_name: string;
    card_sets_completed_amount: number;
    longest_streak_length: number;
    streak_length: number;
    streak_updated: Date;
}

// SWR hook for getting history
export const useProfile = () => {
    const { data, error, isLoading } = useSWR(`/api/profile/`, fetcher, {});

    const profile = data ? (data.profile as Profile[]) : null;
    return {
        data: profile ? profile[0] : null,
        isLoading,
        isError: error
    };
};

interface UpdateProfileBody {
    userId: string;
    cardsDefaultAmount: number;
    cardsDefaultDifficulty: "easy" | "medium" | "hard";
}

export const updateProfile = async (body: UpdateProfileBody) => {
    const res = await fetch("/api/profile", {
        method: "PUT",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    const json = await res.json();

    if (!res.ok) {
        throw new Error(json.error || "Failed to create topic");
    }

    await mutate(["/api/profile", { userId: body.userId }]);

    return { profile: json.profile[0] as Profile };
};