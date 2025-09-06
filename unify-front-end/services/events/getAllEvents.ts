import { supabase } from "@/lib/supabase";
import { Event } from "@/types/events";

export const getAllEvents = async (): Promise<Event[]> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    const { data, error } = await supabase.from("events").select("*");
    if (error) {
      throw new Error("Failed to fetch events");
    }

    return data;
  } catch (error) {
    console.error("Error fetching events:", error);
    throw error;
  }
}
