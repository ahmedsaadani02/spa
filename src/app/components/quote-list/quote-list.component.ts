import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { combineLatest, map, startWith } from 'rxjs';
import { Quote } from '../../models/quote';
import { QuoteCalcService } from '../../services/quote-calc.service';
import { QuoteStoreService } from '../../services/quote-store.service';

@Component({
  selector: 'app-quote-list',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './quote-list.component.html',
  styleUrls: ['./quote-list.component.css']
})
export class QuoteListComponent implements OnInit {
  readonly searchControl = new FormControl('', { nonNullable: true });
  readonly filteredQuotes$ = combineLatest([
    this.store.quotes$,
    this.searchControl.valueChanges.pipe(startWith(''))
  ]).pipe(
    map(([quotes, term]) => {
      const query = term.trim().toLowerCase();
      if (!query) {
        return quotes;
      }

      return quotes.filter((quote) => {
        return (
          quote.numero.toLowerCase().includes(query) ||
          quote.client.nom.toLowerCase().includes(query)
        );
      });
    })
  );

  constructor(private store: QuoteStoreService, private calc: QuoteCalcService) {}

  async ngOnInit(): Promise<void> {
    await this.store.load();
  }

  totalTTC(quote: Quote): number {
    return this.calc.totals(quote).totalTTC;
  }

  async deleteQuote(quote: Quote): Promise<void> {
    const confirmed = confirm(`Supprimer le devis ${quote.numero} ?`);
    if (!confirmed) {
      return;
    }

    await this.store.delete(quote.id);
  }
}
