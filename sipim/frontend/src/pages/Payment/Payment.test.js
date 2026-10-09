import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { RecoilRoot } from "recoil";

import Payment from "./Payment";
import { UserContext, ElementContext } from "../../services/Context/Context";

const elementsData = {
  categories: [{ categorie_id: 2, nomCategorie: "Vehicules legers" }],
  typeCarteGrise: [
    { typecg_id: 3, categorie_id: 2, type: 1, signe: "<=", capacite: "7", unite: "CV", libellepoids: null, nomType: null, montant: "800000.00" },
    { typecg_id: 4, categorie_id: 2, type: 1, signe: ">,<=", capacite: "7,12", unite: "CV", libellepoids: null, nomType: null, montant: "1000000.00" },
  ],
  typeVignette: [{ typevg_id: 2, typecg_id: 2, nomType: "Voiture jusqu'à 12 CV", montant: "200000.0" }],
  autorisations: [],
};
const privileges = [{ privilege_id: 22, privilege: "Paiement EP" }];

// API simulée : aucun paiement existant pour le châssis, enregistrement accepté.
// Les implémentations sont posées dans beforeEach car CRA réinitialise les mocks (resetMocks).
const mockApiData = jest.fn();
const mockNavigate = jest.fn();
jest.mock("../../services/Api", () => function Api() { return { apiData: (...args) => mockApiData(...args) }; });
jest.mock("react-router-dom", () => ({ ...jest.requireActual("react-router-dom"), useNavigate: () => mockNavigate }));

beforeEach(() => {
  mockApiData.mockImplementation((methode) =>
    Promise.resolve(methode === "post" ? { status: 200, data: { paiement_id: 501 } } : { status: 200, payment: [] })
  );
  render(
    <MemoryRouter>
      <RecoilRoot>
        <UserContext.Provider value={{ user: "", userRole: "", agence: { agence_id: 1, commune_id: 1 }, privileges }}>
          <ElementContext.Provider value={{ elementsData }}>
            <Payment />
          </ElementContext.Provider>
        </UserContext.Provider>
      </RecoilRoot>
    </MemoryRouter>
  );
});

