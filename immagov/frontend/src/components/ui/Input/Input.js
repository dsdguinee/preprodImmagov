import { forwardRef } from "react";

/**
 * Champ de saisie de l'application.
 * - Se branche comme un <input> : {...register("champ", {...})} de react-hook-form fonctionne tel quel.
 * - invalid : bordure rouge + aria-invalid ; mono : chasse fixe (références, châssis…)
 * - prefix / suffix : texte affiché dans le champ, avant ou après la saisie (ex. suffix="kg").
 */
const Input = forwardRef(({ prefix, suffix, mono = false, invalid = false, className = "", type = "text", ...props }, ref) => {
  const classes = ["ui-input", mono && "ui-input--mono", invalid && "is-invalid", className].filter(Boolean).join(" ");
  const input = <input ref={ref} type={type} className={classes} aria-invalid={invalid || undefined} {...props} />;
  if (!prefix && !suffix) return input;

  return (
    <span className={`ui-input-group${invalid ? " is-invalid" : ""}${props.readOnly || props.disabled ? " is-readonly" : ""}`}>
      {prefix && <span className="ui-input-group__addon" aria-hidden="true">{prefix}</span>}
      {input}
      {suffix && <span className="ui-input-group__addon" aria-hidden="true">{suffix}</span>}
    </span>
  );
});

export default Input;
