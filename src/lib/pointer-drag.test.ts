import assert from "node:assert/strict";
import test from "node:test";
import {
  armPointerOrigin,
  idlePointerOrigin,
  planPointerDragEnd,
  pointerHasMoved,
} from "./pointer-drag.ts";

test("a tap is not a drag and keeps the selection path open", () => {
  const origin = armPointerOrigin(10, 10);
  const plan = planPointerDragEnd(origin, false, "up");
  assert.deepEqual(plan, {
    tap: true,
    tryDrop: false,
    clearDrag: true,
    clearSelected: false,
  });
});

test("a drag that ends on pointerup clears selection and tries to drop", () => {
  const origin = { x: 10, y: 10, moved: true, armed: true };
  const plan = planPointerDragEnd(origin, true, "up");
  assert.deepEqual(plan, {
    tap: false,
    tryDrop: true,
    clearDrag: true,
    clearSelected: true,
  });
});

test("a drag that ends with no drop target still clears selection", () => {
  const origin = { x: 10, y: 10, moved: true, armed: true };
  const plan = planPointerDragEnd(origin, true, "up");
  assert.equal(plan.tryDrop, true);
  assert.equal(plan.clearSelected, true);
  assert.equal(plan.clearDrag, true);
  assert.equal(plan.tap, false);
});

test("cancel and lost capture clear a drag outline and do not drop", () => {
  const origin = { x: 10, y: 10, moved: true, armed: true };
  for (const kind of ["cancel", "lostcapture"] as const) {
    const plan = planPointerDragEnd(origin, true, kind);
    assert.deepEqual(plan, {
      tap: false,
      tryDrop: false,
      clearDrag: true,
      clearSelected: true,
    });
  }
});

test("cancel of a press that never became a drag does not steal a prior selection", () => {
  const origin = armPointerOrigin(4, 4);
  const plan = planPointerDragEnd(origin, false, "cancel");
  assert.deepEqual(plan, {
    tap: false,
    tryDrop: false,
    clearDrag: true,
    clearSelected: false,
  });
});

test("an already-idle session is a no-op besides clearing leftover drag state", () => {
  const plan = planPointerDragEnd(idlePointerOrigin(), false, "up");
  assert.deepEqual(plan, {
    tap: false,
    tryDrop: false,
    clearDrag: true,
    clearSelected: false,
  });
});

test("lost capture after a drag that never set drag state still clears selection", () => {
  const origin = { x: 0, y: 0, moved: true, armed: true };
  const plan = planPointerDragEnd(origin, false, "lostcapture");
  assert.equal(plan.clearSelected, true);
  assert.equal(plan.clearDrag, true);
  assert.equal(plan.tryDrop, false);
});

test("pointerHasMoved uses the 8px slop", () => {
  const origin = armPointerOrigin(0, 0);
  assert.equal(pointerHasMoved(origin, 3, 4), false);
  assert.equal(pointerHasMoved({ ...origin, moved: true }, 0, 0), true);
  assert.equal(pointerHasMoved(origin, 8, 0), true);
});
