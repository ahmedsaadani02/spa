# PostgreSQL Catalog Stock Domain Validation

- Status: `completed`
- Started at: `2026-03-24T13:32:09.224Z`
- Finished at: `2026-03-24T13:33:24.760Z`
- SQLite path kept: `C:\Users\Ahmed Saadani\AppData\Roaming\spa-invoice-desktop\spa.db`
- DB driver forced for audit: `postgres`
- Active PostgreSQL scopes: `clients, employees, salary, auth-security, products-read, stock-read, movements-read, price-history-read, products-metadata-write, products-core-write, products-structure-write, products-price-write, products-purge-write, stock-set-qty-write, stock-delta-write, movements-write, stock-apply-movement-write`
- Activation decision: `activable-in-controlled-environment`
- Base URL: `http://127.0.0.1:60030`

## Validated

- Le domaine catalogue/stock complet est coherent sur PostgreSQL en audit: lectures catalogue/stock/inventory/movements, mutations produit, historique prix, mutations stock et `stock:applyMovement` sont valides sur une meme sequence metier.
- Les relectures apres mutation, archive, restore et purge correspondent a la reference SQLite, y compris la preservation de l historique `movements` apres purge et la suppression de `stock`, `product_variants` et `price_history`.
- Le domaine peut etre active sur PostgreSQL en environnement controle sans divergence metier visible, sous reserve de garder `quotes` et `invoices` hors scope.

## Sequence Checks

- auth login: ok (owner audit session created)
- create product: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- update product: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- update price: ok (color=pg-audit-csd-color-a-mn4nm2dj)
- restore price: ok (color=pg-audit-csd-color-a-mn4nm2dj)
- setQty: ok (color=pg-audit-csd-color-b-mn4nm2dj qty=3)
- increment stock: ok (color=pg-audit-csd-color-b-mn4nm2dj delta=2)
- decrement stock: ok (color=pg-audit-csd-color-b-mn4nm2dj delta=1)
- add movement history: ok (id=ef41bb09-5370-404b-af01-07839f209e63)
- applyMovement positive: ok (id=0a92ae29-1eed-457b-ad52-7996c0db094b)
- applyMovement negative clamp: ok (id=f8cc1728-ef41-41aa-8e3c-320426a1e776)
- archive product: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- restore product: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- re-archive product for purge precondition: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- purge product: ok (id=b02ef51d-759f-4b11-9986-490aa8ba7e39)
- sqlite isolation: ok (reference=PG-CSD-MN4NM2DJ)

## Parity Checks

