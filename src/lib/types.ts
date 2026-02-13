export interface AchatParams {
  prixBien: number;
  apport: number;
  tauxCredit: number; // annuel en %
  dureeCredit: number; // en années
  surface: number; // m²
  isNeuf: boolean;
  tauxRevalorisation: number; // annuel en %
}

export interface LocationParams {
  loyerMensuel: number;
  augmentationLoyer: number; // annuel en %
  rendementPlacement: number; // annuel net en %
}

export interface SimulationParams {
  achat: AchatParams;
  location: LocationParams;
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
}
