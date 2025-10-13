import { supabase } from '@/lib/supabase';

export async function saveRecentGroups(userId: string, groupId: number){
    if(!groupId)
        return { error: null }

    const { data: idExists, error: searchErr } = await supabase
        .from("user_recent_groups")
        .select("id, group_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if(searchErr)
        return { error: searchErr }

    //remove dupe
    const found = idExists?.find((row) => row.group_id === groupId );
    if (found){
        const {error: foundErr} = await supabase
            .from("user_recent_groups")
            .delete()
            .eq("id", found.id);
        if (foundErr)
            return { error: foundErr };
    }

    const { error: insertErr } = await supabase
        .from("user_recent_groups")
        .insert({ user_id: userId, group_id: groupId })
    if (insertErr) 
        return { error: insertErr };

    //refetch and cut
    const { data: after, error: refetchErr } = await supabase
        .from("user_recent_groups")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (refetchErr)
        return { error: refetchErr}

    if(after && after.length > 3){
        const idsToDelete = after.slice(3).map(r => r.id);
        const { error: deleteErr } = await supabase
            .from("user_recent_groups")
            .delete()
            .in("id", idsToDelete);
        if (deleteErr) 
            return { error: deleteErr };
    }
    return {error: null}
}


export async function getRecentGroups(userId: string) {
    const { data, error } = await supabase
        .from("user_recent_groups")
        .select("group_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);
      return { groups: data?.map((row) => row.group_id) ?? [], error };
}