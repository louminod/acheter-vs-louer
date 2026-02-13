export interface AchatParams {
  prixBien: number;
  apport: number;
  tauxCredit: number; // annuel en %
  dureeCredit: number; // en années
  surface: number; // m²
  isNeuf: boolean;
  tauxRevalorisation: number; // annuel en %
  isResidencePrincipale: boolean; // exonération de plus-value immobilière
}

/**
 * Enveloppes d'investissement pour la stratégie de placement
 */
export interface InvestmentStrategy {
  /** Assurance Vie - 30% allocation, 4% net/an */
  assuranceVie: {
    allocation: number; // %
    rendement: number; // % net/an
  };
  /** PER - 20% allocation, 4% net/an */
  per: {
    allocation: number; // %
    rendement: number; // % net/an
  };
  /** SCPI Cash - 25% allocation, ~6.5% (5.5% dividendes + 1% revalo) */
  scpiCash: {
    allocation: number; // %
    rendementDividendes: number; // % dividendes/an
    rendementRevalo: number; // % revalorisation/an
  };
  /** SCPI Crédit - 25% allocation, complexe avec deux phases */
  scpiCredit: {
    allocation: number; // %
    rendementDividendes: number; // % dividendes/an
    rendementRevalo: number; // % revalorisation/an
    tauxCredit: number; // % crédit/an
    dureeCreditAns: number; // années
  };
}

/**
 * Détails calculés pour le SCPI crédit
 */
export interface ScpiCreditDetails {
  montantEmprunte: number;
  mensualiteCredit: number;
  effortNet: number; // mensualité - dividendes SCPI
  nbPartsAchetees: number;
  dividendesMensuels: number;
  /** Mois où le crédit se termine */
  finCreditMois: number;
}

export interface LocationParams {
  loyerMensuel: number;
  augmentationLoyer: number; // annuel en %
  apportInvesti: number; // montant investi dès le départ
}

export interface SimulationParams {
  achat: AchatParams;
  location: LocationParams;
  revenusMensuels: number; // revenus mensuels nets en euros
  chargesCredits: number; // charges de crédits existants en euros/mois
  horizonAns: number;
}

export interface MonthlyData {
  month: number;
  year: number;
  patrimoineAchat: number;
  patrimoineLocation: number;
  coutMensuelAchat: number;
  coutMensuelLocation: number;
  capitalRestantDu: number;
  valeurBien: number;
  capitalPlace: number;
}

export interface TaxCalculation {
  // Plus-value immobilière (achat)
  plusValueImmobiliere: {
    plusValueBrute: number; // prix vente - prix achat
    abattementIR: number; // % d'abattement appliqué IR
    abattementPS: number; // % d'abattement appliqué PS
    baseImposableIR: number; // plus-value après abattement IR
    baseImposablePS: number; // plus-value après abattement PS
    impotIR: number; // montant IR dû
    impotPS: number; // montant PS dû
    impotTotal: number; // total des impôts
    isExoneree: boolean; // résidence principale ou durée > seuils
  };
  // Flat tax sur investissements (location)
  flatTaxInvestissement: {
    gainsAV: number; // gains assurance vie
    gainsPER: number; // gains PER
    gainsSCPI: number; // gains SCPI (dividendes + revalo)
    taxeAV: number; // taxe sur AV
    taxePER: number; // taxe sur PER
    taxeSCPI: number; // taxe sur SCPI
    taxeTotal: number; // total flat tax
  };
}

export interface SimulationResult {
  monthly: MonthlyData[];
  // Totals
  coutTotalAchat: number;
  coutTotalLocation: number;
  patrimoineNetAchat: number;
  patrimoineNetLocation: number;
  fraisNotaire: number;
  mensualiteCredit: number;
  coutMensuelTotalAchat: number;
  investissementMensuel: number;
  // Breakdown mensuel achat
  mensualiteCreditMensuel: number;
  taxeFonciereMensuel: number;
  chargesCoproMensuel: number;
  assurancePNOMensuel: number;
  entretienMensuel: number;
  assuranceEmprunteurMensuel: number;
  // Détails
  coutTotalCredit: number;
  taxesChargesCumulees: number;
  loyersCumules: number;
  rendementsCumules: number;
  pointCroisement: number | null; // mois où location dépasse achat (ou inverse)
  // Fiscalité
  taxCalculation: TaxCalculation;
  patrimoineNetAchatApresFiscalite: number; // patrimoine achat après plus-value
  patrimoineNetLocationApresFiscalite: number; // patrimoine location après flat tax
}
