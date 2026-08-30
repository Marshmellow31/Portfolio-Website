import { useEffect, useMemo, useState } from 'react';
import { FiDownload, FiExternalLink, FiShield } from 'react-icons/fi';

const CACHE_TTL = 60 * 60 * 1000;

function apkFromRelease(release) {
  const apk = release.assets?.find((asset) =>
    asset.name?.toLowerCase().endsWith('.apk')
    || asset.content_type === 'application/vnd.android.package-archive'
  );

  if (!apk) return null;

  const checksum = release.assets?.find((asset) =>
    asset.name?.toLowerCase().endsWith('.sha256')
  );

  return {
    version: release.tag_name?.replace(/^v/i, '') || release.name,
    title: release.name,
    publishedAt: release.published_at,
    releaseUrl: release.html_url,
    downloadUrl: apk.browser_download_url,
    size: apk.size,
    checksumUrl: checksum?.browser_download_url,
  };
}

function selectChannels(releases) {
  const published = releases.filter((release) => !release.draft);

  return {
    stable: published.filter((release) => !release.prerelease).map(apkFromRelease).find(Boolean) || null,
    preview: published.filter((release) => release.prerelease).map(apkFromRelease).find(Boolean) || null,
  };
}

function formatSize(bytes) {
  if (!Number.isFinite(bytes)) return null;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function formatDate(date) {
  if (!date) return null;
  return new Intl.DateTimeFormat('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(date));
}

function ReleaseCard({ channel, release }) {
  const isPreview = channel === 'preview';
  const meta = [formatSize(release.size), formatDate(release.publishedAt)].filter(Boolean).join(' · ');

  return (
    <article className="flex min-h-[210px] flex-col justify-between gap-7 border border-border bg-white/[0.025] p-[clamp(20px,3vw,32px)]">
      <div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <span className="font-mono text-[10px] tracking-[.18em] text-text-faint">
            {isPreview ? 'LATEST PREVIEW' : 'LATEST STABLE'}
          </span>
          <span className={`rounded-[3px] px-2 py-1 font-mono text-[9px] tracking-[.14em] ${
            isPreview ? 'border border-amber-300/35 text-amber-200' : 'bg-white text-black'
          }`}>
            {isPreview ? 'PRE-RELEASE' : 'RECOMMENDED'}
          </span>
        </div>

        <div className="text-[clamp(26px,3vw,38px)] font-semibold tracking-[-0.035em] text-text-bright">
          PayMatrix {release.version}
        </div>
        <div className="mt-2 font-mono text-[10px] tracking-[.08em] text-text-faint">
          ANDROID APK{meta ? ` · ${meta}` : ''}
        </div>
        {isPreview && (
          <p className="mb-0 mt-4 max-w-[520px] text-[13px] leading-relaxed text-text-dim">
            Newer native Android build for early testing. It may contain unfinished behaviour.
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <a
          href={release.downloadUrl}
          aria-label={`Download PayMatrix ${release.version} Android APK`}
          className="group inline-flex min-h-11 items-center gap-2 bg-white px-4 font-mono text-[11px] tracking-[.09em] text-black no-underline transition-colors hover:bg-white/85 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <FiDownload className="text-[16px]" aria-hidden="true" />
          DOWNLOAD APK
        </a>
        <a
          href={release.releaseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center gap-2 border border-border px-4 font-mono text-[10px] tracking-[.09em] text-text no-underline transition-colors hover:border-white/40"
        >
          RELEASE NOTES <FiExternalLink aria-hidden="true" />
        </a>
        {release.checksumUrl && (
          <a
            href={release.checksumUrl}
            className="inline-flex min-h-11 items-center gap-2 px-1 font-mono text-[10px] tracking-[.09em] text-text-dim no-underline hover:text-white"
          >
            <FiShield aria-hidden="true" /> CHECKSUM
          </a>
        )}
      </div>
    </article>
  );
}

export default function PayMatrixDownloads({ repo }) {
  const cacheKey = useMemo(() => `github-releases:${repo}`, [repo]);
  const [channels, setChannels] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey));
      if (cached?.savedAt > Date.now() - CACHE_TTL && cached.channels) {
        setChannels(cached.channels);
      }
    } catch {
      // Ignore unavailable or malformed browser storage and fetch fresh data.
    }

    async function loadReleases() {
      try {
        const response = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=20`, {
          headers: { Accept: 'application/vnd.github+json' },
          signal: controller.signal,
        });

        if (!response.ok) throw new Error(`GitHub returned ${response.status}`);

        const nextChannels = selectChannels(await response.json());
        if (!nextChannels.stable && !nextChannels.preview) throw new Error('No APK release assets found');

        setChannels(nextChannels);
        setFailed(false);
        try {
          localStorage.setItem(cacheKey, JSON.stringify({ savedAt: Date.now(), channels: nextChannels }));
        } catch {
          // The panel still works when browser storage is disabled.
        }
      } catch (error) {
        if (error.name !== 'AbortError') setFailed(true);
      }
    }

    loadReleases();
    return () => controller.abort();
  }, [cacheKey, repo]);

  const releasesUrl = `https://github.com/${repo}/releases`;

  return (
    <section id="paymatrix-downloads" className="scroll-mt-24 px-[clamp(20px,6vw,96px)] pb-[clamp(48px,6vw,88px)]">
      <div className="border-t border-border pt-[clamp(28px,4vw,44px)]">
        <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mono-label mb-3">Get PayMatrix</div>
            <h2 className="m-0 text-[clamp(28px,4vw,48px)] font-semibold tracking-[-0.04em] text-text-bright">
              Download for Android
            </h2>
          </div>
          <p className="m-0 max-w-[480px] text-[13px] leading-relaxed text-text-dim">
            Versions and files are pulled from verified PayMatrix GitHub Releases and refresh automatically.
          </p>
        </div>

        {channels ? (
          <div className="grid gap-px bg-border md:grid-cols-2">
            {channels.stable && <ReleaseCard channel="stable" release={channels.stable} />}
            {channels.preview && <ReleaseCard channel="preview" release={channels.preview} />}
          </div>
        ) : failed ? (
          <div className="border border-border bg-white/[0.025] p-6">
            <p className="m-0 text-[14px] leading-relaxed text-text-dim">
              Release details could not be refreshed right now. You can still download PayMatrix from its GitHub Releases page.
            </p>
            <a href={releasesUrl} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-2 font-mono text-[11px] tracking-[.09em] text-text no-underline hover:text-white">
              VIEW ALL RELEASES <FiExternalLink aria-hidden="true" />
            </a>
          </div>
        ) : (
          <div className="grid gap-px bg-border md:grid-cols-2" aria-label="Loading PayMatrix releases">
            {[0, 1].map((item) => (
              <div key={item} className="h-[210px] animate-pulse bg-white/[0.025] p-7">
                <div className="h-3 w-28 bg-white/10" />
                <div className="mt-8 h-9 w-52 bg-white/10" />
                <div className="mt-5 h-11 w-36 bg-white/10" />
              </div>
            ))}
          </div>
        )}

        <p className="mb-0 mt-4 font-mono text-[9px] leading-relaxed tracking-[.08em] text-text-faint">
          Android may ask you to allow installation from your browser. Review the release notes and checksum before installing.
        </p>
      </div>
    </section>
  );
}
