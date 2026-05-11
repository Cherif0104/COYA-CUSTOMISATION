export function formatDriveSize(bytes?: number | null) {
  if (typeof bytes !== 'number' || Number.isNaN(bytes)) return '';
  if (bytes < 1024) return `${bytes} o`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  if (mb < 1024) return `${mb.toFixed(1)} MB`;
  const gb = mb / 1024;
  return `${gb.toFixed(1)} GB`;
}

export function fileIconClass(mime?: string | null, fileName?: string) {
  const n = (fileName || '').toLowerCase();
  const m = (mime || '').toLowerCase();
  if (n.endsWith('.pdf')) return 'fa-file-pdf text-red-600';
  if (n.endsWith('.xlsx') || n.endsWith('.xls') || n.endsWith('.csv')) return 'fa-file-excel text-emerald-600';
  if (n.endsWith('.pptx') || n.endsWith('.ppt')) return 'fa-file-powerpoint text-orange-500';
  if (n.endsWith('.png') || n.endsWith('.jpg') || n.endsWith('.jpeg') || n.endsWith('.webp') || m.startsWith('image/'))
    return 'fa-file-image text-sky-600';
  if (n.endsWith('.mp4') || n.endsWith('.mov') || m.startsWith('video/')) return 'fa-file-video text-violet-600';
  if (n.endsWith('.doc') || n.endsWith('.docx')) return 'fa-file-word text-blue-600';
  return 'fa-file text-slate-500';
}
