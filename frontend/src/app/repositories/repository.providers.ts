import { Provider, inject } from '@angular/core';
import { ClientsIpcRepository } from './ipc/clients-ipc.repository';
import { InvoicesIpcRepository } from './ipc/invoices-ipc.repository';
import { QuotesIpcRepository } from './ipc/quotes-ipc.repository';
import { StockIpcRepository } from './ipc/stock-ipc.repository';
import { CLIENTS_REPOSITORY } from './clients.repository';
import { INVOICES_REPOSITORY } from './invoices.repository';
import { QUOTES_REPOSITORY } from './quotes.repository';
import { STOCK_REPOSITORY } from './stock.repository';

export const REPOSITORY_PROVIDERS: Provider[] = [
  {
    provide: CLIENTS_REPOSITORY,
    useFactory: () => inject(ClientsIpcRepository)
  },
  {
    provide: INVOICES_REPOSITORY,
    useFactory: () => inject(InvoicesIpcRepository)
  },
  {
    provide: QUOTES_REPOSITORY,
    useFactory: () => inject(QuotesIpcRepository)
  },
  {
    provide: STOCK_REPOSITORY,
    useFactory: () => inject(StockIpcRepository)
  }
];
