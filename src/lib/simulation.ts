import {
  SimulationParams,
  SimulationResult,
  MonthlyData,
  ScpiCreditDetails,
  InvestmentStrategy,
  TaxCalculation,
} from "./types";
import {
  TAUX_NOTAIRE_ANCIEN,
  TAUX_NOTAIRE_NEUF,
  TAUX_TAXE_FONCIERE,
  CHARGES_COPRO_M2,
  TAUX_ASSURANCE_PNO,
  TAUX_ENTRETIEN,
  TAUX_ASSURANCE_EMPRUNTEUR,
  INVESTMENT_STRATEGY,
  PRIX_PART_SCPI,
  TAUX_ENDETTEMENT_MAX,
  FISCAL_CONSTANTS,
} from "./constants";

/**
 * Calcule une mensualité de crédit selon la formule standard d'amortissement
 * @param capital - Montant emprunté en euros
 * @param tauxAnnuel - Taux d'intérêt annuel en pourcentage
 * @param dureeMois - Durée du prêt en mois
 * @returns Mensualité en euros
 */
function calcMensualite(capital: number, tauxAnnuel: number, dureeMois: number): number {
  const r = tauxAnnuel / 100 / 12;
  if (r === 0) return capital / dureeMois;
  return (capital * r) / (1 - Math.pow(1 + r, -dureeMois));
}

/**
 * Calcule le montant d'emprunt SCPI à partir d'une mensualité donnée
 * @param mensualiteCredit - Mensualité de crédit disponible (incluant assurance)
 * @param tauxAnnuel - Taux d'intérêt annuel en pourcentage
 * @param dureeMois - Durée du prêt en mois
 * @param tauxAssurance - Taux d'assurance annuel en pourcentage (défaut: 0.3%)
 * @returns Montant pouvant être emprunté
 */
function calcMontantEmpruntFromMensualite(
  mensualiteCredit: number, 
  tauxAnnuel: number, 
  dureeMois: number,
  tauxAssurance: number = 0.3
): number {
  const tauxMensuelCredit = tauxAnnuel / 100 / 12;
  const tauxMensuelAssurance = tauxAssurance / 100 / 12;
  const tauxMensuelTotal = tauxMensuelCredit + tauxMensuelAssurance;
  
  if (tauxMensuelTotal === 0) return mensualiteCredit * dureeMois;
  
  // Formule inversée: Capital = Mensualité / (taux_mensuel / (1 - (1+taux_mensuel)^(-durée)))
  const facteur = tauxMensuelTotal / (1 - Math.pow(1 + tauxMensuelTotal, -dureeMois));
  return mensualiteCredit / facteur;
}

/**
 * Calcule la capacité d'emprunt SCPI basée sur le taux d'endettement
 * @param revenusMensuels - Revenus nets mensuels en euros
 * @param loyerMensuel - Loyer mensuel en euros
 * @param chargesCreditsExistants - Charges de crédits existants en euros/mois
 * @param horizonAns - Horizon du crédit en années
 * @returns Détails du crédit SCPI ou null si non viable
 */
export function calculateDebtBasedScpiCredit(
  revenusMensuels: number,
  loyerMensuel: number,
  chargesCreditsExistants: number,
  horizonAns: number
): {
  montantEmpruntSCPI: number;
  mensualiteAvecAssurance: number;
  dividendesMensuels: number;
  effortNet: number;
} | null {
  const capaciteMensuelle = revenusMensuels * TAUX_ENDETTEMENT_MAX;
  const disponiblePourSCPI = capaciteMensuelle - loyerMensuel - chargesCreditsExistants;
  
  if (disponiblePourSCPI <= 0) {
    return null;
  }
  
  const dureeMois = horizonAns * 12;
  const montantEmpruntSCPI = calcMontantEmpruntFromMensualite(
    disponiblePourSCPI,
    INVESTMENT_STRATEGY.scpiCredit.tauxCredit,
    dureeMois,
    0.3 // 0.3% d'assurance emprunteur
  );
  
  const nombreParts = montantEmpruntSCPI / PRIX_PART_SCPI;
  const dividendesMensuels = nombreParts * PRIX_PART_SCPI * (INVESTMENT_STRATEGY.scpiCredit.rendementDividendes / 100 / 12);
  
  const mensualiteCredit = calcMensualite(montantEmpruntSCPI, INVESTMENT_STRATEGY.scpiCredit.tauxCredit, dureeMois);
  const assuranceMensuelle = montantEmpruntSCPI * (0.3 / 100 / 12);
  const mensualiteAvecAssurance = mensualiteCredit + assuranceMensuelle;
  
  const effortNet = mensualiteAvecAssurance - dividendesMensuels;
  
  return {
    montantEmpruntSCPI,
    mensualiteAvecAssurance,
    dividendesMensuels,
    effortNet,
  };
}

