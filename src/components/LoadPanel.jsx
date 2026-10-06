import { useRef } from 'react';

export default function LoadPanel({ onLoadDemo, onLoadFiles, busy, status }) {
  const fileRef = useRef(null);
  const folderRef = useRef(null);

  const handle = (e) => {
    if (e.target.files?.length) onLoadFiles(e.target.files);
    e.target.value = ''; // allow re-selecting the same files
  };

  return (
    <section className="card">
      <h2>Load images</h2>
      <div className="load-buttons">
        <button className="btn primary" onClick={onLoadDemo} disabled={busy}>
          Load demo Images
        </button>
        <button className="btn" onClick={() => fileRef.current?.click()} disabled={busy}>
          Open DICOM files
        </button>
        <button className="btn" onClick={() => folderRef.current?.click()} disabled={busy}>
          Open folder
        </button>
      </div>

      <input ref={fileRef} type="file" multiple hidden onChange={handle} />
      <input
        ref={folderRef}
        type="file"
        multiple
        hidden
        // non-standard but widely supported attribute for choosing a whole folder
        webkitdirectory=""
        onChange={handle}
      />

      <p className={`status ${status.type}`}>{busy ? 'Working…' : status.text}</p>
      <p className="muted small">
        The demo is a <strong>synthetic phantom</strong> (no patient data). If you use real scans,
        use public, de-identified data only (e.g. The Cancer Imaging Archive).
      </p>
    </section>
  );
}
