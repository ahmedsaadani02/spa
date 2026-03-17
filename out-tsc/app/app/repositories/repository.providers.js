import { inject } from '@angular/core';
import { shouldUseIpcRepositories } from '../bridge/spa-bridge';
import { ClientsIpcRepository } from './ipc/clients-ipc.repository';
import { InvoicesIpcRepository } from './ipc/invoices-ipc.repository';
import { QuotesIpcRepository } from './ipc/quotes-ipc.repository';
import { StockIpcRepository } from './ipc/stock-ipc.repository';
import { ClientsIndexedDbRepository } from './indexeddb/clients-indexeddb.repository';
import { InvoicesIndexedDbRepository } from './indexeddb/invoices-indexeddb.repository';
import { QuotesIndexedDbRepository } from './indexeddb/quotes-indexeddb.repository';
import { StockIndexedDbRepository } from './indexeddb/stock-indexeddb.repository';
import { CLIENTS_REPOSITORY } from './clients.repository';
import { INVOICES_REPOSITORY } from './invoices.repository';
import { QUOTES_REPOSITORY } from './quotes.repository';
import { STOCK_REPOSITORY } from './stock.repository';
export const REPOSITORY_PROVIDERS = [
    {
        provide: CLIENTS_REPOSITORY,
        useFactory: () => (shouldUseIpcRepositories() ? inject(ClientsIpcRepository) : inject(ClientsIndexedDbRepository))
    },
    {
        provide: INVOICES_REPOSITORY,
        useFactory: () => (shouldUseIpcRepositories() ? inject(InvoicesIpcRepository) : inject(InvoicesIndexedDbRepository))
    },
    {
        provide: QUOTES_REPOSITORY,
        useFactory: () => (shouldUseIpcRepositories() ? inject(QuotesIpcRepository) : inject(QuotesIndexedDbRepository))
    },
    {
        provide: STOCK_REPOSITORY,
        useFactory: () => (shouldUseIpcRepositories() ? inject(StockIpcRepository) : inject(StockIndexedDbRepository))
    }
];
