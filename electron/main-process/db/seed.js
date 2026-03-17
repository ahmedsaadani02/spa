const crypto = require('crypto');

const createId = () => crypto.randomUUID?.() ?? `id_${Date.now()}_${Math.random().toString(16).slice(2)}`;

const seedProductsIfEmpty = (db) => {
  const count = db.prepare('SELECT COUNT(1) as count FROM products').get();
  if (count?.count > 0) return;

  const products = buildSeedProducts();
  const insertProduct = db.prepare(`
    INSERT INTO products (
      id, reference, label, description, category, serie, unit, image_url, low_stock_threshold, last_updated, price_ttc
    ) VALUES (
      @id, @reference, @label, @description, @category, @serie, @unit, @image_url, @low_stock_threshold, @last_updated, @price_ttc
    )
  `);
  const insertStock = db.prepare(`
    INSERT INTO stock (product_id, color, qty)
    VALUES (@product_id, @color, @qty)
  `);

  const now = new Date().toISOString();
  const tx = db.transaction(() => {
    products.forEach((product) => {
      insertProduct.run({
        ...product,
        last_updated: now,
        price_ttc: product.price_ttc ?? null
      });

      const colors = product.category === 'joint' ? ['noir'] : ['blanc', 'gris', 'noir'];
      colors.forEach((color) => {
        insertStock.run({ product_id: product.id, color, qty: 0 });
      });
    });
  });

  tx();
};

const buildSeedProducts = () => {
  const products = [];
  const nowId = () => createId();

  const profileRefs = [
    '40 100', '40 102', '40 104', '40 107', '40 108', '40 110',
    '40 112', '40 121', '40 128', '40 139', '40 148', '40 150',
    '40 151', '40 153', '40 154', '40 155', '40 156', '40 161',
    '40 164', '40 166', '40 401', '40 402'
  ];

  profileRefs.forEach((ref) => {
    products.push({
      id: nowId(),
      reference: ref,
      label: `Profil Serie 40 - ${ref}`,
      description: '',
      category: 'profil',
      serie: '40',
      unit: 'barre',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 2
    });
  });

  const joints40 = [
    'Joint de vitrage 3mm',
    'Joint de bourrage 2mm',
    'Joint brosse 8mm',
    'Joint de battement'
  ];

  joints40.forEach((label) => {
    products.push({
      id: nowId(),
      reference: label,
      label,
      description: '',
      category: 'joint',
      serie: '40',
      unit: 'm',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 5
    });
  });

  const accessoires40 = [
    'Equerre à pion',
    'Equerre à sertir en Alu',
    'Béquille Luna',
    'Crémone Luna',
    'Loqueteau pour souet',
    'Serrure verticale sans cylindre (Pêne dormant et demi tour)',
    'Serrure horizontale (Pêne dormant et demi tour)',
    'Serrure verticale sans cylindre (pêne dormant et rouleau)',
    'Busette anti-vent',
    'Angle pour parcloses arrondies',
    "Compas d'arrêt pour souet",
    'Cylindre 60 mm Européen 30 30',
    'Cylindre 70 mm à olive 30 40',
    'Gâche pour serrure verticale en PVC',
    'Embout battement central',
    'Kit crémone',
    'Kit semi fixe',
    'Ferme porte'
  ];

  accessoires40.forEach((label) => {
    products.push({
      id: nowId(),
      reference: label,
      label,
      description: '',
      category: 'accessoire',
      serie: '40',
      unit: 'piece',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 3
    });
  });

  const profiles67 = [
    '67 101',
    '67 102',
    '67 103',
    '67 104',
    '67 105',
    '67 106',
    '67 107',
    '67 108',
    '67 114'
  ];

  profiles67.forEach((ref) => {
    products.push({
      id: nowId(),
      reference: ref,
      label: `Profil Serie 67 - ${ref}`,
      description: '',
      category: 'profil',
      serie: '67',
      unit: 'barre',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 3
    });
  });

  const accessoires67 = [
    'Kit coulissant',
    'Equerre a visser dormant',
    'Busette antivent',
    'Fermeture encastree fenetre fermeture automatique',
    'Fermeture encastree porte-fenetre fermeture avec boutin de debloquage'
  ];

  accessoires67.forEach((label) => {
    products.push({
      id: nowId(),
      reference: label,
      label,
      description: '',
      category: 'accessoire',
      serie: '67',
      unit: 'piece',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 3
    });
  });

  const joints67 = [
    'Joint brosse (fin seal) 6 mm',
    'Joint U de vitarge 6 mm'
  ];

  joints67.forEach((label) => {
    products.push({
      id: nowId(),
      reference: label,
      label,
      description: '',
      category: 'joint',
      serie: '67',
      unit: 'ml',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 5
    });
  });

  for (let i = 1; i <= 9; i += 1) {
    const label = `Accessoire Porte Securite - ${String(i).padStart(2, '0')}`;
    products.push({
      id: nowId(),
      reference: `PS-ACC-${String(i).padStart(2, '0')}`,
      label,
      description: '',
      category: 'accessoire',
      serie: 'porte-securite',
      unit: 'piece',
      image_url: 'assets/placeholder.png',
      low_stock_threshold: 3
    });
  }

  return products;
};

module.exports = { seedProductsIfEmpty };

