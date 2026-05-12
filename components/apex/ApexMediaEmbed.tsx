import React from 'react';
import { youtubeWatchToEmbed, isPdfHttpUrl } from '../../utils/courseMedia';

type ApexMediaEmbedProps = {
  url: string;
  title: string;
};

function googleDriveToPreviewUrl(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!/drive\.google\.com$/i.test(url.hostname) && !/docs\.google\.com$/i.test(url.hostname)) {
      return null;
    }
    const fileIdFromPath = url.pathname.match(/\/file\/d\/([^/]+)\//)?.[1];
    const fileIdFromQuery = url.searchParams.get('id');
    const fileId = fileIdFromPath || fileIdFromQuery;
    if (!fileId) return null;
    return `https://drive.google.com/file/d/${fileId}/preview`;
  } catch {
    return null;
  }
}

function parseTikTokVideoId(raw: string): string | null {
  try {
    const url = new URL(raw);
    if (!/tiktok\.com$/i.test(url.hostname)) return null;
    const m = url.pathname.match(/\/video\/(\d+)/);
    return m?.[1] ?? null;
  } catch {
    return null;
  }
}

/** Lecteur média APEX (YouTube / Vimeo / PDF / Drive / TikTok) intégré dans l’app. */
export function ApexMediaEmbed({ url, title }: ApexMediaEmbedProps) {
  const trimmed = url.trim();
  if (!trimmed) {
    return (
      <p className="text-sm text-slate-500">
        Aucun média configuré pour cette leçon.
      </p>
    );
  }

  const youTube = youtubeWatchToEmbed(trimmed);
  if (youTube) {
    return (
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
        <iframe
          title={title}
          src={`${youTube}?rel=0`}
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  const vimeoMatch = trimmed.match(/^https?:\/\/(www\.)?vimeo\.com\/(\d+)/i);
  if (vimeoMatch) {
    const vimeoId = vimeoMatch[2];
    return (
      <div className="relative aspect-video w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
        <iframe
          title={title}
          src={`https://player.vimeo.com/video/${vimeoId}`}
          className="absolute inset-0 h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  if (isPdfHttpUrl(trimmed) || trimmed.startsWith('data:application/pdf')) {
    return (
      <div className="relative mt-2 aspect-[4/3] min-h-[280px] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <iframe title={title} src={trimmed} className="absolute inset-0 h-full w-full" />
      </div>
    );
  }

  const isDrive =
    /https?:\/\/(drive\.google\.com|docs\.google\.com|onedrive\.live\.com|sharepoint\.com)\//i.test(trimmed);
  const isTikTok = /https?:\/\/(www\.)?tiktok\.com\//i.test(trimmed);

  if (isDrive) {
    const drivePreview = googleDriveToPreviewUrl(trimmed);
    if (drivePreview) {
      return (
        <div className="relative mt-2 aspect-[4/3] min-h-[280px] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
          <iframe
            title={title}
            src={drivePreview}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; fullscreen"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Lien Google Drive non reconnu</p>
        <p className="mt-1 text-xs">
          Veillez à utiliser un lien de fichier Google Drive (format{' '}
          <code className="rounded bg-amber-100 px-1 text-[10px]">/file/d/&lt;ID&gt;/view</code> ou équivalent). Le
          lecteur APEX intègre ce fichier sans ouvrir un nouvel onglet.
        </p>
        <p className="mt-2 break-all text-xs text-amber-800">{trimmed}</p>
      </div>
    );
  }

  if (isTikTok) {
    const videoId = parseTikTokVideoId(trimmed);
    if (videoId) {
      return (
        <div className="relative aspect-[9/16] w-full max-w-[360px] overflow-hidden rounded-xl border border-slate-200 bg-black shadow-sm">
          <iframe
            title={title}
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            className="absolute inset-0 h-full w-full"
            allow="encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        </div>
      );
    }
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p className="font-semibold">Vidéo TikTok non intégrable</p>
        <p className="mt-1 text-xs">
          Certains liens TikTok ne sont pas directement intégrables via iframe. Utilisez un lien public de vidéo ou un
          enregistrement exporté en MP4 dans un lecteur interne APEX (phase ultérieure).
        </p>
        <p className="mt-2 break-all text-xs text-amber-800">{trimmed}</p>
      </div>
    );
  }

  // Hôtes pour lesquels un iframe générique reste acceptable (oEmbed ou prévisualisation).
  let embedAsGenericIframe = false;
  try {
    const u = new URL(trimmed);
    const host = u.hostname.toLowerCase();
    const allowedHosts = [
      'docs.google.com',
      'miro.com',
      'figma.com',
      'notion.so',
      'www.notion.so',
      'onedrive.live.com',
      'sharepoint.com',
    ];
    embedAsGenericIframe = allowedHosts.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    embedAsGenericIframe = false;
  }

  if (embedAsGenericIframe) {
    return (
      <div className="relative mt-2 aspect-[4/3] min-h-[280px] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
        <iframe title={title} src={trimmed} className="absolute inset-0 h-full w-full" />
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <p className="font-semibold">Contenu externe non intégré</p>
      <p className="mt-1 text-xs">
        Le lecteur APEX gère en priorité les vidéos YouTube / Vimeo, les PDF et certains hôtes intégrables. Pour ce
        lien, le lecteur unifié APEX (phase 3) pourra offrir une expérience dédiée.
      </p>
      <p className="mt-2 break-all text-xs text-amber-800">
        {trimmed}{' '}
        <a
          href={trimmed}
          target="_blank"
          rel="noreferrer"
          className="ml-1 text-[11px] font-medium underline decoration-amber-600"
        >
          Ouvrir dans un onglet
        </a>
      </p>
    </div>
  );
}

/** Lecteur YouTube intégré (compatibilité avec le shell APEX). */
export function ApexYouTubeEmbed({ url, title }: { url: string; title: string }) {
  return <ApexMediaEmbed url={url} title={title} />;
}

/** PDF dans l’app (iframe). Préférer URL signée / proxy Drive côté backend pour les fichiers privés. */
export function ApexPdfEmbed({ src, title }: { src: string; title: string }) {
  return (
    <div className="relative mt-2 aspect-[4/3] min-h-[280px] w-full max-w-3xl overflow-hidden rounded-xl border border-slate-200 bg-slate-50 shadow-sm">
      <iframe title={title} src={src} className="absolute inset-0 h-full w-full" />
    </div>
  );
}

