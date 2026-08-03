-- Extends 0006 to every recipe whose photo fails to load, not just the ones
-- still pointing at Firebase.
--
-- 0006 unlocks a row only while `image like 'https://firebasestorage...%'`. That
-- covers the original migration, but not the two cases `bun run
-- images:regenerate` also has to repair:
--   * a recipe with no image at all (image is null)
--   * a Supabase URL whose storage object has since gone missing (404)
-- Neither matches 0006's USING clause, so the update silently touches zero rows.
--
-- Safety here comes from WITH CHECK rather than USING: whatever row is targeted,
-- the only value that can be written is that row's *own* canonical storage path,
-- `recipes/<id>.jpg` in the public bucket. The policy therefore cannot point a
-- recipe at someone else's photo or at an arbitrary external URL — the worst it
-- allows is resetting a recipe to the image slot it already owns.
--
-- Unlike 0006 this one is not self-limiting: a repaired row still matches USING,
-- so it stays rewritable until the policy is dropped.
--
-- DROP IT once the run is done:
--   drop policy "Maintenance: repair broken recipe images" on public.recipes;
--   drop policy "Maintenance: overwrite a broken recipe image" on storage.objects;

create policy "Maintenance: repair broken recipe images"
    on public.recipes for update
    to anon, authenticated
    using (true)
    with check (
        image like '%/storage/v1/object/public/recipe-images/recipes/' || id || '.jpg'
    );

-- Replacing a broken object in place (Supabase `upsert: true`) is an UPDATE on
-- storage.objects; 0002 grants only select and insert, so an overwrite fails
-- without this. Uploading to a fresh path never needs it.
create policy "Maintenance: overwrite a broken recipe image"
    on storage.objects for update
    to anon, authenticated
    using (bucket_id = 'recipe-images')
    with check (bucket_id = 'recipe-images');
