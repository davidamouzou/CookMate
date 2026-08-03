-- Temporary policy letting `bun run images:regenerate` replace the dead
-- Firebase Storage URLs, without handing out a service-role key.
--
-- It is deliberately self-limiting:
--   USING      — only rows still pointing at Firebase can be touched at all
--   WITH CHECK — the new value must be a Supabase Storage URL in our bucket
--
-- A row therefore stops matching USING as soon as it is fixed, so each recipe
-- can be rewritten once and never again.
--
-- DROP IT once the run is done:
--   drop policy "Maintenance: replace dead recipe images" on public.recipes;

create policy "Maintenance: replace dead recipe images"
    on public.recipes for update
    to anon, authenticated
    using (image like 'https://firebasestorage.googleapis.com/%')
    with check (image like '%/storage/v1/object/public/recipe-images/%');
