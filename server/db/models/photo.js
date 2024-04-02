module.exports = (sequelize, Sequelize) => {
  const Photo = sequelize.define("photo", {
    photoURL: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    description: {
      type: Sequelize.STRING,
      allowNull: false,
    },
  });

  Photo.associate = function (models) {
    Photo.hasOne(models.content, {
      foreignKey : {
        name: 'photoId',
      },
    });
  };
  return Photo;
};