/**
 * Calcule les détails du SCPI crédit basé sur l'effort mensuel disponible
 * Résout l'équation: effort = mensualité_crédit - dividendes_SCPI
 * @param effortMensuel - Montant mensuel disponible pour l'effort net (mensualité moins dividendes)
 * @param dureeCreditAns - Durée du crédit en années (maintenant paramétrable)
 * @returns Détails complets de l'opération SCPI crédit
 * @throws Error si les dividendes dépassent la mensualité (cas limite non viable)
 */
function calcScpiCreditDetails(effortMensuel: number, dureeCreditAns: number = 25): ScpiCreditDetails {
  const strategy = INVESTMENT_STRATEGY.scpiCredit;
  const dureeMois = dureeCreditAns * 12;
  const tauxMensuel = strategy.tauxCredit / 100 / 12;
  const dividendeMensuel = (strategy.rendementDividendes / 100) / 12;

  // Résolution de l'équation: effortMensuel = mensualiteCredit - (nombreParts * PRIX_PART_SCPI * dividendeMensuel)
  // Où mensualiteCredit = montantEmprunte * facteur_mensualite
  // Et montantEmprunte = nombreParts * PRIX_PART_SCPI
  
  const facteurMensualite = tauxMensuel / (1 - Math.pow(1 + tauxMensuel, -dureeMois));
  const denominateur = facteurMensualite - dividendeMensuel;
  
  if (denominateur <= 0) {
    // Les dividendes dépassent la mensualité - cas limite
    throw new Error("Dividendes SCPI supérieurs à la mensualité de crédit");
  }

  const nombreParts = effortMensuel / (PRIX_PART_SCPI * denominateur);
  const montantEmprunte = nombreParts * PRIX_PART_SCPI;
  const mensualiteCredit = montantEmprunte * facteurMensualite;
  const dividendesMensuels = nombreParts * PRIX_PART_SCPI * dividendeMensuel;

  return {
    montantEmprunte,
    mensualiteCredit,
    effortNet: effortMensuel,
    nbPartsAchetees: nombreParts,
    dividendesMensuels,
    finCreditMois: dureeMois,
  };
}

/**
 * Calcule le rendement blended pondéré de la stratégie d'investissement
 * Tient compte des phases du SCPI crédit (pendant/après remboursement)
 * @param scpiCredit - Détails de l'opération SCPI crédit
 * @param moisActuel - Mois actuel de la simulation (pour déterminer la phase SCPI)
 * @returns Rendement annuel pondéré en pourcentage
 */
function calcRendementBlended(scpiCredit: ScpiCreditDetails, moisActuel: number, horizonAns: number): number {
  const strategy = INVESTMENT_STRATEGY;
  
  // AV et PER: rendements simples
  const rendementAV = (strategy.assuranceVie.allocation / 100) * strategy.assuranceVie.rendement;
  const rendementPER = (strategy.per.allocation / 100) * strategy.per.rendement;
  
  // SCPI Cash: dividendes + revalo
  const rendementSCPICash = (strategy.scpiCash.allocation / 100) * 
    (strategy.scpiCash.rendementDividendes + strategy.scpiCash.rendementRevalo);
  
  // SCPI Crédit: dépend de la phase (durée = horizon)
  let rendementSCPICredit: number;
  const finCreditMois = horizonAns * 12;
  if (moisActuel <= finCreditMois) {
    // Phase crédit: rendement effectif réduit par l'effort
    // Approximation: seuls les dividendes nets participent au rendement
    rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * strategy.scpiCredit.rendementRevalo;
  } else {
    // Phase post-crédit: rendement plein + cash flow libéré 
    rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * 
      (strategy.scpiCredit.rendementDividendes + strategy.scpiCredit.rendementRevalo);
  }
  
  return rendementAV + rendementPER + rendementSCPICash + rendementSCPICredit;
}

