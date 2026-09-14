# Content licensing research

Date: 2026-09-06. Findings are from public terms pages and help-center articles
found via search; the sandbox used for this session could not fetch
cornell.edu, allaboutbirds.org, audubon.org, or datayze.com directly, so the
quotes below are paraphrases from search snippets and must be re-verified
against the live pages before launch. Links to the authoritative pages are
included for that purpose.

## Summary table

| Source                                | Photos                                                                                                                                                   | Text ("Cool Facts" etc.)                                             | API                                                                      | Verdict for this app                                                                           |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------- |
| All About Birds (Cornell Lab)         | All rights reserved; photos are Macaulay Library assets                                                                                                  | All rights reserved                                                  | None                                                                     | Link out only. Do not copy images or text.                                                     |
| Macaulay Library (Cornell Lab)        | Contributor-owned; free for research and some education; embed widget allowed for non-commercial use; anything revenue-generating needs a license ticket | n/a                                                                  | Search UI only, no public media API                                      | Viable only if the app is strictly non-commercial, via the official embed iframe. Fragile.     |
| Audubon Guide to North American Birds | Personal, non-commercial copying only; other uses need written permission (support@audubon.org)                                                          | Same                                                                 | Unofficial scrapers only                                                 | Link out only.                                                                                 |
| Wikimedia Commons                     | Per-file CC0 / CC BY / CC BY-SA; license metadata available via API                                                                                      | n/a                                                                  | MediaWiki API (`prop=imageinfo&iiprop=extmetadata`)                      | **Recommended image source.** Curate one file per comparison at build time, store attribution. |
| Wikipedia                             | n/a                                                                                                                                                      | CC BY-SA 4.0; must attribute, link, and share-alike any derived text | REST `page/summary` endpoint returns extract plus a lead-image thumbnail | Usable for facts if we accept CC BY-SA on that text.                                           |
| iNaturalist                           | Default CC BY-NC; some CC BY / CC0                                                                                                                       | n/a                                                                  | Public API with license filter                                           | Fallback image source; filter to CC BY / CC0 only.                                             |
| Datayze                               | n/a                                                                                                                                                      | Copyrighted site content; no reuse terms found                       | None                                                                     | Do not scrape. Re-derive models from primary literature (see `datayze-features.md`).           |

## Cornell Lab of Ornithology / All About Birds

