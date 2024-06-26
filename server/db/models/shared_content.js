module.exports = (sequelize, Sequelize) => {
  // console.log('SHARED_CONTENT!')

  const Shared_content = sequelize.define('shared_content', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    contentId: Sequelize.INTEGER,
    senderId: Sequelize.INTEGER,
    recipientId: Sequelize.INTEGER,
  });
  Shared_content.associate = function (models) {
    Shared_content.belongsTo(models.user, {
      as: 'sender',
      foreignKey: 'senderId',
    });
    Shared_content.belongsTo(models.user, {
      as: 'recipient',
      foreignKey: 'recipientId',
    });
    Shared_content.belongsTo(models.content, { foreignKey: 'contentId' });
  };
  return Shared_content;
};