describe("Formulaire de nouveau paiement", () => {
  it("affiche les trois sections et le récapitulatif", () => {
    expect(screen.getByRole("heading", { name: "Client" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Véhicule" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Documents à payer" })).toBeInTheDocument();
    expect(screen.getByLabelText("Récapitulatif")).toBeInTheDocument();
  });

  it("bloque la validation tant que le formulaire est incomplet", () => {
    expect(screen.getByRole("button", { name: "Valider le paiement" })).toBeDisabled();
  });

  it("déduit la tranche de carte grise de la puissance saisie", () => {
    fireEvent.click(screen.getByLabelText(/Vehicules legers/));
    fireEvent.change(screen.getByLabelText("Puissance fiscale (CV)"), { target: { value: "9" } });
    expect(screen.getByRole("radio", { name: /Plus de 7 et jusqu'à 12 CV/ })).toBeChecked();
    expect(screen.getByRole("radio", { name: /Jusqu'à 7 CV/ })).toBeDisabled();
  });

  it("propose la plaque EP selon les privilèges", () => {
    expect(screen.getByLabelText(/Plaque EP/)).toBeInTheDocument();
    expect(screen.queryByLabelText(/Plaque VA/)).not.toBeInTheDocument();
  });

  it("envoie les mêmes champs que l'ancien formulaire puis ouvre le reçu", async () => {
    fireEvent.click(screen.getByLabelText(/Particulier/));
    fireEvent.change(screen.getByLabelText("Prénom et nom"), { target: { value: "mamadou diallo" } });
    fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: "622451890" } });
    fireEvent.change(screen.getByLabelText("Numéro de châssis"), { target: { value: "vf1rfb00x62345678" } });
    fireEvent.click(screen.getByLabelText(/Vehicules legers/));
    fireEvent.change(screen.getByLabelText("Puissance fiscale (CV)"), { target: { value: "9" } });
    fireEvent.click(screen.getByLabelText(/Plaque EP/));

    const valider = screen.getByRole("button", { name: "Valider le paiement" });
    expect(valider).toBeEnabled();
    fireEvent.click(valider);
    fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));

    await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/payment/invoice/501"));
    const [, url, formData] = mockApiData.mock.calls.find(([m]) => m === "post");
    expect(url).toBe("/paiement/new");
    const envoye = Object.fromEntries(formData.entries());
    expect(envoye).toMatchObject({
      typeClient: "Particulier", fullName: "MAMADOU DIALLO", tel: "622451890", chassis: "VF1RFB00X62345678",
      modeExp: "Personnel", modeImma: "1", categorieCg: "2", typeCg: "4", typeVignette: "2", autorisation_id: "0",
      pf: "9", isEP: "true", isVA: "false", isIT: "false", document: "EP", agence_id: "1", commune_id: "1",
    });
  });

  it("bloque tout paiement pour un véhicule réformé", async () => {
    mockApiData.mockImplementation(() => Promise.resolve({
      status: 200,
      payment: [
        { reference: "REFIMMAT", type_document: "EP", status: 1, isautoriser: 1 },
        { reference: "REFREFORME", type_document: "reforme", status: 1, isautoriser: 0 },
      ],
    }));
    const chassis = screen.getByLabelText("Numéro de châssis");
    fireEvent.change(chassis, { target: { value: "jtmhv02j104242881" } });
    fireEvent.blur(chassis);
    expect(await screen.findByText(/Ce véhicule a été réformé \(réf. REFREFORME\)/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Valider le paiement" })).toBeDisabled();
  });

  describe("Mutation et réforme", () => {
    const VEHICULE_EP = {
      paiement_id: 1, reference: "REFIMMAT", chassis: "JTMHV02J104242881", fullName: "ANCIEN PROPRIO", categorie_id: 2, nomCategorie: "Vehicules legers",
      modeImma: 2, type_plaque: "EP", numero_immatriculation: "EP-1234-A", montantMutation: 1200000, montantMinReforme: 500000,
    };
    const remplirClient = () => {
      fireEvent.click(screen.getByLabelText(/Particulier/));
      fireEvent.change(screen.getByLabelText("Prénom et nom"), { target: { value: "nouveau proprio" } });
      fireEvent.change(screen.getByLabelText("Téléphone"), { target: { value: "622451890" } });
    };
    const saisirChassis = (vehicule) => {
      mockApiData.mockImplementation((methode, url) => {
        if (url.startsWith("/paiement/vehicule-utilise/"))
          return Promise.resolve(vehicule ? { status: 200, vehicule }
            : { status: 404, messages: { numChassis: ["Ce châssis n'a pas encore été utilisé pour une immatriculation ou une réimmatriculation."] } });
        return Promise.resolve(methode === "post" ? { status: 200, data: { paiement_id: 502 } } : { status: 200, payment: [] });
      });
      const chassis = screen.getByLabelText("Numéro de châssis");
      fireEvent.change(chassis, { target: { value: "jtmhv02j104242881" } });
      fireEvent.blur(chassis);
    };

    it("refuse un châssis qui n'a pas servi à une immatriculation", async () => {
      fireEvent.click(screen.getByLabelText("Mutation"));
      saisirChassis(null);
      expect(await screen.findByText(/n'a pas encore été utilisé/)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Valider le paiement" })).toBeDisabled();
    });

    it("facture la mutation EP au prix de la carte grise, sans frais ni plaque", async () => {
      remplirClient();
      fireEvent.click(screen.getByLabelText("Mutation"));
      saisirChassis(VEHICULE_EP);
      expect(await screen.findByText(/Véhicule immatriculé · plaque EP/)).toBeInTheDocument();
      expect(screen.queryByRole("heading", { name: "Documents à payer" })).not.toBeInTheDocument();
      // Frais de service de la catégorie (véhicule léger : 20 000), pas de plaque
      expect(screen.getByText("Frais de service")).toBeInTheDocument();
      expect(screen.queryByText(/Plaque EP/)).not.toBeInTheDocument();

      fireEvent.click(screen.getByRole("button", { name: "Valider le paiement" }));
      fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/payment/invoice/502"));
      const [, url, formData] = mockApiData.mock.calls.find(([m]) => m === "post");
      expect(url).toBe("/paiement/operation-vehicule");
      expect(Object.fromEntries(formData.entries())).toMatchObject({
        document: "mutation", chassis: "JTMHV02J104242881", typeClient: "Particulier", fullName: "NOUVEAU PROPRIO", tel: "622451890",
      });
    });

    it("exige un montant de réforme d'au moins 500 000 GNF", async () => {
      remplirClient();
      fireEvent.click(screen.getByLabelText("Réforme"));
      saisirChassis(VEHICULE_EP);
      const montant = await screen.findByLabelText("Montant de la réforme (GNF)");
      const valider = screen.getByRole("button", { name: "Valider le paiement" });

      fireEvent.change(montant, { target: { value: "400000" } });
      expect(screen.getByText(/Le montant minimum est de 500/)).toBeInTheDocument();
      expect(valider).toBeDisabled();

      fireEvent.change(montant, { target: { value: "750000" } });
      expect(valider).toBeEnabled();
      fireEvent.click(valider);
      fireEvent.click(screen.getByRole("button", { name: "Confirmer" }));
      await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith("/payment/invoice/502"));
      const [, , formData] = mockApiData.mock.calls.find(([m]) => m === "post");
      expect(Object.fromEntries(formData.entries())).toMatchObject({ document: "reforme", montant_operation: "750000" });
    });
  });

  it("formate le téléphone une fois les 9 chiffres saisis et bloque la suite", () => {
    const tel = screen.getByLabelText("Téléphone");
    fireEvent.change(tel, { target: { value: "62245" } });
    expect(tel).toHaveValue("62245");
    fireEvent.change(tel, { target: { value: "622451890" } });
    expect(tel).toHaveValue("622 45 18 90");
    fireEvent.change(tel, { target: { value: "622 45 18 901" } });
    expect(tel).toHaveValue("622 45 18 90");
    fireEvent.change(tel, { target: { value: "622 45 18 9" } });
    expect(tel).toHaveValue("62245189");
  });
});
