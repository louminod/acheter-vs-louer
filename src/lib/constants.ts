export const DEFAULTS = {
  prixBien: 250000,
  apport: 25000,
  tauxCredit: 3.5,
  dureeCredit: 20,
  surface: 60,
  isNeuf: false,
  tauxRevalorisation: 2,
  augmentationLoyer: 2,
  rendementPlacement: 4, // DEPRECATED - remplacé par stratégie mixte
  horizonAns: 25,
};

// Taux pour calculs automatiques
export const TAUX_NOTAIRE_ANCIEN = 0.08;
export const TAUX_NOTAIRE_NEUF = 0.03;
export const TAUX_TAXE_FONCIERE = 0.01; // 1% du prix/an
export const CHARGES_COPRO_M2 = 25; // €/m²/an
export const TAUX_ASSURANCE_PNO = 0.002; // 0.2% du prix/an
export const TAUX_ENTRETIEN = 0.01; // 1% du prix/an
export const TAUX_ASSURANCE_EMPRUNTEUR = 0.003; // 0.3% du capital/an
export const RATIO_LOYER_PRIX = 0.004; // loyer mensuel ≈ 0.4% du prix

// Stratégie d'investissement blended
export const INVESTMENT_STRATEGY = {
  assuranceVie: {
    allocation: 30, // %
    rendement: 4, // % net/an
  },
  per: {
    allocation: 20, // %
    rendement: 4, // % net/an  
  },
  scpiCash: {
    allocation: 25, // %
    rendementDividendes: 5.5, // % dividendes/an
    rendementRevalo: 1, // % revalorisation/an
  },
  scpiCredit: {
    allocation: 25, // %
    rendementDividendes: 5.5, // % dividendes/an
    rendementRevalo: 1, // % revalorisation/an
    tauxCredit: 5.35, // % crédit/an
    dureeCreditAns: 25, // années
  },
} as const;

// Prix SCPI moyen pour calculs (€ par part)
export const PRIX_PART_SCPI = 200;
