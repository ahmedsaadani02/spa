const { withClient } = require('../../db/postgres');

const addMovement = async (_db, movement, currentUser) => {
  if (!movement || !movement.id) return false;
  if (!currentUser) return false;

  const actorName = currentUser.nom || currentUser.username || 'unknown';

  return withClient(async (client) => {
    await client.query(
      `
        INSERT INTO movements (
          id,
          product_id,
          reference,
          label,
          category,
          serie,
          color,
          type,
          delta,
          before,
          after,
          reason,
          actor,
          employee_id,
          employee_name,
          username,
          at
        ) VALUES (
          $1,
          $2,
          $3,
          $4,
          $5,
          $6,
          $7,
          $8,
          $9,
          $10,
          $11,
          $12,
          $13,
          $14,
          $15,
          $16,
          $17
        )
      `,
      [
        movement.id,
        movement.itemId,
        movement.reference,
        movement.label,
        movement.category,
        movement.serie,
        movement.color,
        movement.type,
        Number(movement.delta) || 0,
        Number(movement.before) || 0,
        Number(movement.after) || 0,
        movement.reason ?? '',
        actorName,
        currentUser.id,
        actorName,
        currentUser.username,
        movement.at ?? new Date().toISOString()
      ]
    );

    return true;
  });
};

module.exports = {
  addMovement
};
