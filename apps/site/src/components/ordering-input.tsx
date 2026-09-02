'use client';

import { useEffect, useState } from 'react';
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { ExportedOption } from '@/lib/simulado-selection';
import { serializeOrderingAnswer } from '@/lib/ordering-answer';
import { shuffle } from '@/lib/shuffle';
import styles from './ordering-input.module.css';

function SortableItem({ id, html }: { id: number; html: string }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
  const style = { transform: CSS.Transform.toString(transform), transition };

  return (
    // `role="listitem"` explicitly re-asserts this <li>'s natural implicit role: @dnd-kit's
    // `attributes` sets `role="button"` by default (for its own generic drag-affordance a11y
    // hint), which — once spread onto the element — overrides the <li>'s implicit ARIA role.
    // Without this override, assistive tech (and `getByRole('listitem')` in tests) would no
    // longer see this as a list item.
    <li
      ref={setNodeRef}
      style={style}
      className={styles.item}
      {...attributes}
      {...listeners}
      role="listitem"
    >
      {/* eslint-disable-next-line react/no-danger -- pre-rendered at build time from our own MDX, not user input */}
      <span dangerouslySetInnerHTML={{ __html: html }} />
    </li>
  );
}

export function OrderingInput({
  options,
  onChange,
  shuffleFn = shuffle,
}: {
  options: ExportedOption[];
  onChange: (value: string) => void;
  shuffleFn?: (items: ExportedOption[]) => ExportedOption[];
}) {
  const [order, setOrder] = useState<number[]>(() => shuffleFn(options).map((option) => option.id));
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // A student who agrees with the initial shuffled order and never drags
  // anything would otherwise leave the answer `undefined` forever (onChange
  // is only otherwise called from handleDragEnd), which grades as incorrect
  // even when that shuffle happened to already be the correct order. Record
  // it once on mount so an untouched-but-already-correct order is graded
  // correctly.
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentionally mount-only
  useEffect(() => {
    onChange(serializeOrderingAnswer(order));
  }, []);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setOrder((current) => {
      const oldIndex = current.indexOf(Number(active.id));
      const newIndex = current.indexOf(Number(over.id));
      const next = arrayMove(current, oldIndex, newIndex);
      onChange(serializeOrderingAnswer(next));
      return next;
    });
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={order} strategy={verticalListSortingStrategy}>
        <ul className={styles.list}>
          {order.map((id) => {
            const option = options.find((o) => o.id === id)!;
            return <SortableItem key={id} id={id} html={option.textHtml} />;
          })}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
