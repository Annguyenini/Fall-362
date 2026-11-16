import { useState } from "react";

export function EditableHeader({ title,value }) {
  const [isEditing, setIsEditing] = useState(false);
  const [new_value, setNewValue] = useState(title);

  return (
    <th scope="col">
      {isEditing ? (
        <input
          autoFocus
          value={value}
          onChange={(e) => setNewValue(e.target.value)}
          onBlur={() => setIsEditing(false)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              setIsEditing(false);
            }
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setIsEditing(true)}
        >
          {value}
        </button>
      )}
    </th>
  );
}