- Governing document: [Cornell Lab terms of use](https://www.birds.cornell.edu/home/terms-of-use/), which covers allaboutbirds.org, ebird.org and Merlin.
- All About Birds species-page photos are Macaulay Library assets, credited to individual photographers who retain copyright. Cornell's own licensing agreement with contributors says Cornell will not sublicense media to third parties for commercial use without contributor permission ([eBird Media Licensing Agreement](https://support.ebird.org/en/support/solutions/articles/48000952192-cornell-media-licensing-agreement)).
- Species text (Cool Facts, ID, Life History) is Cornell copyright. There is no API and no reuse license. Copying Cool Facts into the app is infringement.
- **What is permitted without asking:** deep-linking to the species page. Pattern: `https://www.allaboutbirds.org/guide/<Common_Name_With_Underscores>/overview` (verify slugs; e.g. `Coopers_Hawk`, `Ruby-throated_Hummingbird`).

## Macaulay Library

- [Request and download media](https://support.ebird.org/en/support/solutions/articles/48001064551-using-and-requesting-media): free for research and some education; commercial use and "any use that generates revenue, including use by a for-profit company" requires a helpdesk ticket and possibly fees. Embedding via the Macaulay Library share/embed widget is allowed for non-commercial purposes.
- Contributors may opt individual assets into Creative Commons licenses ([eBird announcement](https://ebird.org/news/creative-commons-license-for-ebird-media)). Coverage is sparse and there is no public API to filter by license, so this is a manual, per-asset hunt.
- [Credit format](https://support.ebird.org/en/support/solutions/articles/48001064570-crediting-media): photographer name, "Macaulay Library at the Cornell Lab of Ornithology", and the ML asset number.
- Practical assessment: the embed route works only if the app is non-commercial, depends on Cornell's iframe staying stable, and adds third-party script/iframe weight to every screen. Not recommended for v1. Revisit if the project wants an official partnership; a single helpdesk ticket asking for a non-commercial license for ~43 images is cheap to send and may be granted.

## Audubon

**Re-verified against the live page on 2026-09-12** (HTTP 200, full text read), so
this section no longer carries the snippet caveat at the top of this file. The
earlier verdict stands, and the terms are more restrictive than the summary table
suggested.

[Audubon terms of use](https://www.audubon.org/terms-use). Four clauses matter, and
each one independently blocks this app:

- **Copyrights.** "All rights reserved. Except as specifically provided in these
  Terms of Use, no part of the Media may be reproduced, distributed, displayed,
  transmitted, stored in a retrieval system or used to create derivative works
  without prior consent of the copyright owner."
- **Permitted Use of Media Materials** names photographs explicitly, then limits
  any use to "personal and informational purposes only". A published app is not
  personal use.
- **"Materials may not be modified."** Downloading at 900px and re-encoding with
  sharp is a modification.
- **"No Materials may be used, copied or distributed separate from the
  accompanying text."** A photograph on a card, next to the project's own writing,
  is precisely that.

There is no Creative Commons option anywhere on the site and no API. Permission
requests go to support@audubon.org.

One nuance the old note got wrong in the other direction: it said the photos are
"all rights reserved to the photographers", implying Audubon could not grant
permission even if asked. The Posting Content clause takes from contributors a
"worldwide, royalty-free, non-exclusive, irrevocable, perpetual licence to use,
reproduce, modify, publish ... **sublicense** and create derivative works", so for
material that clause covers, Audubon does hold sublicensable rights. Whether
Audubon Photography Awards entries fall under it or under separate contest rules
has not been checked. Asking is therefore not obviously futile — but the ask is
large: this repository is public, so any grant would have to permit onward
redistribution by anyone who clones it, which is a sublicence, not a display
permission.

**Verdict unchanged: link out only.** Nothing here is usable without written
permission, and Commons already covers the same weeks under licences that need no
correspondence.

## Wikimedia Commons (recommended)

- Every file carries machine-readable license metadata: `LicenseShortName`, `Artist`, `Credit`, `UsageTerms`, `AttributionRequired`, `LicenseUrl` under `extmetadata`.
- Attribution requirements: name the author, name the license with a link, link to the source file. CC BY-SA on a _photo_ does not force the app's code to be CC BY-SA; share-alike applies only to derivatives of the photo itself.
- Reuse guidance: [Commons:Reusing content outside Wikimedia](https://commons.wikimedia.org/wiki/Commons:Reusing_content_outside_Wikimedia).
- Plan: a one-time curation script (or manual pass) picks one Commons file per week, resolves the metadata, and writes `data/images.json` with URL, thumbnail, author, license, license URL, and source link. The app never calls Commons at runtime. Images are downloaded into the repo (or a CDN) at build time so the app works offline and is not dependent on Commons hotlinking, which Commons discourages at scale.

## Wikipedia text

- [Reusing Wikipedia content](https://en.wikipedia.org/wiki/Wikipedia:Reusing_Wikipedia_content): CC BY-SA 4.0. Any copied or adapted sentence must credit the article (link) and carry the license; adapted text must be released CC BY-SA.
- Practical assessment: fine for a "from Wikipedia" blurb with a link, awkward for a curated "fun fact" voice. Recommended approach for facts is original writing (author holds copyright) with an "Learn more at All About Birds" link. See ADR-004.

## Fetal size data and the CSV

- Facts (a length in inches at a gestational week) are not copyrightable in the US (Feist v. Rural). The bird comparison column is the project author's own creative pairing and is the project's own IP.
- The numeric columns match a widely republished average-fetal-size table (crown-rump length through week 20, crown-heel after). The app should cite Datayze as the source the author used and describe the measurement convention. Do not scrape Datayze for anything further.
