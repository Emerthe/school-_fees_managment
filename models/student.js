module.exports = (sequelize, DataTypes) => {
  return sequelize.define('Student', {
    name: { type: DataTypes.STRING, allowNull: false },
    fees: { type: DataTypes.FLOAT, allowNull: false },
    feePaid: { type: DataTypes.FLOAT, defaultValue: 0 }
  });
};