/**
 * Calcule la plus-value immobilière et l'impôt dû à la revente
 * @param prixAchat - Prix d'achat du bien (hors frais)
 * @param prixVente - Prix de vente du bien
 * @param anneesDetention - Nombre d'années de détention
 * @param isResidencePrincipale - Si c'est la résidence principale (exonéré)
 * @returns Détails de la plus-value et impôts dus
 */
function calcPlusValueImmobiliere(
  prixAchat: number,
  prixVente: number,
  anneesDetention: number,
  isResidencePrincipale: boolean = false
): TaxCalculation['plusValueImmobiliere'] {
  const fiscal = FISCAL_CONSTANTS.plusValue;
  const plusValueBrute = Math.max(0, prixVente - prixAchat);
  
  // Résidence principale = exonération totale
  if (isResidencePrincipale) {
    return {
      plusValueBrute,
      abattementIR: 100,
      abattementPS: 100,
      baseImposableIR: 0,
      baseImposablePS: 0,
      impotIR: 0,
      impotPS: 0,
      impotTotal: 0,
      isExoneree: true,
    };
  }
  
  // Calcul des abattements selon la durée de détention
  let abattementIR = 0;
  let abattementPS = 0;
  
  if (anneesDetention >= fiscal.exonerationIRAns) {
    // Exonération totale IR après 22 ans
    abattementIR = 100;
  } else if (anneesDetention >= 6) {
    // Abattement progressif à partir de la 6ème année
    const anneesAbattement = anneesDetention - 5;
    if (anneesDetention < 22) {
      abattementIR = Math.min(100, anneesAbattement * fiscal.abattementIRParAn);
    } else {
      // Année 22: abattement spécial
      abattementIR = 16 * fiscal.abattementIRParAn + fiscal.abattementIRAnnee22;
    }
  }
  
  if (anneesDetention >= fiscal.exonerationPSAns) {
    // Exonération totale PS après 30 ans
    abattementPS = 100;
  } else if (anneesDetention >= 6) {
    // Abattement progressif à partir de la 6ème année
    const anneesAbattement = anneesDetention - 5;
    if (anneesDetention < 22) {
      abattementPS = Math.min(100, anneesAbattement * fiscal.abattementPSParAn);
    } else if (anneesDetention === 22) {
      abattementPS = 16 * fiscal.abattementPSParAn + fiscal.abattementPSAnnee22;
    } else {
      // Années 23 et suivantes
      abattementPS = 16 * fiscal.abattementPSParAn + fiscal.abattementPSAnnee22 + 
                     (anneesDetention - 22) * fiscal.abattementPSAnnee23;
    }
    abattementPS = Math.min(100, abattementPS);
  }
  
  // Application des abattements
  const baseImposableIR = plusValueBrute * (1 - abattementIR / 100);
  const baseImposablePS = plusValueBrute * (1 - abattementPS / 100);
  
  // Calcul des impôts
  const impotIR = baseImposableIR * (fiscal.tauxIR / 100);
  const impotPS = baseImposablePS * (fiscal.tauxPS / 100);
  const impotTotal = impotIR + impotPS;
  
  return {
    plusValueBrute,
    abattementIR,
    abattementPS,
    baseImposableIR,
    baseImposablePS,
    impotIR,
    impotPS,
    impotTotal,
    isExoneree: impotTotal === 0,
  };
}

/**
 * Calcule la flat tax sur les gains d'investissement à la revente
 * @param capitalInitialAV - Capital initial investi en AV
 * @param capitalFinalAV - Capital final AV
 * @param capitalInitialPER - Capital initial investi en PER
 * @param capitalFinalPER - Capital final PER
 * @param capitalInitialSCPI - Capital initial investi en SCPI Cash
 * @param capitalFinalSCPI - Capital final SCPI Cash
 * @param dividendesCumulesSCPI - Dividendes SCPI perçus sur la période
 * @param horizonAns - Horizon de la simulation en années
 * @returns Détails de la flat tax due
 */
