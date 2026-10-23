// Carrosseries : l'id est la valeur enregistrée sur le véhicule (vehicules.carosserie).
// Les valeurs déjà utilisées sont conservées telles quelles.
export const carosseries = [
  { id: 'Berline', nom: 'Berline' },
  { id: 'Sedan 4D', nom: 'Sedan 4D' },
  { id: 'HATCHBACK', nom: 'HATCHBACK' },
  { id: 'STATION WAGON', nom: 'STATION WAGON (Break)' },
  { id: 'MONOSPACE', nom: 'MONOSPACE' },
  { id: 'MINIVAN', nom: 'MINIVAN' },
  { id: 'COUPE', nom: 'COUPÉ' },
  { id: 'CABRIOLET', nom: 'CABRIOLET' },
  { id: 'CONVERTIBLE', nom: 'CONVERTIBLE' },
  { id: 'LIMOUSINE', nom: 'LIMOUSINE' },
  { id: 'SPORTS CAR', nom: 'SPORTS CAR' },
  { id: 'SUV 4D', nom: 'SUV 4D' },
  { id: 'PICKUP', nom: 'PICKUP' },
  { id: 'PICKUP TRUCK', nom: 'PICKUP TRUCK' },
  { id: 'AMBULANCE', nom: 'AMBULANCE' },
  { id: 'FOURGON', nom: 'FOURGON' },
  { id: 'BUS', nom: 'BUS' },
  { id: 'MOTO', nom: 'MOTO' },
  { id: 'SCOOTER', nom: 'SCOOTER' },
  { id: 'TRICYCLE', nom: 'TRICYCLE' },
  { id: 'QUAD', nom: 'QUAD' },
  { id: 'PLATEAU', nom: 'PLATEAU' },
  { id: 'P.R', nom: 'P.R' },
  { id: 'BENNES', nom: 'BENNES' },
  { id: 'CITERNE', nom: 'CITERNE' },
  { id: 'SAVOYARDE', nom: 'SAVOYARDE' },
  { id: 'PORTE-CONTENEURS', nom: 'PORTE-CONTENEURS' },
  { id: 'PORTE-CHARRE', nom: 'PORTE-CHARRE (porte-engins)' },
  { id: 'FRIGORIFIQUE', nom: 'FRIGORIFIQUE' },
  { id: 'BETONNIERE', nom: 'BÉTONNIÈRE' },
  { id: 'DEPANNEUSE', nom: 'DÉPANNEUSE' },
  { id: 'GRUE', nom: 'GRUE' },
  { id: 'TRACTEUR', nom: 'TRACTEUR' },
  { id: 'FOURCHETTE', nom: 'FOURCHETTE' },
  { id: 'Carrosserie Incorporée(C.I)', nom: 'Carrosserie Incorporée (C.I)' },
];

const CI = 'Carrosserie Incorporée(C.I)';

