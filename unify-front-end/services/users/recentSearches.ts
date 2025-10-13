import { supabase } from '@/lib/supabase';

export async function saveRecentSearch(userId: string, inputQuery: string){
    const query = inputQuery.trim().toLowerCase()
    if(!query)
        return { error: null }

    const { data: searchExists, error: searchErr } = await supabase
        .from("user_recent_searches")
        .select("id, search_query")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    if(searchErr)
        return { error: searchErr }

    //remove dupe
    const found = searchExists?.find((row) => row.search_query.trim().toLowerCase() === query );
    if (found){
        const {error: foundErr} = await supabase
            .from("user_recent_searches")
            .delete()
            .eq("id", found.id);
        if (foundErr)
            return { error: foundErr };
    }

    const { error: insertErr } = await supabase
        .from("user_recent_searches")
        .insert({ user_id: userId, search_query: inputQuery.trim() });
    if (insertErr) 
        return { error: insertErr };

    //refetch and cut
    const { data: after, error: refetchErr } = await supabase
        .from("user_recent_searches")
        .select("id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
    if (refetchErr)
        return { error: refetchErr}

    if(after && after.length > 3){
        const idsToDelete = after.slice(3).map(r => r.id);
        const { error: deleteErr } = await supabase
            .from("user_recent_searches")
            .delete()
            .in("id", idsToDelete);
        if (deleteErr) 
            return { error: deleteErr };
    }
}


export async function getRecentSearches(userId: string) {
    const { data, error } = await supabase
        .from("user_recent_searches")
        .select("search_query")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(3);
      return { searches: data?.map((row) => row.search_query) ?? [], error };
}