- after create active product: ok (matched SQLite reference)
- after create archived product: ok (matched SQLite reference)
- after create metadata: ok (matched SQLite reference)
- after create stock rows: ok (matched SQLite reference)
- after create stock item: ok (matched SQLite reference)
- after create inventory item: ok (matched SQLite reference)
- after create inventory total value: ok (matched SQLite reference)
- after create price history: ok (matched SQLite reference)
- after create movements: ok (matched SQLite reference)
- after create direct product: ok (matched SQLite reference)
- after create direct lifecycle: ok (matched SQLite reference)
- after create direct variants: ok (matched SQLite reference)
- after create direct metadata rows: ok (matched SQLite reference)
- after create direct stock count: ok (matched SQLite reference)
- after create direct price history count: ok (matched SQLite reference)
- after create direct movement count: ok (matched SQLite reference)
- after update active product: ok (matched SQLite reference)
- after update archived product: ok (matched SQLite reference)
- after update metadata: ok (matched SQLite reference)
- after update stock rows: ok (matched SQLite reference)
- after update stock item: ok (matched SQLite reference)
- after update inventory item: ok (matched SQLite reference)
- after update inventory total value: ok (matched SQLite reference)
- after update price history: ok (matched SQLite reference)
- after update movements: ok (matched SQLite reference)
- after update direct product: ok (matched SQLite reference)
- after update direct lifecycle: ok (matched SQLite reference)
- after update direct variants: ok (matched SQLite reference)
- after update direct metadata rows: ok (matched SQLite reference)
- after update direct stock count: ok (matched SQLite reference)
- after update direct price history count: ok (matched SQLite reference)
- after update direct movement count: ok (matched SQLite reference)
- after price writes active product: ok (matched SQLite reference)
- after price writes archived product: ok (matched SQLite reference)
- after price writes metadata: ok (matched SQLite reference)
- after price writes stock rows: ok (matched SQLite reference)
- after price writes stock item: ok (matched SQLite reference)
- after price writes inventory item: ok (matched SQLite reference)
- after price writes inventory total value: ok (matched SQLite reference)
- after price writes price history: ok (matched SQLite reference)
- after price writes movements: ok (matched SQLite reference)
- after price writes direct product: ok (matched SQLite reference)
- after price writes direct lifecycle: ok (matched SQLite reference)
- after price writes direct variants: ok (matched SQLite reference)
- after price writes direct metadata rows: ok (matched SQLite reference)
- after price writes direct stock count: ok (matched SQLite reference)
- after price writes direct price history count: ok (matched SQLite reference)
- after price writes direct movement count: ok (matched SQLite reference)
- after stock and movement mutations active product: ok (matched SQLite reference)
- after stock and movement mutations archived product: ok (matched SQLite reference)
- after stock and movement mutations metadata: ok (matched SQLite reference)
- after stock and movement mutations stock rows: ok (matched SQLite reference)
- after stock and movement mutations stock item: ok (matched SQLite reference)
- after stock and movement mutations inventory item: ok (matched SQLite reference)
- after stock and movement mutations inventory total value: ok (matched SQLite reference)
- after stock and movement mutations price history: ok (matched SQLite reference)
- after stock and movement mutations movements: ok (matched SQLite reference)
- after stock and movement mutations direct product: ok (matched SQLite reference)
- after stock and movement mutations direct lifecycle: ok (matched SQLite reference)
- after stock and movement mutations direct variants: ok (matched SQLite reference)
- after stock and movement mutations direct metadata rows: ok (matched SQLite reference)
- after stock and movement mutations direct stock count: ok (matched SQLite reference)
- after stock and movement mutations direct price history count: ok (matched SQLite reference)
- after stock and movement mutations direct movement count: ok (matched SQLite reference)
- after archive active product: ok (matched SQLite reference)
- after archive archived product: ok (matched SQLite reference)
- after archive metadata: ok (matched SQLite reference)
- after archive stock rows: ok (matched SQLite reference)
- after archive stock item: ok (matched SQLite reference)
- after archive inventory item: ok (matched SQLite reference)
- after archive inventory total value: ok (matched SQLite reference)
- after archive price history: ok (matched SQLite reference)
- after archive movements: ok (matched SQLite reference)
- after archive direct product: ok (matched SQLite reference)
- after archive direct lifecycle: ok (matched SQLite reference)
- after archive direct variants: ok (matched SQLite reference)
- after archive direct metadata rows: ok (matched SQLite reference)
- after archive direct stock count: ok (matched SQLite reference)
- after archive direct price history count: ok (matched SQLite reference)
- after archive direct movement count: ok (matched SQLite reference)
- after restore active product: ok (matched SQLite reference)
- after restore archived product: ok (matched SQLite reference)
- after restore metadata: ok (matched SQLite reference)
- after restore stock rows: ok (matched SQLite reference)
- after restore stock item: ok (matched SQLite reference)
- after restore inventory item: ok (matched SQLite reference)
- after restore inventory total value: ok (matched SQLite reference)
- after restore price history: ok (matched SQLite reference)
- after restore movements: ok (matched SQLite reference)
- after restore direct product: ok (matched SQLite reference)
- after restore direct lifecycle: ok (matched SQLite reference)
- after restore direct variants: ok (matched SQLite reference)
- after restore direct metadata rows: ok (matched SQLite reference)
- after restore direct stock count: ok (matched SQLite reference)
- after restore direct price history count: ok (matched SQLite reference)
- after restore direct movement count: ok (matched SQLite reference)
- after purge active product: ok (matched SQLite reference)
- after purge archived product: ok (matched SQLite reference)
- after purge metadata: ok (matched SQLite reference)
- after purge stock rows: ok (matched SQLite reference)
- after purge stock item: ok (matched SQLite reference)
- after purge inventory item: ok (matched SQLite reference)
- after purge inventory total value: ok (matched SQLite reference)
- after purge price history: ok (matched SQLite reference)
- after purge movements: ok (matched SQLite reference)
- after purge direct product: ok (matched SQLite reference)
- after purge direct lifecycle: ok (matched SQLite reference)
- after purge direct variants: ok (matched SQLite reference)
- after purge direct metadata rows: ok (matched SQLite reference)
- after purge direct stock count: ok (matched SQLite reference)
- after purge direct price history count: ok (matched SQLite reference)
- after purge direct movement count: ok (matched SQLite reference)

## Activation Plan

- Sur un environnement controle, definir `DB_DRIVER=postgres`, `DB_ENABLE_POSTGRES_CATALOG_READ=1`, `DB_ENABLE_POSTGRES_PRODUCT_WRITES=1` et `DB_ENABLE_POSTGRES_STOCK_WRITES=1`.
- Conserver SQLite et `DATABASE_PATH` en place pendant la premiere activation controlee pour garder le rollback simple.
- Activer d abord sur staging ou sur une instance backend isolee, puis rejouer ce script global avant d ouvrir le trafic utilisateur normal.
- Ne pas ouvrir encore `quotes` et `invoices`; la tranche suivante la plus sure reste ce domaine documentaire, traite separement.

## Remaining Risks

- None identified.

