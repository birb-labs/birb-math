import type { TagNode, TopicNode } from '@birb-math/content-schema';
import styles from './TagPicker.module.css';

export type { TagNode, TopicNode };

export function TagPicker({
  tagTree,
  selectedTagIds,
  onChange,
}: {
  tagTree: TopicNode[];
  selectedTagIds: number[];
  onChange: (tagIds: number[]) => void;
}) {
  function toggle(id: number) {
    onChange(selectedTagIds.includes(id) ? selectedTagIds.filter((tagId) => tagId !== id) : [...selectedTagIds, id]);
  }

  return (
    <div>
      {tagTree.map((topic) => (
        <div key={topic.id}>
          <label className={styles.row}>
            <input type="checkbox" checked={selectedTagIds.includes(topic.id)} onChange={() => toggle(topic.id)} />
            {topic.name}
          </label>
          <div className={styles.subtopics}>
            {topic.subtopics.map((subtopic) => (
              <label key={subtopic.id} className={styles.row}>
                <input
                  type="checkbox"
                  checked={selectedTagIds.includes(subtopic.id)}
                  onChange={() => toggle(subtopic.id)}
                />
                {subtopic.name}
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
