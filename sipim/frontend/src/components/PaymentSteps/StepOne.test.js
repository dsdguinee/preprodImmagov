import { screen, render, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import StepOne from "./StepOne";
import { UserContext, ElementContext } from "../../services/Context/Context";

const user = "";
const userRole = "";
const agence = "";
const decoupage = "";
const elementsData = {
  categories: [
    {
      categorie_id: "1",
      nomCategorie: "1",
    },
  ],
  typeCarteGrise: [
    {
      categorie_id: "2",
      type: "CarteGrise",
    },
  ],
  typeVignette: [
    {
      typecg_id: "2",
      type: "CarteGrise",
    },
  ],
  autorisations: [
    {
      categorie_id: "2",
      type: "CarteGrise",
    },
  ],
};

const prevStep = jest.fn();
const nextStep = jest.fn();
const setPaiement = jest.fn();
const paiement = {};

beforeEach(() => {
  render(
    <UserContext.Provider value={{ user, userRole, agence, decoupage }}>
      <ElementContext.Provider value={{ elementsData }}>
        <StepOne
          nextStep={nextStep}
          prevStep={prevStep}
          paiement={paiement}
          setPaiement={setPaiement}
        />
      </ElementContext.Provider>
    </UserContext.Provider>
  );
});

it("should show error messages on empty inputs", async () => {
  const button = screen.getByRole("button", { name: /Suivant/i });
  userEvent.click(button);
  const errors = await screen.findAllByText(/Ce champ est obligatoire/i);
  expect(errors.length).toBeGreaterThan(0);
});

it("should not show nom and telephone fields by default", () => {
  const typeClient = screen.getByLabelText(/Type de client/i);
  fireEvent.change(typeClient, { target: { value: "" } });

  const nom = screen.queryByLabelText(/Prénom et nom/i);
  const tel = screen.queryByLabelText(/Numéro de téléphone/i);

  expect(nom).not.toBeInTheDocument();
  expect(tel).not.toBeInTheDocument();
});

// it("should show name and telephone number field when 'Particulier' is selected", async () => {
//   const typeClient = screen.getByLabelText(/Type de client/i);

//   fireEvent.change(typeClient, { target: { value: "Particulier" } });

//   const nom = await screen.findByLabelText(/Prénom/i);
//   const telephone = await screen.findByLabelText(/Téléphone/i);

//   expect(nom).toBeInTheDocument();
//   expect(telephone).toBeInTheDocument();
// });

// it("should show name and telephone number field when 'Société' is selected", async () => {
//   const typeClient = screen.getByLabelText(/Type de client/i);

//   fireEvent.change(typeClient, { target: { value: "Société" } });

//   const nom = await screen.findByLabelText(/Nom de la société/i);
//   const nif = await screen.findByLabelText(/Code nif/i);

//   expect(nom).toBeInTheDocument();
//   expect(nif).toBeInTheDocument();
// });

// it("should not show nom and telephone fields by default", async () => {
//   const typeClient = screen.getByLabelText(/Type de client/i);
//   fireEvent.change(typeClient, { target: { value: "" } });

//   const nom = await screen.findByLabelText(/Prénom et nom/i);
//   const tel = await screen.findByLabelText(/Numéro de téléphone/i);

//   expect(nom).not.toBeVisible();
//   expect(tel).not.toBeVisible();
// });

  // it("should show the step two on click on the next button", async () => {
  //   const typeClient = screen.getByLabelText(/Type de client/i)
  //   const numChassis = screen.getByLabelText(/Numéro de chassis/i)
  //   const modeExp = screen.getByLabelText(/Mode d'exploitation/i)
  //   const modeImmat = screen.getByLabelText(/Mode d'immatriculation/i)
  //   const categorieCarteGrise = screen.getByLabelText(/Categorie de carte grise/i)
  //   const typeCarteGrise = screen.getByLabelText(/Type de carte grise/i)
  //   const typeVignette = screen.getByLabelText(/Type de vignette/i)

  //   fireEvent.change(typeClient, {target: {value: "Particulier"}})
    
  //   const nom = await screen.findByLabelText(/Prénom/i)
  //   const tel = await screen.findByLabelText(/Numéro de téléphone/i)

  //   fireEvent.change(nom, {target: {value: "Aboubacar Mansare"}})
  //   fireEvent.change(tel, {target: {value: "123456"}})
  //   fireEvent.change(numChassis, {target: {value: "ABCDEFGHIJK"}})
  //   fireEvent.change(modeExp, {target: {value: "Personnel"}})
  //   fireEvent.change(modeImmat, {target: {value: "1"}})
  //   fireEvent.change(categorieCarteGrise, {target: {value: "2"}})
  //   fireEvent.change(typeCarteGrise, {target: {value: "3"}})
  //   fireEvent.change(typeVignette, {target: {value: "59"}})

  //   const nextButton = screen.getByRole("button", { name: /Suivant/i })
  //   expect(nextButton).toBeInTheDocument();
  //   userEvent.click(nextButton);

  //   expect(nextStep).toHaveBeenCalled();
 
  //   // const paymentButton = await screen.findByRole("button", { name: /Payer/i })
  //   // expect(paymentButton).toBeInTheDocument();
  // });
