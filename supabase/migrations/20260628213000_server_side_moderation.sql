-- Server-side content moderation (M5).
-- ----------------------------------------------------------------------------
-- The frontend already runs containsBannedWord() before writes, but a direct
-- API caller can bypass it. These triggers enforce the same banned-word filter
-- in the database for club + profile user-generated text.
--
-- Mirrors src/lib/moderation.js: same word list, leet-normalize + collapse
-- repeats + a light (non-leet) pass, with ONE safe deviation. The collapse pass
-- reduces an all-same-letter word like 'kkk' to 'k', which as a substring would
-- match almost any text; so the normalized substring check is skipped when the
-- normalized banned word is under 3 chars ('kkk' is still caught by the
-- exact-letters pass). This keeps the DB filter from rejecting legitimate writes
-- the client would accept. System context (auth.uid() is null, e.g.
-- handle_new_user on Discord signup) is intentionally skipped so signups never
-- hard-fail.

create or replace function app_private.moderation_words()
returns text[] language sql immutable as $$
  select array[
    -- Racial slurs
    'nigger','nigga','niggr','nigr','n1gg','n!gg','nlgg',
    'spic','sp1c','sp!c','sp1ck',
    'chink','ch1nk','ch!nk',
    'kike','k1ke','k!ke',
    'wetback','wetb4ck',
    'gook','g00k','g0ok',
    'coon','c00n','c0on',
    'cracker','cr4ck3r',
    'sandnigger','sandn1gg',
    'paki','p4k1',
    -- Homophobic / LGBTQ+ derogatory
    'faggot','fag','f4gg0t','f4g','f4gg','f@g','f@gg0t','f@ggot',
    'dyke','d1ke','d!ke',
    'tranny','tr4nny','tr@nny',
    'queer','qu33r','qu##r',
    -- Sexist / misogynistic
    'cunt','cuntface','cunty','cuntboy',
    'bitch','b1tch','b!tch','b1tchface',
    'whore','wh0re','wh0r3','whor3',
    'slut','sl1t','sl!t','sl00t',
    'skank','sk4nk',
    'twat','tw4t','tw@t',
    'pussy','pu55y','pus5y',
    'bimbo','b1mb0',
    -- General profanity / offensive
    'retard','retarded','r3t4rd','r3tard','r#tard',
    'mongoloid','mong0l01d',
    'midget','m1dg3t',
    -- Sexual / pedophilia
    'pedophile','paedophile','ped0','pead0','pedobear',
    'rapist','r4p1st','r@pist',
    'rape','r4p3','r@pe',
    -- Hate group / nazi
    'nazi','n4z1','n@z1',
    'hitler','h1tl3r','h!tler',
    'kkk','k.k.k',
    'swastika','sw4st1k4',
    'fascist','f4sc1st',
    -- Other offensive
    'wop','w0p',
    'gypsy','g1psy','gypsycurse',
    'trailer trash',
    'inbred','1nbr3d',
    'incest','1nc3st'
  ]::text[];
$$;

-- Leetspeak/normalized form: lowercase, substitute lookalikes, strip non-alpha,
-- collapse runs of the same char to one.
create or replace function app_private.moderation_normalize(input text)
returns text language plpgsql immutable as $$
declare s text;
begin
  s := lower(coalesce(input, ''));
  s := translate(s, '0134578@!$#', 'oieastbaish');
  s := regexp_replace(s, '[^a-z]', '', 'g');
  s := regexp_replace(s, '(.)\1+', '\1', 'g');
  return s;
end;
$$;

-- Light form: lowercase + strip non-alpha only (no leet substitution).
create or replace function app_private.moderation_light(input text)
returns text language sql immutable as $$
  select regexp_replace(lower(coalesce(input, '')), '[^a-z]', '', 'g');
$$;

create or replace function app_private.contains_banned_word(input text)
returns boolean language plpgsql immutable as $$
declare
  light text := app_private.moderation_light(input);
  w text;
  nw text;
  word text;
  word_light text;
  word_norm text;
begin
  if coalesce(input, '') = '' then
    return false;
  end if;

  -- Multi-word / special-char banned terms (e.g. 'trailer trash', 'k.k.k'):
  -- substring match on light text. Word-splitting would break these, and the
  -- Scunthorpe risk for distinctive multi-word sequences is negligible.
  foreach w in array app_private.moderation_words() loop
    if position(' ' in w) > 0 or position('.' in w) > 0 then
      nw := app_private.moderation_light(w);
      if nw <> '' and position(nw in light) > 0 then
        return true;
      end if;
    end if;
  end loop;

  -- Single-word banned terms: split input into words and check exact equality
  -- on both light and normalized forms. Mirrors the JS client's word-boundary
  -- matching to avoid Scunthorpe false positives (e.g. 'grape' ≠ 'rape').
  for word in
    select t.w
    from regexp_split_to_table(lower(coalesce(input, '')), '[^a-z0-9@!$#]+') as t(w)
    where t.w <> ''
  loop
    word_light := app_private.moderation_light(word);
    word_norm  := app_private.moderation_normalize(word);
    foreach w in array app_private.moderation_words() loop
      if position(' ' in w) > 0 or position('.' in w) > 0 then
        continue;
      end if;
      -- Exact-letters match (catches literal 'kkk', 'rape', etc.)
      if word_light = w then
        return true;
      end if;
      -- Normalized match (catches leet 'r4p3' → 'rape'); guarded for short forms
      nw := app_private.moderation_normalize(w);
      if length(nw) >= 3 and word_norm = nw then
        return true;
      end if;
    end loop;
  end loop;

  return false;
end;
$$;

revoke all on function app_private.moderation_words() from public, anon, authenticated;
revoke all on function app_private.moderation_normalize(text) from public, anon, authenticated;
revoke all on function app_private.moderation_light(text) from public, anon, authenticated;
revoke all on function app_private.contains_banned_word(text) from public, anon, authenticated;

-- Clubs: name / tag / tagline / about
create or replace function app_private.enforce_club_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if app_private.contains_banned_word(new.name)
     or app_private.contains_banned_word(new.tag)
     or app_private.contains_banned_word(new.tagline)
     or app_private.contains_banned_word(new.about) then
    raise exception 'Club text contains language that is not allowed.';
  end if;
  return new;
end;
$$;

revoke all on function app_private.enforce_club_moderation() from public, anon, authenticated;

drop trigger if exists club_moderation on public.clubs;
create trigger club_moderation
  before insert or update of name, tag, tagline, about on public.clubs
  for each row execute function app_private.enforce_club_moderation();

-- Profiles: display_name / gamertag
create or replace function app_private.enforce_profile_moderation()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if app_private.contains_banned_word(new.display_name)
     or app_private.contains_banned_word(new.gamertag) then
    raise exception 'Profile text contains language that is not allowed.';
  end if;
  return new;
end;
$$;

revoke all on function app_private.enforce_profile_moderation() from public, anon, authenticated;

drop trigger if exists profile_moderation on public.profiles;
create trigger profile_moderation
  before insert or update of display_name, gamertag on public.profiles
  for each row execute function app_private.enforce_profile_moderation();
