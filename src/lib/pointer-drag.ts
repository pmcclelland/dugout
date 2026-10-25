export type PointerDragOrigin = {
  x: number;
  y: number;
  moved: boolean;
  armed: boolean;
};

export type PointerDragEndKind = "up" | "cancel" | "lostcapture";

export type PointerDragEndPlan = {
  tap: boolean;
  tryDrop: boolean;
  clearDrag: boolean;
  clearSelected: boolean;
};

export const POINTER_DRAG_SLOP_SQ = 64;

export function idlePointerOrigin(): PointerDragOrigin {
  return { x: 0, y: 0, moved: false, armed: false };
}

export function armPointerOrigin(x: number, y: number): PointerDragOrigin {
  return { x, y, moved: false, armed: true };
}

export function pointerHasMoved(origin: PointerDragOrigin, x: number, y: number): boolean {
  if (origin.moved) return true;
  const dx = x - origin.x;
  const dy = y - origin.y;
  return dx * dx + dy * dy >= POINTER_DRAG_SLOP_SQ;
}

/**
 * One plan for every way a press can end. Drag outlines and the selected
 * player outline clear whenever the gesture was a drag. A tap can still
 * select. Cancel / lost capture never drop.
 */
export function planPointerDragEnd(
  origin: PointerDragOrigin,
  hadDrag: boolean,
  kind: PointerDragEndKind,
): PointerDragEndPlan {
  const wasDrag = origin.moved || hadDrag;
  if (!origin.armed && !hadDrag) {
    return { tap: false, tryDrop: false, clearDrag: true, clearSelected: false };
  }

  switch (kind) {
    case "up":
      if (!wasDrag) {
        return { tap: origin.armed, tryDrop: false, clearDrag: true, clearSelected: false };
      }
      return { tap: false, tryDrop: true, clearDrag: true, clearSelected: true };
    case "cancel":
    case "lostcapture":
      return { tap: false, tryDrop: false, clearDrag: true, clearSelected: wasDrag };
    default: {
      const _exhaustive: never = kind;
      throw new Error(`Unhandled pointer end: ${_exhaustive}`);
    }
  }
}
