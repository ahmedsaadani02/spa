import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Subject, startWith, takeUntil } from 'rxjs';

type ProductType = 'fenetre' | 'porte' | 'box' | 'custom';

interface SerieFormValue {
  id: string;
  nom: string;
  longueurBarre: number;
  prixBarre: number;
}

interface PieceFormValue {
  designation: string;
  serieId: string;
  longueur: number;  // m
  quantite: number;
}

interface AccessoryFormValue {
  designation?: string | null;
  quantite?: number | null;
  prixUnitaire?: number | null;
}

interface SerieResult {
  id: string;
  nom: string;
  longueurPieces: number;
  pertes: number;
  consommation: number;
  nbBarres: number;
  longueurAchetee: number;
  chute: number;
  cout: number;
}

interface EstimationResult {
  consommationTotaleMetres: number;
  longueurAcheteeTotale: number;
  chuteTotale: number;
  coutBarres: number;

  surfaceVerre: number;
  coutVerre: number;

  coutAccessoires: number;
  coutTotal: number;

  series: SerieResult[];
}

@Component({
  selector: 'app-estimation',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './estimation.component.html',
  styleUrls: ['./estimation.component.css']
})
export class EstimationComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();

  form = this.fb.group({
    series: this.fb.array([]),
    produit: this.fb.group({
      type: ['fenetre' as ProductType],
      largeur: [1.2, [Validators.min(0)]],
      hauteur: [1.0, [Validators.min(0)]],
      profondeur: [0.4, [Validators.min(0)]],
      cadreRenfort: [false]
    }),
    pieces: this.fb.array([]),
    options: this.fb.group({
      margeChute: [0],
      pertesCoupeCm: [0.2]
    }),
    verre: this.fb.group({
      activerVerre: [false],
      prixVerreM2: [0]
    }),
    accessoires: this.fb.array([])
  });

  result: EstimationResult = {
    consommationTotaleMetres: 0,
    longueurAcheteeTotale: 0,
    chuteTotale: 0,
    coutBarres: 0,
    surfaceVerre: 0,
    coutVerre: 0,
    coutAccessoires: 0,
    coutTotal: 0,
    series: []
  };

  constructor(private fb: FormBuilder) {
    // séries par défaut
    this.addSerie('Série 40', 6.3, 0);
    this.addSerie('Série 76', 6.3, 0);
  }

  ngOnInit(): void {
    // par défaut : générer une fenêtre
    this.generatePieces();

    this.form.valueChanges
      .pipe(startWith(this.form.getRawValue()), takeUntil(this.destroy$))
      .subscribe(() => this.compute());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ---------- getters ----------
  get series(): FormArray {
    return this.form.get('series') as FormArray;
  }

  get pieces(): FormArray {
    return this.form.get('pieces') as FormArray;
  }

  get accessoires(): FormArray {
    return this.form.get('accessoires') as FormArray;
  }

  get productType(): ProductType {
    return (this.form.get('produit.type')?.value as ProductType) ?? 'fenetre';
  }

  get seriesOptions(): { id: string; nom: string }[] {
    const values = (this.series.getRawValue() as SerieFormValue[]) ?? [];
    return values.map(v => ({ id: v.id, nom: (v.nom || v.id).trim() }));
  }

  // ---------- UI helpers ----------
  pieceTotalMetres(index: number): number {
    const p = this.pieces.at(index).value as PieceFormValue;
    return this.round2(this.toNumber(p.longueur) * Math.max(1, Math.floor(this.toNumber(p.quantite))));
  }

  // ---------- Séries ----------
  addSerie(nom: string = 'Série', longueurBarre: number = 6.3, prixBarre: number = 0): void {
    this.series.push(this.createSerie({ nom, longueurBarre, prixBarre }));
    // si aucune pièce n'a de série, on peut assigner la première
    if (this.pieces.length > 0) this.ensurePiecesSerie();
  }

  removeSerie(index: number): void {
    if (this.series.length <= 1) return;
    const removed = (this.series.at(index).value as SerieFormValue)?.id;
    this.series.removeAt(index);

    // re-assigner les pièces qui pointaient vers la série supprimée
    const firstId = (this.series.at(0).value as SerieFormValue)?.id;
    this.pieces.controls.forEach(ctrl => {
      if ((ctrl.get('serieId')?.value as string) === removed) {
        ctrl.get('serieId')?.setValue(firstId);
      }
    });
  }

  private createSerie(initial?: Partial<SerieFormValue>): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      id: [initial?.id ?? this.createId('serie')],
      nom: [initial?.nom ?? 'Série', Validators.required],
      longueurBarre: [initial?.longueurBarre ?? 6.3, [Validators.required, Validators.min(0.1)]],
      prixBarre: [initial?.prixBarre ?? 0, [Validators.min(0)]]
    });
  }

  // ---------- Pièces / branches ----------
  addPiece(): void {
    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';
    this.pieces.push(this.createPiece({ serieId: firstSerieId }));
  }

  removePiece(index: number): void {
    this.pieces.removeAt(index);
  }

  private createPiece(initial?: Partial<PieceFormValue>): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      designation: [initial?.designation ?? '', Validators.required],
      serieId: [initial?.serieId ?? '', Validators.required],
      longueur: [initial?.longueur ?? 0, [Validators.required, Validators.min(0)]],
      quantite: [initial?.quantite ?? 1, [Validators.required, Validators.min(1)]]
    });
  }

  private ensurePiecesSerie(): void {
    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';
    this.pieces.controls.forEach(ctrl => {
      const val = (ctrl.get('serieId')?.value as string) ?? '';
      if (!val) ctrl.get('serieId')?.setValue(firstSerieId);
    });
  }

  // Génère automatiquement les branches selon dimensions
  generatePieces(): void {
    const raw = this.form.getRawValue();
    const type = (raw.produit?.type as ProductType) ?? 'fenetre';
    const largeur = this.toNumber(raw.produit?.largeur);
    const hauteur = this.toNumber(raw.produit?.hauteur);
    const profondeur = this.toNumber(raw.produit?.profondeur);
    const renfort = !!raw.produit?.cadreRenfort;

    const firstSerieId = (this.series.at(0).value as SerieFormValue)?.id ?? '';

    this.pieces.clear();

    if (type === 'custom') {
      // rien, l'utilisateur ajoute à la main
      return;
    }

    if (type === 'fenetre') {
      // 2 montants + 2 traverses
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      return;
    }

    if (type === 'porte') {
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      if (renfort) {
        this.pieces.push(this.createPiece({ designation: 'Renfort (traverse)', serieId: firstSerieId, longueur: largeur, quantite: 1 }));
      }
      return;
    }

    if (type === 'box') {
      // cadre (fenêtre) + 2 profondeurs
      this.pieces.push(this.createPiece({ designation: 'Montant vertical', serieId: firstSerieId, longueur: hauteur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Traverse horizontale', serieId: firstSerieId, longueur: largeur, quantite: 2 }));
      this.pieces.push(this.createPiece({ designation: 'Profondeur', serieId: firstSerieId, longueur: profondeur, quantite: 2 }));
      return;
    }
  }

  // ---------- Accessoires ----------
  addAccessory(): void {
    this.accessoires.push(this.createAccessory());
  }

  removeAccessory(index: number): void {
    this.accessoires.removeAt(index);
  }

  private createAccessory(): ReturnType<FormBuilder['group']> {
    return this.fb.group({
      designation: [''],
      quantite: [1, [Validators.min(0)]],
      prixUnitaire: [0, [Validators.min(0)]]
    });
  }

  // ---------- Reset ----------
  reset(): void {
    // garde les séries par défaut, mais reset valeurs
    const serieValues = (this.series.getRawValue() as SerieFormValue[]) ?? [];
    this.form.reset({
      produit: { type: 'fenetre', largeur: 1.2, hauteur: 1.0, profondeur: 0.4, cadreRenfort: false },
      options: { margeChute: 0, pertesCoupeCm: 0.2 },
      verre: { activerVerre: false, prixVerreM2: 0 },
      accessoires: []
    });

    // reset séries
    this.series.clear();
    if (serieValues.length > 0) {
      serieValues.forEach(s => this.addSerie(s.nom || 'Série', this.toNumber(s.longueurBarre) || 6.3, this.toNumber(s.prixBarre) || 0));
    } else {
      this.addSerie('Série 40', 6.3, 0);
      this.addSerie('Série 76', 6.3, 0);
    }

    this.accessoires.clear();
    this.generatePieces();
    this.compute();
  }

  // ---------- Print ----------
  print(): void {
    window.print();
  }

  // ---------- Compute ----------
  compute(): void {
    const raw = this.form.getRawValue();

    const series = ((raw.series ?? []) as SerieFormValue[]).map(s => ({
      id: s.id,
      nom: (s.nom ?? '').trim() || s.id,
      longueurBarre: Math.max(0, this.toNumber(s.longueurBarre)),
      prixBarre: Math.max(0, this.toNumber(s.prixBarre))
    }));

    const pieces = (raw.pieces ?? []) as PieceFormValue[];
    const pertesCoupeM = Math.max(0, this.toNumber(raw.options?.pertesCoupeCm)) / 100;
    const margeChuteRate = Math.max(0, this.toNumber(raw.options?.margeChute)) / 100;

    const serieResults: SerieResult[] = series.map(serie => {
      const piecesSerie = pieces.filter(p => p.serieId === serie.id);

      const longueurPieces = piecesSerie.reduce((sum, p) => {
        const L = Math.max(0, this.toNumber(p.longueur));
        const q = Math.max(1, Math.floor(this.toNumber(p.quantite)));
        return sum + L * q;
      }, 0);

      const nbPieces = piecesSerie.reduce((sum, p) => sum + Math.max(1, Math.floor(this.toNumber(p.quantite))), 0);

      const pertes = nbPieces * pertesCoupeM;
      const consommation = (longueurPieces + pertes) * (1 + margeChuteRate);

      const nbBarres = (serie.longueurBarre > 0 && consommation > 0)
        ? Math.ceil(consommation / serie.longueurBarre)
        : 0;

      const longueurAchetee = nbBarres * serie.longueurBarre;
      const chute = Math.max(0, longueurAchetee - consommation);
      const cout = nbBarres * serie.prixBarre;

      return {
        id: serie.id,
        nom: serie.nom,
        longueurPieces: this.round2(longueurPieces),
        pertes: this.round2(pertes),
        consommation: this.round2(consommation),
        nbBarres,
        longueurAchetee: this.round2(longueurAchetee),
        chute: this.round2(chute),
        cout: this.round2(cout)
      };
    });

    const consommationTotaleMetres = this.round2(serieResults.reduce((s, r) => s + r.consommation, 0));
    const longueurAcheteeTotale = this.round2(serieResults.reduce((s, r) => s + r.longueurAchetee, 0));
    const chuteTotale = this.round2(serieResults.reduce((s, r) => s + r.chute, 0));
    const coutBarres = this.round2(serieResults.reduce((s, r) => s + r.cout, 0));

    // verre (surface estimée par dimensions)
    const type = (raw.produit?.type as ProductType) ?? 'fenetre';
    const largeur = Math.max(0, this.toNumber(raw.produit?.largeur));
    const hauteur = Math.max(0, this.toNumber(raw.produit?.hauteur));

    let surfaceVerre = 0;
    if (type === 'fenetre' || type === 'porte' || type === 'box') {
      surfaceVerre = largeur * hauteur;
    }

    const activerVerre = !!raw.verre?.activerVerre;
    const prixVerreM2 = Math.max(0, this.toNumber(raw.verre?.prixVerreM2));
    const coutVerre = activerVerre ? surfaceVerre * prixVerreM2 : 0;

    // accessoires
    const accessoires = (raw.accessoires ?? []) as AccessoryFormValue[];
    const coutAccessoires = accessoires.reduce((sum, a) => {
      const q = Math.max(0, this.toNumber(a.quantite));
      const pu = Math.max(0, this.toNumber(a.prixUnitaire));
      return sum + q * pu;
    }, 0);

    const coutTotal = coutBarres + coutVerre + coutAccessoires;

    this.result = {
      consommationTotaleMetres,
      longueurAcheteeTotale,
      chuteTotale,
      coutBarres,
      surfaceVerre: this.round2(surfaceVerre),
      coutVerre: this.round2(coutVerre),
      coutAccessoires: this.round2(coutAccessoires),
      coutTotal: this.round2(coutTotal),
      series: serieResults
    };
  }

  private toNumber(v: unknown): number {
    const n = Number(v);
    return Number.isFinite(n) ? n : 0;
  }

  private round2(n: number): number {
    return Math.round((n + Number.EPSILON) * 100) / 100;
  }

  private createId(prefix: string): string {
    return globalThis.crypto?.randomUUID?.() ?? `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
  }
}
