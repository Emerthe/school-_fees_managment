const { Sequelize, DataTypes } = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const dialect = process.env.DB_DIALECT || (env === 'test' ? 'sqlite' : 'mysql');

let sequelize;
if (dialect === 'sqlite') {
  sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
} else {
  sequelize = new Sequelize(
    process.env.DB_NAME || 'school_fees_db',
    process.env.DB_USER || 'root',
    process.env.DB_PASS || '',
    {
      host: process.env.DB_HOST || 'localhost',
      dialect: 'mysql',
      logging: false,
    }
  );
}

const Student = require('./student')(sequelize, DataTypes);
const User = require('./user')(sequelize, DataTypes);

module.exports = { sequelize, Student, User };
