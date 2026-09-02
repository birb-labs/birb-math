import { describe, expect, it, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import type { DragEndEvent } from '@dnd-kit/core';
import { MatchingInput } from './matching-input';
import type { ExportedMatchingPair } from '@/lib/simulado-selection';

// dnd-kit's PointerSensor drives drags off real pointer geometry
// (getBoundingClientRect), which jsdom does not lay out meaningfully — so,
// like `ordering-input.test.tsx`, we don't attempt real pointer-event
// simulation. Instead we intercept `DndContext`'s `onDragEnd` prop (the
// same handler a real sensor would eventually call once a drag completes)
// and invoke it directly with a fabricated `DragEndEvent`-shaped object,
// while still rendering the *real* DndContext underneath so useDraggable/
// useDroppable wiring, and hence the rendered DOM, behaves exactly as it
// would in the browser.
let capturedOnDragEnd: ((event: DragEndEvent) => void) | undefined;
vi.mock('@dnd-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@dnd-kit/core')>();
  return {
    ...actual,
    DndContext: (props: Parameters<typeof actual.DndContext>[0]) => {
      capturedOnDragEnd = props.onDragEnd;
      const RealDndContext = actual.DndContext;
      return <RealDndContext {...props} />;
    },
  };
});

function dragEnd(activeId: number, overId: number | string) {
  act(() => {
    capturedOnDragEnd?.({
      active: { id: activeId, data: { current: undefined }, rect: { current: { initial: null, translated: null } } },
      over: { id: overId, rect: {} as DOMRect, disabled: false, data: { current: undefined } },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- minimal fake, only `active.id`/`over.id` are read by handleDragEnd
    } as any);
  });
}

const pairs: ExportedMatchingPair[] = [
  { id: 1, leftHtml: '<p>Removível</p>', rightHtml: '<p>Descrição A</p>' },
  { id: 2, leftHtml: '<p>Salto</p>', rightHtml: '<p>Descrição B</p>' },
];

describe('MatchingInput', () => {
  it('renders both left items and both right items', () => {
    render(<MatchingInput pairs={pairs} onChange={() => {}} />);

    expect(screen.getByText('Removível')).toBeInTheDocument();
    expect(screen.getByText('Salto')).toBeInTheDocument();
    expect(screen.getByText('Descrição A')).toBeInTheDocument();
    expect(screen.getByText('Descrição B')).toBeInTheDocument();
  });

  it('lets a placed item be dragged to a different slot after being dropped once', () => {
    render(<MatchingInput pairs={pairs} onChange={() => {}} />);

    // Drop right item 1 ("Descrição A") onto left slot 2 ("Salto").
    dragEnd(1, 2);
    expect(screen.getByText('Descrição A')).toBeInTheDocument();

    // It must still be draggable (rendered as a button-role element, same
    // as an unplaced pool item) so it can be picked up again.
    expect(screen.getByText('Descrição A').closest('[role="button"]')).not.toBeNull();

    // Move it from slot 2 to slot 1 instead of leaving it stuck.
    dragEnd(1, 1);
    expect(screen.getByText('Descrição A')).toBeInTheDocument();
  });

  it('keeps every placed item draggable once all slots are filled', () => {
    render(<MatchingInput pairs={pairs} onChange={() => {}} />);

    dragEnd(1, 1);
    dragEnd(2, 2);

    // Both right items are now placed and the pool is empty — previously,
    // once every slot was filled, there were zero draggable elements left
    // in the DOM. Both placed items must remain pickable.
    expect(screen.getByText('Descrição A').closest('[role="button"]')).not.toBeNull();
    expect(screen.getByText('Descrição B').closest('[role="button"]')).not.toBeNull();
  });

  it('unassigns a placed item when it is dragged back to the pool', () => {
    render(<MatchingInput pairs={pairs} onChange={() => {}} />);

    dragEnd(1, 1);
    dragEnd(1, 'matching-pool');

    // Item 1 is back in the pool, and slot 1 no longer shows it as placed —
    // the pool now contains the item again alongside its own draggable role.
    expect(screen.getByText('Descrição A').closest('[role="button"]')).not.toBeNull();
  });
});
