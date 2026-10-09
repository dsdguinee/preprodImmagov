import { rest } from "msw";

export const handlers = [
  rest.get(
    `{${process.env.REACT_APP_URL}paiement/getPaiements}`,
    (req, res, ctx) => {
      console.log("The mock works");
      return res(
        ctx.json({
          paiements: [
            {
              paiement_id: 1,
              typeClient: "Particulier",
              modeExp: "Personnel",
              fullName: "Tom Sawyer",
              tel: "611969156",
              nif: "DK8564522322",
              chassis: "DK8564522322",
              nomCategorie: "Vehicles legers",
              modeImma: 1,
              categorie_id: 4,
              typeCg: 3,
              typecg_id: 3,
              typeVignette: 3,
              typevg_id: 3,
              user_id: 7,
              montantvignette: null,
              montantcartegrise: null,
              montantautorisation: null,
              autorisation_id: 0,
              pv: 2500,
              cu: 1000,
              user_id: 29,
              printed: 0,
              qrcode: "monimage.com",
              reference: "IZCPYORXVM62512729",
              type_document: "tous",
              type_paiement: "nouveau",
              created_at: new Date(),
              // updated_at: new Date(),
            },
          ],
          status: 200,
          success: true,
        })
      );
    }
  ),
];