function calcFlatTaxInvestissement(
  capitalInitialAV: number,
  capitalFinalAV: number,
  capitalInitialPER: number,
  capitalFinalPER: number,
  capitalInitialSCPI: number,
  capitalFinalSCPI: number,
  dividendesCumulesSCPI: number,
  horizonAns: number
): TaxCalculation['flatTaxInvestissement'] {
  const fiscal = FISCAL_CONSTANTS.flatTax;
  
  // Calcul des gains
  const gainsAV = Math.max(0, capitalFinalAV - capitalInitialAV);
  const gainsPER = Math.max(0, capitalFinalPER - capitalInitialPER);
  const gainsSCPI = Math.max(0, capitalFinalSCPI - capitalInitialSCPI) + dividendesCumulesSCPI;
  
  // Calcul des taxes
  let taxeAV: number;
  if (horizonAns >= 8) {
    // AV après 8 ans: taux réduit + abattement
    const abattement = fiscal.abattementAVSingle; // Supposons un célibataire
    const gainsImposablesAV = Math.max(0, gainsAV - abattement);
    taxeAV = gainsImposablesAV * (fiscal.tauxAVApres8Ans / 100);
  } else {
    // AV avant 8 ans: flat tax standard
    taxeAV = gainsAV * (fiscal.tauxStandard / 100);
  }
  
  // PER: flat tax standard sur les gains
  const taxePER = gainsPER * (fiscal.tauxStandard / 100);
  
  // SCPI: flat tax sur dividendes + gains de revalo
  const taxeSCPI = gainsSCPI * (fiscal.tauxStandard / 100);
  
  const taxeTotal = taxeAV + taxePER + taxeSCPI;
  
  return {
    gainsAV,
    gainsPER,
    gainsSCPI,
    taxeAV,
    taxePER,
    taxeSCPI,
    taxeTotal,
  };
}

/**
 * Exécute la simulation complète "Achat vs Location" avec stratégie d'investissement blended
 * 
 * Pour le scénario achat: calcule l'évolution du patrimoine (valeur bien - dette restante)
 * Pour le scénario location: répartit l'investissement mensuel selon une stratégie diversifiée:
 * - 30% Assurance Vie (4% net/an)
 * - 20% PER (4% net/an)  
 * - 25% SCPI Cash (5.5% dividendes + 1% revalo = ~6.5%)
 * - 25% SCPI Crédit (phases: effort réduit puis dividendes libérés)
 * 
 * @param params - Paramètres complets de la simulation
 * @returns Résultats détaillés mois par mois et totaux
 */
