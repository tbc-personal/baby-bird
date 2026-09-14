import { useRef, useState } from 'react';
import type { WeekRow } from '../lib/schema';
import type { Units } from '../lib/storage';
import {
  formatLength,
  formatWeight,
  indefiniteArticle,
  lengthLabel,
  weightDetail,
  weightNeedsDetail,
} from '../lib/measures';
import { isConventionSwitchWeek } from '../lib/gestation';
import { CommonsImage } from './CommonsImage';
import { FactList } from './FactList';
import { ImageCredit } from './ImageCredit';
import { PhotoComing } from './PhotoFrame';
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
                {row.weightIsUpperBound || weightNeedsDetail(row.weightOz, units)
                  ? weightDetail(row.weightOz, units, row.weightIsUpperBound)
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
            Fetal length is measured crown-to-rump through week 20, then head-to-heel from week 21.
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
      </div>
    </article>
  );

  function renderPhoto() {
    const image = row.image;
    const kind = row.kind ?? 'bird';

    const credit = <ImageCredit image={image} />;

    if (image?.provider === 'commons' && image.file) {
      return <CommonsImage image={image} base={base} credit={credit} />;
    }
    // No photo sourced for this week yet (weeks 7, 9, 12, 13): the kind silhouette.
    return <PhotoComing kind={kind} />;
  }
}