// Carrosseries possibles pour chaque type de véhicule (types retrouvés par leur nom, les identifiants
// pouvant différer d'un serveur à l'autre)
const PAR_TYPE = {
  // Motocycles
  'MOTOCYCLE': ['MOTO'],
  'TRICYCLE': ['TRICYCLE'],
  'CYCLOMOTEUR': ['MOTO', 'SCOOTER'],
  'SCOOTER': ['SCOOTER'],
  'MOTO TOUT-TERRAIN': ['MOTO'],
  'QUAD': ['QUAD'],
  // Véhicules légers
  'VOITURE': ['Berline', 'Sedan 4D', 'HATCHBACK', 'STATION WAGON', 'MONOSPACE', 'COUPE', 'CABRIOLET', 'CONVERTIBLE', 'LIMOUSINE', 'SPORTS CAR'],
  '4X4': ['SUV 4D', 'PICKUP', 'PICKUP TRUCK', 'STATION WAGON'],
  'PICKUP': ['PICKUP', 'PICKUP TRUCK'],
  'FAMILIALE': ['STATION WAGON', 'MONOSPACE', 'MINIVAN'],
  'FOURGON': ['FOURGON'],
  'FOURGONETTE': ['FOURGON', 'MINIVAN'],
  'BERLINE': ['Berline', 'Sedan 4D', 'HATCHBACK'],
  'BREAK': ['STATION WAGON'],
  'MONOSPACE': ['MONOSPACE', 'MINIVAN'],
  'COUPE': ['COUPE', 'SPORTS CAR'],
  'CABRIOLET': ['CABRIOLET', 'CONVERTIBLE'],
  'AMBULANCE': ['AMBULANCE', 'FOURGON'],
  // Minibus et bus
  'BUS': ['BUS'],
  'MINIBUS': ['BUS', 'FOURGON'],
  'MIDIBUS': ['BUS'],
  'AUTOCAR': ['BUS'],
  'CAR SCOLAIRE': ['BUS'],
  // Camions
  'TRACTEUR ROUTIER': ['TRACTEUR', CI],
  'SEMI-REMORQUE': ['PLATEAU', 'SAVOYARDE', 'BENNES', 'CITERNE', 'PORTE-CONTENEURS', 'PORTE-CHARRE', 'FRIGORIFIQUE'],
  'REMORQUE': ['PLATEAU', 'SAVOYARDE', 'BENNES', 'CITERNE', 'PORTE-CHARRE'],
  'CAMIONETTE': ['FOURGON', 'P.R', 'PLATEAU', 'PICKUP'],
  'CAMION': ['PLATEAU', 'P.R', 'BENNES', 'FOURGON', 'CITERNE', 'SAVOYARDE', 'GRUE', CI],
  'CITERNE': ['CITERNE'],
  'CAMION BENNE': ['BENNES'],
  'CAMION PLATEAU': ['PLATEAU', 'P.R'],
  'PORTE-CONTENEUR': ['PORTE-CONTENEURS'],
  'CAMION FRIGORIFIQUE': ['FRIGORIFIQUE'],
  'CAMION BETONNIERE': ['BETONNIERE'],
  'DEPANNEUSE': ['DEPANNEUSE'],
  'PORTE-ENGINS': ['PORTE-CHARRE'],
  // Engins de chantiers
  'EXCAVATEUR': [CI],
  'BULLDOZER': [CI],
  'PELLE MECANIQUE': [CI],
  'GRADEUR': [CI],
  'CHARGEUSE': [CI],
  'TRACTOPELLE': [CI],
  'COMPACTEUR': [CI],
  'GRUE MOBILE': ['GRUE'],
  'CHARIOT ELEVATEUR': ['FOURCHETTE'],
  'ENGIN DE CHANTIER': [CI, 'GRUE', 'FOURCHETTE'],
  // Engins agricoles
  'ENGIN AGRICOLE': [CI],
  'TRACTEUR AGRICOLE': [CI],
  'MOISSONNEUSE-BATTEUSE': [CI],
  'MOTOCULTEUR': [CI],
  'REMORQUE AGRICOLE': ['PLATEAU', 'BENNES'],
};

const normaliser = (nom) => String(nom || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().trim().replace(/\s+/g, ' ');

/**
 * Carrosseries proposées pour un type (objet { nom }) ; type inconnu ou non choisi : liste complète.
 * La valeur déjà enregistrée reste proposée même si elle n'est plus dans la liste du type.
 */
export const carrosseriesDuType = (type, valeurActuelle) => {
  const ids = type ? PAR_TYPE[normaliser(type.nom)] : null;
  const liste = ids ? carosseries.filter((c) => ids.includes(c.id)) : carosseries;
  if (valeurActuelle && valeurActuelle != 0 && !liste.some((c) => c.id === valeurActuelle))
    return [...liste, { id: valeurActuelle, nom: valeurActuelle }];
  return liste;
};

// Le type a-t-il une liste de carrosseries définie ?
export const typeAvecCarrosseries = (type) => !!(type && PAR_TYPE[normaliser(type.nom)]);
