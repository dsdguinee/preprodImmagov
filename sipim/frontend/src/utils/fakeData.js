import { Link } from "react-router-dom";

// ? Payment data
export const fakePaymentColumns = [
  {
    field: "numRef",
    headerName: "Numero de reference",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "numChassis",
    headerName: "Numero de chassis",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "fullName",
    headerName: "Client",
    description: "This column has a value getter and is not sortable.",
    sortable: false,
    flex: 1,
    minWidth: 150,
    valueGetter: (params) =>
      `${params.row.firstName || ""} ${params.row.lastName || ""}`,
  },
  {
    field: "montant",
    headerName: "Montant",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "date",
    headerName: "Date",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "agent",
    headerName: "Validé par",
    flex: 1,
    minWidth: 150,
  },
  {
    field: "options",
    headerName: "Options",
    sortable: false,
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      return (
        <div className="options">
          <Link to="/payment/invoice">
            <button>Voir facture</button>
          </Link>
        </div>
      );
    },
  },
];

export const fakePaymentRows = [
  {
    id: 1,
    numRef: "VPC-01",
    numChassis: "B52458112378466",
    montant: "2 000 000",
    date: "07/07/2022",
    agent: "Agent 007",
    lastName: "Snow",
    firstName: "Jon",
  },
  {
    id: 2,
    numRef: "VPC-02",
    numChassis: "K4DMFRTAY4FXDZQ",
    montant: "2 200 000",
    date: "07/07/2022",
    agent: "Agent 007",
    lastName: "Lannister",
    firstName: "Cersei",
  },
  {
    id: 3,
    numRef: "VPC-03",
    numChassis: "ETXG2SW7UDU08SD",
    montant: "3 000 000",
    date: "07/07/2022",
    agent: "Agent 007",
    lastName: "Lannister",
    firstName: "Jaime",
  },
  {
    id: 4,
    numRef: "VPC-04",
    numChassis: "31DVWGH45O6I6ED",
    montant: "1 000 000",
    date: "07/07/2022",
    agent: "Agent 007",
    lastName: "Stark",
    firstName: "Arya",
  },
  {
    id: 5,
    numRef: "VPC-05",
    numChassis: "XAPYSZKW0C5T8W0",
    montant: "3 500 000",
    date: "06/07/2022",
    agent: "Agent 007",
    lastName: "Targaryen",
    firstName: "Daenerys",
    age: null,
  },
  {
    id: 6,
    numRef: "VPC-06",
    numChassis: "SWX699779XPRFJS",
    montant: "2 000 000",
    date: "05/07/2022",
    agent: "Agent 007",
    lastName: "Melisandre",
    firstName: null,
  },
  {
    id: 7,
    numRef: "VPC-07",
    numChassis: "OP8KWQ1GMZHPLXY",
    montant: "1 200 000",
    date: "05/07/2022",
    agent: "Agent 007",
    lastName: "Clifford",
    firstName: "Ferrara",
  },
  {
    id: 8,
    numRef: "VPC-08",
    numChassis: "TZ4EH3PB7T3ZYUK",
    montant: "1 500 000",
    date: "04/07/2022",
    agent: "Agent 007",
    lastName: "Frances",
    firstName: "Rossini",
  },
  {
    id: 9,
    numRef: "VPC-09",
    numChassis: "8DL2FHS216D5Q1F",
    montant: "2 500 000",
    date: "04/07/2022",
    agent: "Agent 007",
    lastName: "Roxie",
    firstName: "Harvey",
  },
];

// ? Cart table data for payment
export const paymentCart = [
  {
    id: 1,
    document : 'Carte grise',
    categorie: 'Véhicule léger',
    type: '7 à 12 CV',
    price: '800 000'
  },
  {
    id: 2,
    document : 'Vignette',
    categorie: 'Véhicule léger',
    type: "Jusqu'à 12 CV",
    price: '200 000'
  },
]

// ? Cart table data for other payment
export const otherPaymentCart = [
  {
    id: 1,
    document : 'Vignette',
    categorie: 'Véhicule léger',
    type: '7 à 12 CV',
    price: '800 000'
  },
]