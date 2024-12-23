"use server";
import { createServiceRoleClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";
import { initClients } from "@/utils/initClients";
import { getAssistant } from "@/utils/initClients";

// create thread and store it in database
async function getOrCreateThread(
    supabase: ReturnType<typeof createServiceRoleClient>,
    supabaseUserId: string,
    assistantId: string
) {
    const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, thread_id")
        .eq("id", supabaseUserId)
        .maybeSingle();

    // error fetching profile
    if (profileError) {
        console.error("Error fetching profile:", profileError);
        throw new Error("Error fetching profile data");
    }

    // no profile id found
    if (!profile) {
        console.error("Profile not found with Supabase User ID:", supabaseUserId);
        throw new Error("Profile not found");
    }

    // check if thread exists
    if (profile.thread_id) {
        const { data: existingThread, error: threadCheckError } = await supabase
            .from("threads")
            .select("id")
            .eq("id", profile.thread_id)
            .maybeSingle();

        if (threadCheckError) {
            console.error("Error checking thread existence:", threadCheckError);
            throw new Error("Error checking thread existence");
        }

        if (existingThread) {
            return profile.thread_id;
        } else {
            console.warn(
                "Thread ID in profile does not exist in threads table. Clearing invalid thread_id."
            );

            await supabase.from("profiles").update({ thread_id: null }).eq("id", profile.id);
        }
    }

    // create new thread
    const { data: newThread, error: threadError } = await supabase
        .from("threads")
        .insert([{ user_id: profile.id, assistant_id: assistantId }])
        .select()
        .single();

    if (threadError) {
        console.error("Error creating thread:", threadError);
        throw new Error("Failed to create new thread");
    }

    const { error: updateError } = await supabase
        .from("profiles")
        .update({ thread_id: newThread.id })
        .eq("id", profile.id);

    if (updateError) {
        console.error("Error updating profile's thread_id:", updateError);
        throw new Error("Failed to associate profile with new thread");
    }

    return newThread.id;
}

// insert message into thread
async function postMessage(
    supabase: ReturnType<typeof createServiceRoleClient>,
    threadId: string,
    sender: string,
    messageContent: string,
    messageType: string
) {
    const { data: thread, error: threadError } = await supabase
        .from("threads")
        .select("id")
        .eq("id", threadId)
        .single();

    if (threadError || !thread) {
        console.error("Thread does not exist. Cannot add message.");
        throw new Error("Thread does not exist");
    }

    const { data, error } = await supabase
        .from("messages")
        .insert([
            {
                thread_id: threadId,
                sender: sender,
                message_content: messageContent,
                message_type: messageType
            }
        ])
        .select();

    if (error) {
        console.error("Error adding message:", error);
        throw new Error("Failed to add message");
    }

    return data[0];
}

// retrieve thread history
async function getThreadHistory(
    supabase: ReturnType<typeof createServiceRoleClient>,
    threadId: string
) {
    const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("thread_id", threadId)
        .eq("message_type", "flashcard")
        .order("created_at", { ascending: true });

    if (error) {
        console.error("Error fetching thread history:", error);
        throw new Error("Failed to retrieve thread history");
    }

    return data.map((message) => ({
        role: message.sender,
        content: message.message_content
    }));
}

export async function POST(req: Request) {
    const { userId, message } = await req.json();

    if (!userId || !message) {
        return NextResponse.json({ error: "Missing userId or message" }, { status: 400 });
    }

    try {
        const { supabase, openai } = await initClients();
        const assistant = await getAssistant(supabase);

        const threadId = await getOrCreateThread(supabase, userId, assistant.id);

        const previousMessages = await getThreadHistory(supabase, threadId);

        await postMessage(supabase, threadId, "user", message, "flashcard");

        const assistantResponse = await openai.chat.completions.create({
            model: "gpt-4o-mini",
            messages: [...previousMessages, { role: "user", content: message }]
        });

        const assistantMessage = assistantResponse.choices[0].message.content as string;

        const serviceSupabase = createServiceRoleClient();
        const cardData = await postMessage(
            serviceSupabase,
            threadId,
            "assistant",
            assistantMessage,
            "flashcard"
        );
        const cardId = cardData.id;
        return NextResponse.json({ assistantMessage, cardId });
    } catch (error) {
        console.error("Error processing request:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