export function runSimulation(params: SimulationParams): SimulationResult {
  const { achat, location, revenusMensuels, chargesCredits, horizonAns } = params;
  const totalMonths = horizonAns * 12;
  const dureeCreditMois = achat.dureeCredit * 12;

  // Frais de notaire
  const fraisNotaire = achat.prixBien * (achat.isNeuf ? TAUX_NOTAIRE_NEUF : TAUX_NOTAIRE_ANCIEN);
  const capitalEmprunte = achat.prixBien + fraisNotaire - achat.apport;
  const mensualiteCredit = calcMensualite(capitalEmprunte, achat.tauxCredit, dureeCreditMois);

  // Charges mensuelles fixes
  const taxeFonciereMensuel = (achat.prixBien * TAUX_TAXE_FONCIERE) / 12;
  const chargesCoproMensuel = (achat.surface * CHARGES_COPRO_M2) / 12;
  const assurancePNOMensuel = (achat.prixBien * TAUX_ASSURANCE_PNO) / 12;
  const entretienMensuel = (achat.prixBien * TAUX_ENTRETIEN) / 12;
  const assuranceEmprunteurMensuel = (capitalEmprunte * TAUX_ASSURANCE_EMPRUNTEUR) / 12;

  const chargesFixes = taxeFonciereMensuel + chargesCoproMensuel + assurancePNOMensuel + entretienMensuel;
  const coutMensuelTotalAchat = mensualiteCredit + chargesFixes + assuranceEmprunteurMensuel;
  const coutMensuelApresCredit = chargesFixes;

  // Location: investissement mensuel initial
  const loyerInitial = location.loyerMensuel;
  const investissementMensuelInitial = Math.max(0, coutMensuelTotalAchat - loyerInitial);

  // === NOUVELLE STRATÉGIE D'INVESTISSEMENT BLENDED AVEC CALCUL DETTE ===
  
  // Calcul des détails SCPI Crédit basé sur la capacité d'endettement
  const scpiCreditDebt = calculateDebtBasedScpiCredit(
    revenusMensuels,
    location.loyerMensuel,
    chargesCredits,
    horizonAns
  );
  
  // Si pas de capacité pour SCPI crédit, allocation redistribuée sur les autres enveloppes
  let scpiCredit: ScpiCreditDetails;
  let investmentAllocationAdjusted: {
    assuranceVie: { allocation: number; rendement: number };
    per: { allocation: number; rendement: number };
    scpiCash: { allocation: number; rendementDividendes: number; rendementRevalo: number };
    scpiCredit: { allocation: number; rendementDividendes: number; rendementRevalo: number; tauxCredit: number };
  };
  
  if (!scpiCreditDebt) {
    // Pas de SCPI crédit possible, redistribution proportionnelle
    const totalAutres = INVESTMENT_STRATEGY.assuranceVie.allocation + 
                       INVESTMENT_STRATEGY.per.allocation + 
                       INVESTMENT_STRATEGY.scpiCash.allocation;
    const facteurRedistribution = (totalAutres + INVESTMENT_STRATEGY.scpiCredit.allocation) / totalAutres;
    
    investmentAllocationAdjusted = {
      assuranceVie: {
        allocation: INVESTMENT_STRATEGY.assuranceVie.allocation * facteurRedistribution,
        rendement: INVESTMENT_STRATEGY.assuranceVie.rendement
      },
      per: {
        allocation: INVESTMENT_STRATEGY.per.allocation * facteurRedistribution,
        rendement: INVESTMENT_STRATEGY.per.rendement
      },
      scpiCash: {
        allocation: INVESTMENT_STRATEGY.scpiCash.allocation * facteurRedistribution,
        rendementDividendes: INVESTMENT_STRATEGY.scpiCash.rendementDividendes,
        rendementRevalo: INVESTMENT_STRATEGY.scpiCash.rendementRevalo
      },
      scpiCredit: {
        allocation: 0,
        rendementDividendes: INVESTMENT_STRATEGY.scpiCredit.rendementDividendes,
        rendementRevalo: INVESTMENT_STRATEGY.scpiCredit.rendementRevalo,
        tauxCredit: INVESTMENT_STRATEGY.scpiCredit.tauxCredit
      }
    };
    
    scpiCredit = {
      montantEmprunte: 0,
      mensualiteCredit: 0,
      effortNet: 0,
      nbPartsAchetees: 0,
      dividendesMensuels: 0,
      finCreditMois: 0,
    };
  } else {
    // SCPI crédit viable, utiliser les allocations normales
    investmentAllocationAdjusted = {
      assuranceVie: {
        allocation: INVESTMENT_STRATEGY.assuranceVie.allocation,
        rendement: INVESTMENT_STRATEGY.assuranceVie.rendement
      },
      per: {
        allocation: INVESTMENT_STRATEGY.per.allocation,
        rendement: INVESTMENT_STRATEGY.per.rendement
      },
      scpiCash: {
        allocation: INVESTMENT_STRATEGY.scpiCash.allocation,
        rendementDividendes: INVESTMENT_STRATEGY.scpiCash.rendementDividendes,
        rendementRevalo: INVESTMENT_STRATEGY.scpiCash.rendementRevalo
      },
      scpiCredit: {
        allocation: INVESTMENT_STRATEGY.scpiCredit.allocation,
        rendementDividendes: INVESTMENT_STRATEGY.scpiCredit.rendementDividendes,
        rendementRevalo: INVESTMENT_STRATEGY.scpiCredit.rendementRevalo,
        tauxCredit: INVESTMENT_STRATEGY.scpiCredit.tauxCredit
      }
    };
    
    scpiCredit = {
      montantEmprunte: scpiCreditDebt.montantEmpruntSCPI,
      mensualiteCredit: scpiCreditDebt.mensualiteAvecAssurance,
      effortNet: scpiCreditDebt.effortNet,
      nbPartsAchetees: scpiCreditDebt.montantEmpruntSCPI / PRIX_PART_SCPI,
      dividendesMensuels: scpiCreditDebt.dividendesMensuels,
      finCreditMois: horizonAns * 12,
    };
  }

  // Répartition de l'apport initial entre les enveloppes (selon allocation ajustée)
  const apportAV = location.apportInvesti * (investmentAllocationAdjusted.assuranceVie.allocation / 100);
  const apportPER = location.apportInvesti * (investmentAllocationAdjusted.per.allocation / 100);
  const apportSCPICash = location.apportInvesti * (investmentAllocationAdjusted.scpiCash.allocation / 100);
  const apportSCPICredit = location.apportInvesti * (investmentAllocationAdjusted.scpiCredit.allocation / 100);

  // Initialisation des capitaux par enveloppe
  let capitalAV = apportAV;
  let capitalPER = apportPER;
  let capitalSCPICash = apportSCPICash;
  let capitalSCPICredit = apportSCPICredit; // Valeur des parts SCPI crédit
  let restantDuSCPI = Math.max(0, scpiCredit.montantEmprunte - apportSCPICredit); // Dette SCPI restante

  const monthly: MonthlyData[] = [];
  let capitalRestantDu = capitalEmprunte;
  let valeurBien = achat.prixBien;
  let coutTotalAchat = achat.apport + fraisNotaire;
  let coutTotalLocation = 0;
  let loyersCumules = 0;
  let coutTotalCredit = 0;
  let taxesChargesCumulees = 0;
  let pointCroisement: number | null = null;
  let prevDiff = 0;

  const tauxMensuelCredit = achat.tauxCredit / 100 / 12;
  
  // Taux mensuels pour chaque enveloppe
  const tauxMensuelAV = investmentAllocationAdjusted.assuranceVie.rendement / 100 / 12;
  const tauxMensuelPER = investmentAllocationAdjusted.per.rendement / 100 / 12;
  const tauxMensuelSCPICashDividendes = investmentAllocationAdjusted.scpiCash.rendementDividendes / 100 / 12;
  const tauxMensuelSCPICashRevalo = investmentAllocationAdjusted.scpiCash.rendementRevalo / 100 / 12;
  const tauxMensuelSCPICreditDividendes = investmentAllocationAdjusted.scpiCredit.rendementDividendes / 100 / 12;
  const tauxMensuelSCPICreditRevalo = investmentAllocationAdjusted.scpiCredit.rendementRevalo / 100 / 12;
  const tauxMensuelCreditSCPI = investmentAllocationAdjusted.scpiCredit.tauxCredit / 100 / 12;

  for (let m = 1; m <= totalMonths; m++) {
    const year = Math.ceil(m / 12);

    // === ACHAT ===
    if (m <= dureeCreditMois) {
      const interets = capitalRestantDu * tauxMensuelCredit;
      const capitalRembourse = mensualiteCredit - interets;
      capitalRestantDu = Math.max(0, capitalRestantDu - capitalRembourse);
      coutTotalCredit += mensualiteCredit;
      coutTotalAchat += coutMensuelTotalAchat;
    } else {
      coutTotalAchat += coutMensuelApresCredit;
    }
    taxesChargesCumulees += chargesFixes + (m <= dureeCreditMois ? assuranceEmprunteurMensuel : 0);

    // Revalorisation annuelle du bien
    if (m % 12 === 0) {
      valeurBien *= 1 + achat.tauxRevalorisation / 100;
    }

    const patrimoineAchat = valeurBien - capitalRestantDu;

    // === LOCATION AVEC STRATÉGIE BLENDED ===
    const loyerActuel = loyerInitial * Math.pow(1 + location.augmentationLoyer / 100, year - 1);
    const coutMensuelAchatActuel = m <= dureeCreditMois ? coutMensuelTotalAchat : coutMensuelApresCredit;
    const investissementMensuelTotal = Math.max(0, coutMensuelAchatActuel - loyerActuel);

    loyersCumules += loyerActuel;
    coutTotalLocation += loyerActuel;

    // Répartition mensuelle entre enveloppes (selon allocation ajustée)
    let invAV = investissementMensuelTotal * (investmentAllocationAdjusted.assuranceVie.allocation / 100);
    let invPER = investissementMensuelTotal * (investmentAllocationAdjusted.per.allocation / 100);
    let invSCPICash = investissementMensuelTotal * (investmentAllocationAdjusted.scpiCash.allocation / 100);
    let invSCPICredit = investissementMensuelTotal * (investmentAllocationAdjusted.scpiCredit.allocation / 100);

    // Phase SCPI Crédit
    let cashFlowLibere = 0;
    if (m <= scpiCredit.finCreditMois) {
      // Phase crédit: l'effort net va au remboursement du crédit SCPI
      const interetsSCPI = restantDuSCPI * tauxMensuelCreditSCPI;
      const capitalRembourseSCPI = Math.min(scpiCredit.mensualiteCredit - interetsSCPI, restantDuSCPI);
      restantDuSCPI = Math.max(0, restantDuSCPI - capitalRembourseSCPI);
      
      // L'investissement alloué au SCPI crédit sert à payer l'effort net
      // Le reste (dividendes SCPI) est réinvesti dans la même enveloppe
    } else {
      // Phase post-crédit: le cash flow est libéré (mensualité + dividendes)
      cashFlowLibere = scpiCredit.mensualiteCredit + scpiCredit.dividendesMensuels;
    }

    // Évolution des capitaux avec rendements composés
    capitalAV = capitalAV * (1 + tauxMensuelAV) + invAV;
    capitalPER = capitalPER * (1 + tauxMensuelPER) + invPER;
    
    // SCPI Cash: dividendes réinvestis + revalorisation des parts
    const dividendesSCPICash = capitalSCPICash * tauxMensuelSCPICashDividendes;
    capitalSCPICash = capitalSCPICash * (1 + tauxMensuelSCPICashRevalo) + invSCPICash + dividendesSCPICash;
    
    // SCPI Crédit: revalorisation des parts + évolution
    const dividendesSCPICredit = capitalSCPICredit * tauxMensuelSCPICreditDividendes;
    if (m <= scpiCredit.finCreditMois) {
      // Pendant le crédit: dividendes réinvestis dans cette enveloppe
      capitalSCPICredit = capitalSCPICredit * (1 + tauxMensuelSCPICreditRevalo) + dividendesSCPICredit;
    } else {
      // Après le crédit: dividendes + revalorisation + cash flow libéré réparti
      capitalSCPICredit = capitalSCPICredit * (1 + tauxMensuelSCPICreditRevalo) + dividendesSCPICredit;
      
      // Répartition du cash flow libéré proportionnellement aux autres enveloppes
      const totalAutres = investmentAllocationAdjusted.assuranceVie.allocation + 
                         investmentAllocationAdjusted.per.allocation + 
                         investmentAllocationAdjusted.scpiCash.allocation;
      if (totalAutres > 0) {
        capitalAV += cashFlowLibere * (investmentAllocationAdjusted.assuranceVie.allocation / totalAutres);
        capitalPER += cashFlowLibere * (investmentAllocationAdjusted.per.allocation / totalAutres);
        capitalSCPICash += cashFlowLibere * (investmentAllocationAdjusted.scpiCash.allocation / totalAutres);
      }
    }

    // Patrimoine location = somme de toutes les enveloppes - dette SCPI restante
    const patrimoineLocation = capitalAV + capitalPER + capitalSCPICash + capitalSCPICredit - restantDuSCPI;

    // Point de croisement
    const diff = patrimoineAchat - patrimoineLocation;
    if (m > 1 && prevDiff * diff < 0 && pointCroisement === null) {
      pointCroisement = m;
    }
    prevDiff = diff;

    monthly.push({
      month: m,
      year,
      patrimoineAchat,
      patrimoineLocation,
      coutMensuelAchat: coutMensuelAchatActuel,
      coutMensuelLocation: loyerActuel,
      capitalRestantDu,
      valeurBien,
      capitalPlace: patrimoineLocation, // Pour compatibilité
    });
  }

  const last = monthly[monthly.length - 1];
  const rendementsCumules = last.patrimoineLocation - location.apportInvesti - loyersCumules;

  // === CALCULS FISCAUX ===
  
  // Plus-value immobilière (achat)
  const plusValueImmobiliere = calcPlusValueImmobiliere(
    achat.prixBien,
    last.valeurBien,
    horizonAns,
    achat.isResidencePrincipale
  );
  
  // Flat tax sur investissements (location)
  // Calcul des capitaux initiaux et gains de chaque enveloppe
  const capitalInitialTotalAV = apportAV;
  const capitalInitialTotalPER = apportPER;
  const capitalInitialTotalSCPI = apportSCPICash;
  
  // Estimation des dividendes SCPI perçus sur la période
  const dividendesMensuelsSCPI = capitalSCPICash * (investmentAllocationAdjusted.scpiCash.rendementDividendes / 100 / 12);
  const dividendesCumulesSCPI = dividendesMensuelsSCPI * totalMonths;
  
  const flatTaxInvestissement = calcFlatTaxInvestissement(
    capitalInitialTotalAV,
    capitalAV,
    capitalInitialTotalPER,
    capitalPER,
    capitalInitialTotalSCPI,
    capitalSCPICash,
    dividendesCumulesSCPI,
    horizonAns
  );
  
  // Patrimoine net après fiscalité
  const patrimoineNetAchatApresFiscalite = last.patrimoineAchat - plusValueImmobiliere.impotTotal;
  const patrimoineNetLocationApresFiscalite = last.patrimoineLocation - flatTaxInvestissement.taxeTotal;

  return {
    monthly,
    coutTotalAchat,
    coutTotalLocation,
    patrimoineNetAchat: last.patrimoineAchat,
    patrimoineNetLocation: last.patrimoineLocation,
    fraisNotaire,
    mensualiteCredit,
    coutMensuelTotalAchat,
    investissementMensuel: investissementMensuelInitial,
    mensualiteCreditMensuel: mensualiteCredit,
    taxeFonciereMensuel,
    chargesCoproMensuel,
    assurancePNOMensuel,
    entretienMensuel,
    assuranceEmprunteurMensuel,
    coutTotalCredit,
    taxesChargesCumulees,
    loyersCumules,
    rendementsCumules,
    pointCroisement,
    // Nouveaux champs fiscaux
    taxCalculation: {
      plusValueImmobiliere,
      flatTaxInvestissement,
    },
    patrimoineNetAchatApresFiscalite,
    patrimoineNetLocationApresFiscalite,
  };
}

