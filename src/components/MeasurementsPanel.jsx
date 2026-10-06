import { PLAQUE_TYPES, classifyPlaque } from '../utils/plaque.js';
import { removeAnnotationByUID } from '../cornerstone/annotations.js';
import { goToSlice } from '../cornerstone/viewport.js';

const TOOL_LABELS = {
  Length: 'Length',
  EllipticalROI: 'Ellipse ROI',
  RectangleROI: 'Rectangle ROI',
};

const fmt = (v, digits = 1) => (typeof v === 'number' && Number.isFinite(v) ? v.toFixed(digits) : '–');

function exportCsv(rows) {
  const header = ['id', 'type', 'slice', 'length_mm', 'area_mm2', 'mean_hu', 'std_hu', 'min_hu', 'max_hu', 'plaque_estimate'];
  const lines = rows.map((r, i) =>
    [
      i + 1,
      TOOL_LABELS[r.tool] || r.tool,
      r.slice ?? '',
      fmt(r.length, 2),
      fmt(r.area, 2),
      fmt(r.mean, 1),
      fmt(r.std, 1),
      fmt(r.min, 0),
      fmt(r.max, 0),
      classifyPlaque(r.mean)?.label ?? '',
    ]
      .map((c) => (c === '–' ? '' : c))
      .join(',')
  );
  const blob = new Blob([[header.join(','), ...lines].join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'heartview-measurements.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function MeasurementsPanel({ rows, onChanged }) {
  const rois = rows.filter((r) => typeof r.area === 'number');
  const lengths = rows.filter((r) => typeof r.length === 'number');
  const totalArea = rois.reduce((s, r) => s + r.area, 0);
  const avgHU = rois.length ? rois.reduce((s, r) => s + (r.mean ?? 0), 0) / rois.length : null;
  const longest = lengths.length ? Math.max(...lengths.map((r) => r.length)) : null;

  return (
    <section className="card">
      <div className="card-head">
        <h2>Measurements</h2>
        <button className="btn subtle small-btn" disabled={!rows.length} onClick={() => exportCsv(rows)}>
          Export CSV
        </button>
      </div>

      <div className="stats">
        <div className="stat"><span>ROIs</span><strong>{rois.length}</strong></div>
        <div className="stat"><span>Total area</span><strong>{rois.length ? `${fmt(totalArea)} mm²` : '–'}</strong></div>
        <div className="stat"><span>Avg HU</span><strong>{avgHU !== null ? fmt(avgHU, 0) : '–'}</strong></div>
        <div className="stat"><span>Longest</span><strong>{longest !== null ? `${fmt(longest)} mm` : '–'}</strong></div>
      </div>

      {rows.length === 0 ? (
        <p className="muted">Draw an ellipse, rectangle or length on the vessel to see live measurements.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Type</th><th>Slice</th><th>Result</th><th>Plaque*</th><th /></tr>
            </thead>
            <tbody>
              {rows.map((r, i) => {
                const plaque = classifyPlaque(r.mean);
                const isRoi = typeof r.area === 'number';
                return (
                  <tr key={r.uid} onClick={() => r.slice && goToSlice(r.slice - 1)} title="Click to jump to this slice">
                    <td>{i + 1}</td>
                    <td>{TOOL_LABELS[r.tool] || r.tool}</td>
                    <td>{r.slice ?? '–'}</td>
                    <td>
                      {isRoi ? (
                        <>
                          <div>{fmt(r.area)} {r.areaUnit}</div>
                          <div className="muted small">mean {fmt(r.mean, 0)} · SD {fmt(r.std, 0)} HU</div>
                        </>
                      ) : (
                        `${fmt(r.length)} ${r.lengthUnit}`
                      )}
                    </td>
                    <td>
                      {plaque ? (
                        <span className="chip" style={{ '--chip': plaque.color }}>{plaque.label}</span>
                      ) : '–'}
                    </td>
                    <td>
                      <button
                        className="icon-btn"
                        aria-label={`Delete measurement ${i + 1}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          removeAnnotationByUID(r.uid);
                          onChanged?.();
                        }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="legend">
        {PLAQUE_TYPES.map((p) => (
          <span key={p.id} className="chip" style={{ '--chip': p.color }}>
            {p.label} <em>{p.range}</em>
          </span>
        ))}
      </div>
      <p className="muted small">
        *Estimated from the ROI's mean HU for demonstration only. Contrast-filled lumen also reads
        high, so this is not a diagnosis.
      </p>
    </section>
  );
}
