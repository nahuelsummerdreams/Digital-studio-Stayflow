-- Fourth category: cabins and resorts. Kept in its own migration because a new enum value cannot be used in the same transaction.
alter type public.lodging_type add value if not exists 'cabins';
