'use client';

import { useState, type ReactNode } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import type { ExportedMatchingPair } from '@/lib/simulado-selection';
import { serializeMatchingAnswer } from '@/lib/matching-answer';
import { shuffle } from '@/lib/shuffle';
import styles from './matching-input.module.css';

// Sentinel droppable id for the right-column pool, distinct from any real
// pair id, so a slot-to-pool drag can be told apart from a slot-to-slot
// drag in `handleDragEnd`.
const POOL_DROPPABLE_ID = 'matching-pool';

function DraggableRightItem({ id, html }: { id: number; html: string }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id });
  const style = transform ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` } : undefined;

  return (
    <div ref={setNodeRef} style={style} className={styles.draggable} {...attributes} {...listeners}>
      {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}

function DroppableLeftSlot({
  id,
  html,
  droppedItem,
}: {
  id: number;
  html: string;
  droppedItem: { id: number; html: string } | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={isOver ? styles.slotOver : styles.slot}>
      {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
      <span dangerouslySetInnerHTML={{ __html: html }} />
      {/*
        The item occupying this slot is rendered as a `DraggableRightItem`
        (not a plain span) so it can be picked up again and moved to a
        different slot, or dragged back to the pool below — without this,
        once every slot was filled there would be zero draggable elements
        left in the DOM and the student could never fix a wrong pairing.
      */}
      <div className={styles.dropZone}>
        {droppedItem && <DraggableRightItem id={droppedItem.id} html={droppedItem.html} />}
      </div>
    </div>
  );
}

function DroppablePool({ children }: { children: ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id: POOL_DROPPABLE_ID });

  return (
    <div ref={setNodeRef} className={isOver ? styles.rightColumnOver : styles.rightColumn}>
      {children}
    </div>
  );
}

export function MatchingInput({
  pairs,
  onChange,
  shuffleFn = shuffle,
}: {
  pairs: ExportedMatchingPair[];
  onChange: (value: string) => void;
  shuffleFn?: (items: ExportedMatchingPair[]) => ExportedMatchingPair[];
}) {
  const [pairing, setPairing] = useState<Record<number, number>>({});
  const [rightOrder] = useState<number[]>(() => shuffleFn(pairs).map((pair) => pair.id));
  const placedRightIds = new Set(Object.values(pairing));
  // No custom coordinateGetter here (unlike OrderingInput's sortableKeyboardCoordinates,
  // which is specific to @dnd-kit/sortable's reorderable lists): KeyboardSensor's
  // default coordinateGetter already moves a plain useDraggable item by arrow-key
  // presses and relies on DndContext's own collision detection to find the
  // useDroppable slot underneath, which is exactly what a drag-onto-a-target
  // (as opposed to reordering) interaction needs.
  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;

    setPairing((current) => {
      const next: Record<number, number> = {};
      for (const [leftId, rightId] of Object.entries(current)) {
        if (rightId !== Number(active.id)) next[Number(leftId)] = rightId;
      }
      // Dropping onto the pool unassigns the item instead of assigning it to
      // a slot — this is what lets a student drag a placed item back out to
      // become unassigned again.
      if (over.id !== POOL_DROPPABLE_ID) {
        next[Number(over.id)] = Number(active.id);
      }
      onChange(serializeMatchingAnswer(next));
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          {pairs.map((pair) => {
            const droppedRightId = pairing[pair.id];
            const droppedPair = droppedRightId !== undefined ? pairs.find((p) => p.id === droppedRightId) : undefined;
            return (
              <DroppableLeftSlot
                key={pair.id}
                id={pair.id}
                html={pair.leftHtml}
                droppedItem={droppedPair ? { id: droppedPair.id, html: droppedPair.rightHtml } : null}
              />
            );
          })}
        </div>
        <DroppablePool>
          {rightOrder
            .filter((id) => !placedRightIds.has(id))
            .map((id) => {
              const pair = pairs.find((p) => p.id === id)!;
              return <DraggableRightItem key={id} id={id} html={pair.rightHtml} />;
            })}
        </DroppablePool>
      </div>
    </DndContext>
  );
}