/**
 * Calcule les détails SCPI crédit pour l'affichage dans l'interface
 * Utilise maintenant le calcul basé sur la capacité d'endettement 
 */
export function getScpiCreditDetails(
  investissementMensuel: number, 
  params?: { revenus?: number; loyer?: number; chargesCredits?: number; horizon?: number }
): ScpiCreditDetails {
  // Si les paramètres de capacité sont fournis, utiliser le calcul debt-based
  if (params?.revenus && params?.loyer !== undefined && params?.chargesCredits !== undefined && params?.horizon) {
    const scpiCreditDebt = calculateDebtBasedScpiCredit(
      params.revenus,
      params.loyer, 
      params.chargesCredits,
      params.horizon
    );
    
    if (scpiCreditDebt) {
      return {
        montantEmprunte: scpiCreditDebt.montantEmpruntSCPI,
        mensualiteCredit: scpiCreditDebt.mensualiteAvecAssurance,
        effortNet: scpiCreditDebt.effortNet,
        nbPartsAchetees: scpiCreditDebt.montantEmpruntSCPI / PRIX_PART_SCPI,
        dividendesMensuels: scpiCreditDebt.dividendesMensuels,
        finCreditMois: params.horizon * 12,
      };
    } else {
      // Pas de capacité pour SCPI crédit
      return {
        montantEmprunte: 0,
        mensualiteCredit: 0,
        effortNet: 0,
        nbPartsAchetees: 0,
        dividendesMensuels: 0,
        finCreditMois: 0,
      };
    }
  }
  
  // Fallback sur l'ancien calcul par allocation (pour compatibilité)
  const allocationSCPICredit = investissementMensuel * (INVESTMENT_STRATEGY.scpiCredit.allocation / 100);
  try {
    return calcScpiCreditDetails(allocationSCPICredit, 25); // Utilise 25 ans par défaut
  } catch {
    return {
      montantEmprunte: 0,
      mensualiteCredit: 0,
      effortNet: 0,
      nbPartsAchetees: 0,
      dividendesMensuels: 0,
      finCreditMois: 0,
    };
  }
}

