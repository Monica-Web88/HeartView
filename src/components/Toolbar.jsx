import { TOOLS } from '../cornerstone/tools.js';
import { WINDOW_PRESETS } from '../cornerstone/viewport.js';

export default function Toolbar({
  activeTool,
  onSelectTool,
  onPreset,
  onInvert,
  onReset,
  onClear,
  disabled,
}) {
  return (
    <div className="toolbar">
      <div className="tool-group" role="group" aria-label="Tools">
        {TOOLS.map((tool) => (
          <button
            key={tool.name}
            className={`btn${activeTool === tool.name ? ' active' : ''}`}
            onClick={() => onSelectTool(tool.name)}
            title={`${tool.label} (${tool.key})`}
          >
            {tool.label}
            <kbd>{tool.key}</kbd>
          </button>
        ))}
      </div>

      <div className="tool-group" role="group" aria-label="Window presets">
        {WINDOW_PRESETS.map((p) => (
          <button
            key={p.id}
            className="btn subtle"
            disabled={disabled}
            onClick={() => onPreset(p)}
            title={`W ${p.width} / L ${p.level}`}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="tool-group" role="group" aria-label="Actions">
        <button className="btn subtle" disabled={disabled} onClick={onInvert}>Invert</button>
        <button className="btn subtle" disabled={disabled} onClick={onReset}>Reset view</button>
        <button className="btn danger" disabled={disabled} onClick={onClear}>Clear ROIs</button>
      </div>
    </div>
  );
}
