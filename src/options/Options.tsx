import React, { useState } from "react";
import {
  LinkStyle,
  ShortcutKeys,
  linkStyles,
  useShortcutKeys,
  labelByLinkStyle,
  useUpdateShortcutKeys,
} from "../common";

export const Options: React.VFC = () => {
  const { shortcutKeys, setShortcutKeys } = useShortcutKeys();

  if (!shortcutKeys) {
    return <></>;
  }
  return <Form shortcutKeys={shortcutKeys} setShortcutKeys={setShortcutKeys} />;
};

type FormProps = Readonly<{
  shortcutKeys: ShortcutKeys;
  setShortcutKeys: (shortcutKeys: ShortcutKeys) => void;
}>;

const Form: React.VFC<FormProps> = ({ shortcutKeys, setShortcutKeys }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const update = useUpdateShortcutKeys();
  const onSubmit: React.FormEventHandler<HTMLFormElement> = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      update(shortcutKeys);
      window.close();
    } catch {
      // noop
    } finally {
      setIsSubmitting(false);
    }
  };
  const onChange =
    (style: LinkStyle): React.ChangeEventHandler<HTMLInputElement> =>
    (e) => {
      setShortcutKeys({ ...shortcutKeys, [style]: e.target.value });
    };

  return (
    <form onSubmit={onSubmit}>
      {linkStyles.map((style) => (
        <div>
          <label>
            {labelByLinkStyle[style]}{" "}
            <input
              id={style}
              type="text"
              value={shortcutKeys[style]}
              disabled={isSubmitting}
              required
              onChange={onChange(style)}
            />
          </label>
        </div>
      ))}
      <button type="submit" disabled={isSubmitting}>
        Submit
      </button>
    </form>
  );
};