/**
 * Calcule le rendement blended pondéré moyen de la stratégie
 * (approximation pour affichage, ne tient pas compte des phases SCPI crédit)
 */
export function getRendementBlended(): number {
  const strategy = INVESTMENT_STRATEGY;
  
  const rendementAV = (strategy.assuranceVie.allocation / 100) * strategy.assuranceVie.rendement;
  const rendementPER = (strategy.per.allocation / 100) * strategy.per.rendement;
  const rendementSCPICash = (strategy.scpiCash.allocation / 100) * 
    (strategy.scpiCash.rendementDividendes + strategy.scpiCash.rendementRevalo);
  
  // Pour SCPI crédit, utilise une approximation du rendement moyen
  // (en réalité il varie selon les phases)
  const rendementSCPICredit = (strategy.scpiCredit.allocation / 100) * 
    (strategy.scpiCredit.rendementDividendes + strategy.scpiCredit.rendementRevalo) * 0.7; // facteur de réduction pendant crédit
  
  return rendementAV + rendementPER + rendementSCPICash + rendementSCPICredit;
}

/**
 * Retourne la stratégie d'investissement avec les détails pour l'affichage
 */
export function getInvestmentStrategy(): typeof INVESTMENT_STRATEGY {
  return INVESTMENT_STRATEGY;
}
