# Thousandfold server (Supabase): setup guide

This package gives the standalone game real player accounts, cloud saves, leaderboards and server-side checks. It is for the version of the game you host yourself.

The published Claude link doesn't need it. That link uses its own built-in cloud. Its limit is that only you, your organization and invited Editors can upload to it.

## What's inside

| File | What it does |
|---|---|
| `migrations/0001_thousandfold.sql` | Tables, row-level security, and the validation and save functions. Run it once. It is safe to run again after updates. |
| `test/auth_stub.sql`, `test/tests.sql` | A local test harness: a stand-in for Supabase's `auth` schema plus test cases. You don't need these for Supabase itself. |

### Security model

- Players never write tables directly. Every write goes through two `SECURITY DEFINER` functions, which check who is calling and what they send:
  - `tf_put_save`: saves the player's own cloud save.
  - `tf_submit_scores`: posts leaderboard entries.
- A player can read only their own cloud save.
- Everyone can read the public leaderboard (the `tf_leaderboard` view).
- A player can also see their own refused entries and the reason each was refused.
- Admins see everything. The `admins` and `bans` tables can only be changed from the dashboard.
- **Rate limits:** one cloud save per 10 seconds, and one score post per 20 seconds, per player.

### Leaderboard checks (`tf_validate`)

The game runs the same checks before it posts, so honest players see problems before the server does. The server checks that:

- every number is present, finite and not negative
- level is between 1 and 99, and ascension is at most 1000
- the level matches the XP, using the game's own level curve (`tf_level_cost` matches `levelCost`)
- each skill's level matches its XP
- allocated plus unspent stat points are no more than the levels have given (20 per level, 60 points of slack)
- progress (ascensions × 99 + level) is no more than 15 + 60 per hour since the character was created
- **history:** since the last accepted post, progress grew no more than 15 + 60 per hour, and kills and gold earned did not go down
- achievement points, pet species and collection % are within the game's maximums
- the name follows the game's name rules

A post that fails is recorded in `submissions` with its reasons. The character's last good numbers stay on the board, and the player sees why the post was refused in the Cloud save tab.

**Limit:** a save is plain data on the player's device, so a determined cheater can always build a save that looks plausible. These checks stop impossible numbers, edited levels and sudden jumps. For anything that gets through, ban the player (see below).

## Setup (about 10 minutes)

1. **Create a project.** Create a free account at supabase.com and click **New project**. Pick a region near your players and save the database password somewhere safe.
2. **Run the schema.** Open **SQL Editor → New query**, paste all of `migrations/0001_thousandfold.sql`, and click **Run**. You should see "Success. No rows returned".
3. **Turn on email sign-in.** In **Authentication → Providers → Email**:
   - Keep it enabled.
   - For a small closed beta, you can turn **Confirm email** off so players can sign in right away.
   - If you leave confirmation on, players get an email and then sign in.
4. **Copy your keys.** In **Project Settings → API**, copy the **Project URL** and the **anon public** key.
   - The anon key is meant to be public. The security rules protect the data.
   - **Never** put the `service_role` key in the game.
5. **Connect the game.** Choose one of these:
   - **Quick test:** in the game, open **Cloud save → Thousandfold server (advanced)**, paste the URL and anon key, and click **Save and reconnect**.
   - **For release:** put both values in `CLOUD_CFG` at the top of `src/cloud.js` and rebuild with `node build.js`. Every player is then connected automatically.
6. **Make yourself an admin (optional).** Create your own account in the game first. Then, in the SQL editor, run:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'you@example.com';
   ```

## Moderation

Run these in the SQL editor.

**Hide a player from the leaderboard:**

```sql
insert into public.bans (user_id, reason)
select id, 'edited save' from auth.users where email = 'cheater@example.com';
```

**Unhide them:**

```sql
delete from public.bans where user_id = '...';
```

**See refused posts:**

```sql
select * from public.submissions
where array_length(flags, 1) > 0
order by at desc
limit 50;
```

## When the game's content changes

`tf_config` holds the numbers the checks need (level curve, maximum achievement points, number of pet species). After an update that adds achievements or pets, update these values. The game shows the new totals on its Achievements and Collection tabs.

```sql
update public.tf_config set value = 1925 where key = 'ach_max';
update public.tf_config set value = 50 where key = 'species_max';
```

You can also re-run the migration file after editing the values at its top.

## Testing locally (optional)

With PostgreSQL 14 or newer:

```bash
psql -f test/auth_stub.sql
psql -f migrations/0001_thousandfold.sql
psql -f test/tests.sql
```

The tests check that:

- level maths matches the game
- saves are private and rate-limited
- an honest entry is ranked and a cheating one is refused
- direct table writes are refused
- bans hide players from the public board but not from admins
- a sudden level jump is refused while the last good numbers stay on the board

## Notes for the full multiplayer build

This package covers Phase 9: accounts, cloud saves, leaderboards, security rules and server checks. Friends, mail and trading (Phase 10) and the auction house (Phase 11) will add tables to the same project.

At that point, the most valuable things (gold transfers and trades) must be done by the server, not reported by the client. That is the main reason to move to the React + TypeScript + Supabase app.
