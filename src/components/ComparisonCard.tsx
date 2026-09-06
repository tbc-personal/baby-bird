import type { WeekRow } from '../lib/schema';
import type { Units } from '../lib/storage';
import {
  exactWeight,
  formatLength,
  formatWeight,
  indefiniteArticle,
  lengthLabel,
  weightNeedsDetail,
} from '../lib/measures';
import { isConventionSwitchWeek } from '../lib/gestation';
import { CommonsImage } from './CommonsImage';
import { FactList } from './FactList';
import { ImageCredit } from './ImageCredit';
import { MacaulayEmbed, PhotoComing } from './MacaulayEmbed';
import './ComparisonCard.css';

/**
 * The week's card, shared by Today and by `#/week/:n` (mockup 2).
 *
 * Heading order, top to bottom: "Week N" in italics, the small lead line, the
 * comparison name large, then the scientific name. The article on the lead line
 * is derived from the comparison name, which already carries the "egg" suffix
 * for weeks 7–13 ("an American Robin egg").
 */
export function ComparisonCard({
  row,
  units,
  reviewMode,
  base,
}: {
  row: WeekRow;
  units: Units;
  reviewMode: boolean;
  base: string;
}) {
  const comparison = row.comparison ?? 'this week';
  const article = indefiniteArticle(comparison);

  return (
    <article className="card">
      {renderPhoto()}
      <div className="card__body">
        <h2 className="card__heading">
          <span className="card__week">Week {row.week}</span>
          <span className="card__lead">Your baby is roughly the size of {article}</span>
          {comparison}
          {row.scientificName ? (
            <span className="card__sci">{row.scientificName}</span>
          ) : null}
        </h2>

        <div className="dims">
          {row.lengthIn !== null ? (
            <div className="dim">
              <b className="mono">{formatLength(row.lengthIn, units)}</b>
              <span>{lengthLabel(row.lengthMeasure)}</span>
            </div>
          ) : null}
          {row.weightOz !== null ? (
            <div className="dim">
              <b className="mono">{formatWeight(row.weightOz, units)}</b>
              <span>
                {row.weightIsUpperBound
                  ? `weight, under ${exactWeight(row.weightOz, units)}`
                  : weightNeedsDetail(row.weightOz, units)
                    ? `weight (${exactWeight(row.weightOz, units)})`
                    : 'weight'}
              </span>
            </div>
          ) : null}
        </div>

        {isConventionSwitchWeek(row.week) ? (
          <p className="note">
            Length is measured crown to rump through week 20 and head to heel from week 21,
            which is why the number jumps.
          </p>
        ) : null}

        {row.proposed ? (
          <p className="note">This comparison is a proposal, not yet signed off.</p>
        ) : null}

        <FactList facts={row.facts} reviewMode={reviewMode} />

        {row.allAboutBirdsSlug ? (
          <p className="small">
            <a
              href={`https://www.allaboutbirds.org/guide/${row.allAboutBirdsSlug}/overview`}
            >
              More at All About Birds →
            </a>
          </p>
        ) : row.wikipediaTitle ? (
          <p className="small">
            <a href={`https://en.wikipedia.org/wiki/${row.wikipediaTitle}`}>
              More on Wikipedia →
            </a>
          </p>
        ) : null}

        <ImageCredit image={row.image} />
      </div>
    </article>
  );

  function renderPhoto() {
    const image = row.image;
    const kind = row.kind ?? 'bird';
    const alt = image?.altText ?? `${comparison}, photograph`;

    if (image?.provider === 'macaulay' && image.mlAssetId) {
      return <MacaulayEmbed assetId={image.mlAssetId} kind={kind} altText={alt} />;
    }
    if (image?.provider === 'commons' && image.file) {
      return <CommonsImage image={image} base={base} />;
    }
    // No asset curated yet: the kind silhouette, distinct from the offline goose.
    return <PhotoComing kind={kind} />;
  }
}
