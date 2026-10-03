-- ============================================================
-- BLOCKWORLD FRIENDS SYSTEM
-- Complete database setup
-- ============================================================


-- ============================================================
-- FRIENDSHIPS TABLE
-- ============================================================

create table if not exists public.friendships (
    id uuid primary key default gen_random_uuid(),

    requester_id uuid not null
        references public.profiles(id)
        on delete cascade,

    receiver_id uuid not null
        references public.profiles(id)
        on delete cascade,

    status text not null default 'pending'
        check (status in ('pending', 'accepted')),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    -- A user cannot send a friend request to themselves.
    constraint friendships_no_self_friend
        check (requester_id <> receiver_id)
);


-- ============================================================
-- PREVENT DUPLICATE FRIENDSHIPS / REQUESTS
--
-- This treats A -> B and B -> A as the same pair.
-- ============================================================

create unique index if not exists friendships_unique_pair
on public.friendships (
    least(requester_id, receiver_id),
    greatest(requester_id, receiver_id)
);


-- ============================================================
-- INDEXES
-- ============================================================

create index if not exists friendships_requester_idx
on public.friendships(requester_id);

create index if not exists friendships_receiver_idx
on public.friendships(receiver_id);

create index if not exists friendships_status_idx
on public.friendships(status);


-- ============================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================

alter table public.friendships
enable row level security;


-- ============================================================
-- REMOVE OLD POLICIES
--
-- This makes the script safe to run again.
-- ============================================================

drop policy if exists
"Users can view their own friendships"
on public.friendships;

drop policy if exists
"Users can send friend requests"
on public.friendships;

drop policy if exists
"Users can respond to friend requests"
on public.friendships;

drop policy if exists
"Users can remove friendships"
on public.friendships;


-- ============================================================
-- SELECT POLICY
--
-- Users can only see friendship records involving themselves.
-- ============================================================

create policy
"Users can view their own friendships"

on public.friendships

for select

to authenticated

using (
    auth.uid() = requester_id
    or
    auth.uid() = receiver_id
);


-- ============================================================
-- INSERT POLICY
--
-- Users can only send requests as themselves.
-- ============================================================

create policy
"Users can send friend requests"

on public.friendships

for insert

to authenticated

with check (
    auth.uid() = requester_id
    and
    requester_id <> receiver_id
);


-- ============================================================
-- UPDATE POLICY
--
-- Only the receiver can respond to a friend request.
--
-- Example:
--
-- Lazy sends request to Alex
-- Lazy = requester
-- Alex = receiver
--
-- Alex can change:
-- pending -> accepted
-- ============================================================

create policy
"Users can respond to friend requests"

on public.friendships

for update

to authenticated

using (
    auth.uid() = receiver_id
)

with check (
    auth.uid() = receiver_id
);


-- ============================================================
-- DELETE POLICY
--
-- Either person can remove a request or friendship.
-- ============================================================

create policy
"Users can remove friendships"

on public.friendships

for delete

to authenticated

using (
    auth.uid() = requester_id
    or
    auth.uid() = receiver_id
);


-- ============================================================
-- UPDATED_AT FUNCTION
-- ============================================================

create or replace function public.update_friendships_updated_at()
returns trigger
language plpgsql
as $$
begin
    new.updated_at = now();
    return new;
end;
$$;


-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

drop trigger if exists friendships_updated_at
on public.friendships;


create trigger friendships_updated_at

before update
on public.friendships

for each row

execute function public.update_friendships_updated_at();


-- ============================================================
-- DONE
-- ============================================================