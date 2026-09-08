import { useState } from 'react';
import { buildShareLink } from '../lib/storage';
import type { Dating } from '../lib/gestation';

/**
 * "Copy a shareable link". Lives on Setup, beside the date it shares, rather
 * than on Today: it is a thing you do once when you set the app up, not
 * something you want under the week card every day.
 *
 * The link it copies is always in due-date mode (see `buildShareLink`).
 */
export function ShareLink({ dating }: { dating: Dating }) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="share">
      <button
        type="button"
        className="btn btn--quiet"
        onClick={() => {
          const link = buildShareLink(window.location.href, dating);
          void copy(link).then((ok) => {
            setCopied(ok);
            window.setTimeout(() => {
              setCopied(false);
            }, 2500);
          });
        }}
      >
        Copy a shareable link
      </button>
      <p className="small" role="status">
        {copied ? 'Link copied. It carries the due date only.' : ' '}
      </p>
    </div>
  );
}

/**
 * `navigator.clipboard` needs a secure context and can be refused. The fallback
 * selects a temporary textarea, which works in every browser the app targets.
 */
async function copy(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const field = document.createElement('textarea');
      field.value = text;
      field.setAttribute('readonly', '');
      field.style.position = 'fixed';
      field.style.opacity = '0';
      document.body.appendChild(field);
      field.select();
      const ok = document.execCommand('copy');
      document.body.removeChild(field);
      return ok;
    } catch {
      return false;
    }
  }
}
