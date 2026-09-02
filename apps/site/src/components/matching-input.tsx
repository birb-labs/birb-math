'use client';

import { useState } from 'react';
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
import styles from './matching-input.module.css';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

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
  droppedHtml,
}: {
  id: number;
  html: string;
  droppedHtml: string | null;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div ref={setNodeRef} className={isOver ? styles.slotOver : styles.slot}>
      {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
      <span dangerouslySetInnerHTML={{ __html: html }} />
      <div className={styles.dropZone}>
        {droppedHtml && (
          // eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input
          <span dangerouslySetInnerHTML={{ __html: droppedHtml }} />
        )}
      </div>
    </div>
  );
}

export function MatchingInput({
  pairs,
  onChange,
}: {
  pairs: ExportedMatchingPair[];
  onChange: (value: string) => void;
}) {
  const [pairing, setPairing] = useState<Record<number, number>>({});
  const [rightOrder] = useState<number[]>(() => shuffle(pairs).map((pair) => pair.id));
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
      next[Number(over.id)] = Number(active.id);
      onChange(serializeMatchingAnswer(next));
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className={styles.columns}>
        <div className={styles.leftColumn}>
          {pairs.map((pair) => (
            <DroppableLeftSlot
              key={pair.id}
              id={pair.id}
              html={pair.leftHtml}
              droppedHtml={
                pairing[pair.id] !== undefined
                  ? (pairs.find((p) => p.id === pairing[pair.id])?.rightHtml ?? null)
                  : null
              }
            />
          ))}
        </div>
        <div className={styles.rightColumn}>
          {rightOrder
            .filter((id) => !placedRightIds.has(id))
            .map((id) => {
              const pair = pairs.find((p) => p.id === id)!;
              return <DraggableRightItem key={id} id={id} html={pair.rightHtml} />;
            })}
        </div>
      </div>
    </DndContext>
  );
}
