const { DataTypes } = require('sequelize');
const sequelize = require('./database');

const Image = sequelize.define('Image', {
    url: {
        type: DataTypes.STRING,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
});

const Tag = sequelize.define('Tag', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
});

const ImageTag = sequelize.define('ImageTag', {
    relevance: {
        type: DataTypes.FLOAT,
        allowNull: false
    }
});

Image.belongsToMany(Tag, { through: ImageTag });
Tag.belongsToMany(Image, { through: ImageTag });

sequelize.sync();

module.exports = { Image, Tag, ImageTag };
