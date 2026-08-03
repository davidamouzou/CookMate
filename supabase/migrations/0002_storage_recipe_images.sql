-- Public bucket holding recipe photos (migrated from Firebase Storage).

insert into storage.buckets (id, name, public)
values ('recipe-images', 'recipe-images', true)
on conflict (id) do update set public = true;

create policy "Recipe images are publicly readable"
    on storage.objects for select
    to anon, authenticated
    using (bucket_id = 'recipe-images');

-- Mirrors the previous Firebase Storage behaviour: the browser uploads the
-- AI-generated photo directly. Tighten this alongside the recipes insert policy.
create policy "Anyone can upload a recipe image"
    on storage.objects for insert
    to anon, authenticated
    with check (bucket_id = 'recipe-images');
