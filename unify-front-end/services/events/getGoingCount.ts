import { supabase } from "@/lib/supabase";

// Design has a going count, not sure if that includes 'interested' or not but can easily be changed later
export const getGoingCount = async (eventId: number): Promise<number> => {
  try {
    const { count, error } = await supabase
      .from("event_rsvps")
      .select("*", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("rsvp_status", "going");

    if (error) {
      throw new Error("Failed to fetch going count");
    }

    return count || 0;
  } catch (error) {
    console.error("Error fetching going count:", error);
    throw error;
  }
}
