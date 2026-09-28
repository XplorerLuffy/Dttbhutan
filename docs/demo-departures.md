# Demo departure dates

The live database was seeded with **663 placeholder departures across all 29
packages** on 28 September 2026, so the Dates & Prices view has something to
show before the real calendar exists. They are demo data. Nobody has
committed to running a trip on any of them.

## What they look like

- Fourteen months out, starting the month after they were generated.
- Weighted to Bhutan's seasons: most departures in spring (Mar–May) and
  autumn (Sep–Nov), a handful in winter, **none in the monsoon** (Jun–Aug).
  Treks are excluded from the monsoon outright.
- Longer trips run less often — a 28-day trek got 13 dates, a 3-day tour 26.
- Roughly 79% Open, 14% Limited space, 7% Sold out, so the status styling is
  visible without every trip looking half full.
- Festival packages (slug containing `tshechu` or `festival`) carry a 25%
  premium and the note "Festival departure" on their festival-month dates —
  that is the case the price range in the sticky bar exists to show.

## Replacing them with the real calendar

Per package, in the admin: **Package tours → (a package) → Departure dates**.
Saving there replaces that package's list wholesale, so entering the real
dates removes the demo ones for that trip.

To clear every demo date at once and start from nothing:

```sql
DELETE FROM "Departure";
```

That is safe as long as no real dates have been entered yet. Once they have,
delete per package instead:

```sql
DELETE FROM "Departure" d
USING "Itinerary" i
WHERE d."itineraryId" = i.id AND i.slug = 'snowman-trek';
```

Enquiries that referenced a deleted departure survive — the relation is
`onDelete: SetNull`, and the subject line still names the dates.

## Regenerating

`prisma/seed-departures.ts` produces the same shape:

```bash
npm run db:seed:departures                        # local database
npm run db:seed:departures -- --allow-production  # anything else, deliberately
```

It skips packages that already have future departures, on the basis that a
real date beats a generated one; `--replace` overrides that and **will delete
hand-entered dates**. It is deterministic per package slug, so re-running
produces the same calendar rather than reshuffling it under someone who
bookmarked a date.
