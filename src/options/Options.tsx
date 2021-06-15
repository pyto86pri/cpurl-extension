import React, { useState } from "react";
import { TextField, Button } from "@material-ui/core";
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
    <>
      <h3>Shortcut key settings</h3>
      <div className="description">
        <div>* Supported keys:</div>
        <div>
          <p>
            For modifier keys you can use <kbd>shift</kbd>, <kbd>ctrl</kbd>,{" "}
            <kbd>alt</kbd>, or <kbd>meta</kbd>. Any other key you should be able
            to reference by name like <kbd>a</kbd>, <kbd>/</kbd>, <kbd>$</kbd>,{" "}
            <kbd>*</kbd>, or <kbd>=</kbd>.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit}>
        {linkStyles.map((style) => (
          <TextField
            key={style}
            id={style}
            label={labelByLinkStyle[style]}
            disabled={isSubmitting}
            required
            inputProps={{
              pattern:
                "^([a-z0-9!-/:-@¥[-`{-~]|shift|ctrl|alt|meta)([ +]([a-z0-9!-/:-@¥[-`{-~]|shift|ctrl|alt|meta))*$",
            }}
            value={shortcutKeys[style]}
            onChange={onChange(style)}
            fullWidth
          />
        ))}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="submit-button"
          variant="outlined"
          size="small"
          color="primary"
        >
          Submit
        </Button>
      </form>
    </>
  );
};
