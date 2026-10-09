import { render, screen } from "@testing-library/react";
import HistoriqueVehicule from "./HistoriqueVehicule";
import { historiqueVehicule } from "../../services/immatriculation.service";

jest.mock("../../services/immatriculation.service", () => ({ historiqueVehicule: jest.fn() }));

// Réponse de GET /immatriculation/historique/{id} : immatriculation, mutation validée, réforme ; une mutation rejetée
const reponse = {
  success: true,
  periodes: [
    { id: 3, origine: "reforme", ministere_nom: "MINISTERE DE L'ENERGIE", direction_nom: null, detenteur: "Mamadou CAMARA", fonction: "Directeur adjoint",
      debut: "2026-10-08 10:00:00", fin: null, motif_fin: null, reference: null, valide_par_nom: "Demba TRAORE" },
    { id: 2, origine: "mutation", ministere_nom: "MINISTERE DE L'ENERGIE", direction_nom: "ELECTRICITE DE GUINEE", detenteur: null, fonction: "Chauffeur",
      debut: "2024-01-15 10:00:00", fin: "2026-10-08 10:00:00", motif_fin: "reforme", reference: "MLOBI0UVCC9803083", valide_par_nom: "Demba TRAORE" },
    { id: 1, origine: "reprise", ministere_nom: "CBG", direction_nom: null, detenteur: null, fonction: null,
      debut: "2022-10-20 17:48:07", fin: "2024-01-15 10:00:00", motif_fin: "mutation", reference: null, valide_par_nom: "Demba TRAORE" },
  ],
  demandes: [
    { type: "mutation", id: 7, status: 2, created_at: "2025-03-01 09:00:00", ancien: "MINISTERE DE L'ENERGIE", nouveau: "CBG",
      demandeur: "BAKARY TRAORE", detenteur: null, motif_rejet: "Dossier incomplet" },
  ],
};

test("liste tous les utilisateurs du véhicule, du plus récent au plus ancien, et les demandes rejetées", async () => {
  historiqueVehicule.mockResolvedValue(reponse);
  render(<HistoriqueVehicule immatriculationId={1} />);

  const items = await screen.findAllByRole("listitem");
  expect(items.map((li) => li.querySelector("strong").textContent)).toEqual(["Mamadou CAMARA", "MINISTERE DE L'ENERGIE", "CBG"]);
  expect(screen.getByText("Utilisateur actuel")).toBeInTheDocument();
  expect(screen.getByText(/Du 15\/01\/2024 au 08\/10\/2026/)).toHaveTextContent("fin par réforme");
  expect(screen.getByText("MLOBI0UVCC9803083")).toBeInTheDocument();
  expect(screen.getByText("Mutation vers CBG")).toBeInTheDocument();
  expect(screen.getByText("Motif du rejet : Dossier incomplet")).toBeInTheDocument();
});

test("véhicule pas encore validé : aucune période", async () => {
  historiqueVehicule.mockResolvedValue({ success: true, periodes: [], demandes: [] });
  render(<HistoriqueVehicule immatriculationId={2} />);
  expect(await screen.findByText(/n'a pas encore été validé/)).toBeInTheDocument();
});
