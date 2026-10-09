import { render, screen, act } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import axios from "axios";
import ChargementPage from "./ChargementPage";
import { suivreRequetes } from "../../services/chargement";

// Instance axios suivie dont on contrôle la fin de chaque requête
const requeteEnAttente = () => {
  let terminer;
  const instance = suivreRequetes(axios.create());
  instance.defaults.adapter = (config) => new Promise((resolve) => {
    terminer = () => resolve({ data: {}, status: 200, statusText: "OK", headers: {}, config });
  });
  const promesse = instance.get("/donnees");
  return { terminer: () => terminer(), promesse };
};

const contenu = () => screen.getByText("Contenu de la page").closest(".chargement-page");

describe("ChargementPage", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  it("affiche le spinner et masque la page jusqu'à la réponse du backend", async () => {
    let requete;
    await act(async () => {
      requete = requeteEnAttente();
      render(<MemoryRouter><ChargementPage><p>Contenu de la page</p></ChargementPage></MemoryRouter>);
    });
    act(() => { jest.advanceTimersByTime(1000); });
    expect(document.querySelector(".spinner-wrapper")).toBeInTheDocument();
    expect(contenu()).toHaveClass("chargement-page--masque");

    await act(async () => { requete.terminer(); await requete.promesse; });
    act(() => { jest.advanceTimersByTime(200); });
    expect(document.querySelector(".spinner-wrapper")).not.toBeInTheDocument();
    expect(contenu()).not.toHaveClass("chargement-page--masque");
  });

  it("affiche aussitôt une page sans appel au backend", () => {
    render(<MemoryRouter><ChargementPage><p>Contenu de la page</p></ChargementPage></MemoryRouter>);
    act(() => { jest.advanceTimersByTime(200); });
    expect(document.querySelector(".spinner-wrapper")).not.toBeInTheDocument();
    expect(contenu()).not.toHaveClass("chargement-page--masque");
  });
});
