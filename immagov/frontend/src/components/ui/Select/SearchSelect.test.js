import { useState } from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useForm } from "react-hook-form";
import SearchSelect from "./SearchSelect";

const OPTIONS = [
  { value: "1", label: "Toyota" },
  { value: "2", label: "Peugeot" },
  { value: "3", label: "Citroën" },
];

// Formulaire réel : SearchSelect branché avec {...register()}, comme dans l'étape 2
const Formulaire = ({ onValid, onSelect }) => {
  const [marque, setMarque] = useState("0");
  const { register, handleSubmit, formState: { errors } } = useForm();
  return (
    <form onSubmit={handleSubmit(onValid)}>
      <SearchSelect
        value={marque}
        options={OPTIONS}
        placeholder="Sélectionner la marque"
        {...register("marque", {
          onChange: (e) => { onSelect(e); setMarque(e.target.value); },
          validate: (value) => value != 0,
        })}
      />
      {errors.marque && <span>Marque obligatoire</span>}
      <button type="submit">Envoyer</button>
    </form>
  );
};

test("recherche sans accents, choix au clavier et événement compatible avec les gestionnaires existants", async () => {
  const onSelect = jest.fn();
  render(<Formulaire onValid={jest.fn()} onSelect={onSelect} />);

  fireEvent.click(screen.getByRole("button", { name: "Sélectionner la marque" }));
  const recherche = screen.getByRole("combobox");
  fireEvent.change(recherche, { target: { value: "citro" } });
  expect(screen.getAllByRole("option").map((o) => o.textContent)).toEqual(["Citroën"]);

  fireEvent.keyDown(recherche, { key: "Enter" });
  expect(onSelect).toHaveBeenCalledTimes(1);
  const { target } = onSelect.mock.calls[0][0];
  expect([target.name, target.value, target.type]).toEqual(["marque", "3", "select-one"]);
  expect(screen.getByRole("button", { name: "Citroën" })).toBeInTheDocument();
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});

test("react-hook-form : bloque l'envoi sans choix, puis transmet la valeur choisie", async () => {
  const onValid = jest.fn();
  render(<Formulaire onValid={onValid} onSelect={() => {}} />);

  fireEvent.click(screen.getByText("Envoyer"));
  expect(await screen.findByText("Marque obligatoire")).toBeInTheDocument();
  expect(onValid).not.toHaveBeenCalled();

  fireEvent.click(screen.getByRole("button", { name: "Sélectionner la marque" }));
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "ArrowDown" });
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Enter" });
  fireEvent.click(screen.getByText("Envoyer"));
  await waitFor(() => expect(onValid).toHaveBeenCalled());
  expect(onValid.mock.calls[0][0]).toEqual({ marque: "2" });
});

test("Échap ferme la liste et « Aucun résultat » s'affiche quand rien ne correspond", () => {
  render(<SearchSelect name="x" value="" options={OPTIONS} onChange={() => {}} />);
  fireEvent.click(screen.getByRole("button", { name: "Sélectionner…" }));
  fireEvent.change(screen.getByRole("combobox"), { target: { value: "zzz" } });
  expect(screen.getByText("Aucun résultat")).toBeInTheDocument();
  fireEvent.keyDown(screen.getByRole("combobox"), { key: "Escape" });
  expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
});
