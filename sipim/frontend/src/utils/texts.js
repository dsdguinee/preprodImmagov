import { IoCarSportOutline } from "react-icons/io5";
import { MdAttachMoney } from "react-icons/md";
import { BsFileEarmarkText } from "react-icons/bs";
import dashboardScreen from "../assets/images/slide-2.png";
import loginScreen from "../assets/images/slide-1.png";
import facture from "../assets/images/slide-3.png";

export const onboardingText = [
    {
      header: "Découvrez votre nouvelle plateforme de paiement",
      text: "Gérez les paiements d'immatriculations et de cartes grises plus facilement avec le nouveau VPC.",
      image: loginScreen,
    },
    {
      header: "Une nouvelle interface pour vos paiements",
      text: "L'interface a été complètement revue pour vous rendre l'utilisation plus facile et plus intuitive.",
      image: dashboardScreen,
    },
    {
      header: "Générez les factures automatiquement",
      text: "Après chaque paiement, imprimez immédiatement les factures sans faire patienter le client.",
      image: facture,
    },
  ];

  export const paymentSteps = [
    {
      position: 1,
      icon: <IoCarSportOutline/>,
      description: "Etape 1 sur 3",
      name: "Informations",
    },
    {
      position: 2,
      icon: <MdAttachMoney/>,
      description: "Etape 2 sur 3",
      name: "Paiement",
    },
    {
      position: 3,
      icon: <BsFileEarmarkText/>,
      description: "Etape 3 sur 3",
      name: "Reçu",
    },
  ];