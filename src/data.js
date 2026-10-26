/** Reusable Supabase query/error helper. */
export async function request(query){const {data,error}=await query;if(error)throw error;return data;}
