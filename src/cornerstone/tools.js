import {
  ToolGroupManager,
  Enums as csToolsEnums,
  addTool,
  WindowLevelTool,
  PanTool,
  ZoomTool,
  StackScrollTool,
  LengthTool,
  EllipticalROITool,
  RectangleROITool,
} from '@cornerstonejs/tools';
import { RENDERING_ENGINE_ID, VIEWPORT_ID } from './viewport.js';

export const TOOL_GROUP_ID = 'heartviewTools';

// Tools shown in the toolbar. `key` is the keyboard shortcut.
export const TOOLS = [
  { name: WindowLevelTool.toolName, label: 'Window/Level', key: 'W', kind: 'view' },
  { name: PanTool.toolName, label: 'Pan', key: 'P', kind: 'view' },
  { name: ZoomTool.toolName, label: 'Zoom', key: 'Z', kind: 'view' },
  { name: LengthTool.toolName, label: 'Length', key: 'L', kind: 'measure' },
  { name: EllipticalROITool.toolName, label: 'Ellipse ROI', key: 'E', kind: 'measure' },
  { name: RectangleROITool.toolName, label: 'Rectangle ROI', key: 'R', kind: 'measure' },
];

export const DEFAULT_TOOL = EllipticalROITool.toolName;
export const MEASURE_TOOL_NAMES = [
  LengthTool.toolName,
  EllipticalROITool.toolName,
  RectangleROITool.toolName,
];

let registered = false;
function registerTools() {
  if (registered) return;
  [
    WindowLevelTool,
    PanTool,
    ZoomTool,
    StackScrollTool,
    LengthTool,
    EllipticalROITool,
    RectangleROITool,
  ].forEach((tool) => addTool(tool));
  registered = true;
}

export function createToolGroup() {
  registerTools();

  if (ToolGroupManager.getToolGroup(TOOL_GROUP_ID)) {
    ToolGroupManager.destroyToolGroup(TOOL_GROUP_ID);
  }
  const group = ToolGroupManager.createToolGroup(TOOL_GROUP_ID);

  TOOLS.forEach((t) => group.addTool(t.name));
  group.addTool(StackScrollTool.toolName);
  group.addViewport(VIEWPORT_ID, RENDERING_ENGINE_ID);

  // Mouse wheel always scrolls through slices
  group.setToolActive(StackScrollTool.toolName, {
    bindings: [{ mouseButton: csToolsEnums.MouseBindings.Wheel }],
  });

  activateTool(DEFAULT_TOOL);
}

export function destroyToolGroup() {
  if (ToolGroupManager.getToolGroup(TOOL_GROUP_ID)) {
    ToolGroupManager.destroyToolGroup(TOOL_GROUP_ID);
  }
}

/**
 * Make `toolName` the left-mouse tool. Right-drag always zooms, middle-drag always pans.
 */
export function activateTool(toolName) {
  const group = ToolGroupManager.getToolGroup(TOOL_GROUP_ID);
  if (!group) return;
  const { Primary, Secondary, Auxiliary } = csToolsEnums.MouseBindings;

  TOOLS.forEach((t) => {
    const bindings = [];
    if (t.name === toolName) bindings.push({ mouseButton: Primary });
    if (t.name === ZoomTool.toolName) bindings.push({ mouseButton: Secondary });
    if (t.name === PanTool.toolName) bindings.push({ mouseButton: Auxiliary });

    if (bindings.length) group.setToolActive(t.name, { bindings });
    else group.setToolPassive(t.name);
  });
}
