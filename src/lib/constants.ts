export const DEFAULTS = {
  prixBien: 250000,
  apport: 25000,
  tauxCredit: 3.5,
  dureeCredit: 20,
  surface: 60,
  isNeuf: false,
  tauxRevalorisation: 2,
  augmentationLoyer: 1,
  revenusMensuels: 3000,
  chargesCredits: 0,
  horizonAns: 25,
  isResidencePrincipale: true,
};

// Taux pour calculs automatiques
export const TAUX_NOTAIRE_ANCIEN = 0.08;
export const TAUX_NOTAIRE_NEUF = 0.03;
export const TAUX_TAXE_FONCIERE = 0.007; // 0.7% du prix/an
export const CHARGES_COPRO_M2 = 25; // €/m²/an
export const TAUX_ASSURANCE_PNO = 0.002; // 0.2% du prix/an
export const TAUX_ENTRETIEN = 0.01; // 1% du prix/an
export const TAUX_ASSURANCE_EMPRUNTEUR = 0.003; // 0.3% du capital/an
export const RATIO_LOYER_PRIX = 0.004; // loyer mensuel ≈ 0.4% du prix
export const TAUX_ENDETTEMENT_MAX = 0.35; // 35% taux d'endettement HCSF

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
    // dureeCreditAns sera égale au horizon de simulation
  },
} as const;

// Prix SCPI moyen pour calculs (€ par part)
export const PRIX_PART_SCPI = 200;

// Fiscalité française
export const FISCAL_CONSTANTS = {
  // Plus-value immobilière
  plusValue: {
    tauxIR: 19, // % IR sur la plus-value
    tauxPS: 17.2, // % Prélèvements sociaux
    abattementIRParAn: 6, // % d'abattement IR par an à partir de l'année 6
    abattementPSParAn: 1.65, // % d'abattement PS par an à partir de l'année 6
    abattementIRAnnee22: 4, // % d'abattement IR pour l'année 22
    abattementPSAnnee22: 1.60, // % d'abattement PS pour l'année 22
    abattementPSAnnee23: 9, // % d'abattement PS pour l'année 23
    exonerationIRAns: 22, // Exonération totale IR après X ans
    exonerationPSAns: 30, // Exonération totale PS après X ans
  },
  // Flat tax (PFU)
  flatTax: {
    tauxStandard: 30, // % flat tax standard sur les gains
    tauxAVApres8Ans: 24.7, // % flat tax AV après 8 ans (7.5% IR + 17.2% PS)
    abattementAVSingle: 4600, // € d'abattement annuel AV pour un célibataire
    abattementAVCouple: 9200, // € d'abattement annuel AV pour un couple
  },
} as const;
