import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import Input from "./Input";

// Champ branché avec {...register()}, comme dans les étapes de l'immatriculation
const Formulaire = ({ onValid }) => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onValid)}>
      <label>
        Poids à vide
        <Input type="number" suffix="kg" invalid={!!errors.pv} {...register("pv", { required: true, min: 1 })} />
      </label>
      <button type="submit">Envoyer</button>
    </form>
  );
};

test("react-hook-form : erreur signalée sur le champ, puis valeur transmise", async () => {
  const onValid = jest.fn();
  render(<Formulaire onValid={onValid} />);
  const champ = screen.getByLabelText(/Poids à vide/);

  fireEvent.click(screen.getByText("Envoyer"));
  await waitFor(() => expect(champ).toHaveAttribute("aria-invalid", "true"));
  expect(champ.parentElement).toHaveClass("ui-input-group", "is-invalid");
  expect(onValid).not.toHaveBeenCalled();

  fireEvent.change(champ, { target: { value: "1450" } });
  fireEvent.click(screen.getByText("Envoyer"));
  await waitFor(() => expect(onValid).toHaveBeenCalled());
  expect(onValid.mock.calls[0][0]).toEqual({ pv: "1450" });
  expect(champ).not.toHaveAttribute("aria-invalid");
});

test("unité affichée et variante mono", () => {
  render(<>
    <Input aria-label="Poids" suffix="kg" defaultValue="10" />
    <Input aria-label="Châssis" mono readOnly value="YTE77388388UUEHWH" />
  </>);
  expect(screen.getByText("kg")).toBeInTheDocument();
  expect(screen.getByLabelText("Châssis")).toHaveClass("ui-input", "ui-input--mono");
  expect(screen.getByLabelText("Châssis").parentElement).not.toHaveClass("ui-input-group");
});
