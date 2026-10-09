// import { screen, render } from "@testing-library/react";
// import UsersList from "./UsersList";
// import { BrowserRouter } from "react-router-dom";
// import { RecoilRoot } from "recoil";
// import { ElementContext, UserContext } from "../../services/Context/Context";

// const user = "";
// const userRole = "";
// const agence = "";
// const decoupage = "";
// const elementsData = {
//     categories: [
//       {
//         categorie_id: "1",
//         nomCategorie: "1",
//       },
//     ],
//     typeCarteGrise: [
//       {
//         categorie_id: "2",
//         type: "CarteGrise",
//       },
//     ],
//     typeVignette: [
//       {
//         typecg_id: "2",
//         type: "CarteGrise",
//       },
//     ],
//     autorisations: [
//       {
//         categorie_id: "2",
//         type: "CarteGrise",
//       },
//     ],
//   };

// beforeEach(() => {
//   render(
//     <RecoilRoot>
//       <UserContext.Provider value={{ user, userRole, agence, decoupage }}>
//         <ElementContext.Provider value={{ elementsData }}>
//           <BrowserRouter>
//             <UsersList />
//           </BrowserRouter>
//         </ElementContext.Provider>
//       </UserContext.Provider>
//     </RecoilRoot>
//   );
// });

// describe("Layout", () => {
//   it("should render the header", () => {
//     const header = getByRole("heading", { name: /Utilisateurs/ });
//     expect(header).toBeInTheDocument();
//   });
// });
