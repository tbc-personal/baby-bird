import { useRef, useState } from 'react';
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
import { MeasureDialog, type Measure } from './MeasureDialog';
import './ComparisonCard.css';

/**
 * The week's card, shared by Today and by `#/week/:n` (mockup 2).
 *
 * Heading order, top to bottom: the small lead line, the comparison name
 * large, then the scientific name. The week number itself isn't repeated here
 * — the screen header above the card already carries it. The article on the
 * lead line is derived from the comparison name, which already carries the
 * "egg" suffix for weeks 7–13 ("an American Robin egg").
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

  // Which measurement's trend chart is open, if any, plus which button opened
  // it so `MeasureDialog` can restore focus there on close.
  const [openMeasure, setOpenMeasure] = useState<Measure | null>(null);
  const lengthButtonRef = useRef<HTMLButtonElement>(null);
  const weightButtonRef = useRef<HTMLButtonElement>(null);

  return (
    <article className="card">
      {renderPhoto()}
      <div className="card__body">
        <h2 className="card__heading">
          <span className="card__lead">Your baby is roughly the size of {article}</span>
          {comparison}
          {row.scientificName ? (
            <span className="card__sci">{row.scientificName}</span>
          ) : null}
        </h2>

        <div className="dims">
          {row.lengthIn !== null ? (
            <button
              type="button"
              className="dim"
              ref={lengthButtonRef}
              onClick={() => setOpenMeasure('length')}
            >
              <b className="mono">{formatLength(row.lengthIn, units)}</b>
              <span>{lengthLabel(row.lengthMeasure)}</span>
            </button>
          ) : null}
          {row.weightOz !== null ? (
            <button
              type="button"
              className="dim"
              ref={weightButtonRef}
              onClick={() => setOpenMeasure('weight')}
            >
              <b className="mono">{formatWeight(row.weightOz, units)}</b>
              <span>
                {row.weightIsUpperBound
                  ? `weight, under ${exactWeight(row.weightOz, units)}`
                  : weightNeedsDetail(row.weightOz, units)
                    ? `weight (${exactWeight(row.weightOz, units)})`
                    : 'weight'}
              </span>
            </button>
          ) : null}
        </div>

        {openMeasure ? (
          <MeasureDialog
            measure={openMeasure}
            currentWeek={row.week}
            units={units}
            onClose={() => setOpenMeasure(null)}
            triggerRef={openMeasure === 'length' ? lengthButtonRef : weightButtonRef}
          />
        ) : null}

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
