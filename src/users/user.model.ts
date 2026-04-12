import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export interface UserAttributes {
  id:           number;
  email:        string;
  passwordHash: string;
  title:        string;
  firstName:    string;
  lastName:     string;
  role:         string;
  verified:     boolean;
  createdAt:    Date;
  updatedAt:    Date;
}

export interface UserCreationAttributes
  extends Optional<UserAttributes, 'id' | 'verified' | 'createdAt' | 'updatedAt'> {}

export class User
  extends Model<UserAttributes, UserCreationAttributes>
  implements UserAttributes {
  public id!:           number;
  public email!:        string;
  public passwordHash!: string;
  public title!:        string;
  public firstName!:    string;
  public lastName!:     string;
  public role!:         string;
  public verified!:     boolean;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof User {
  User.init(
    {
      id:           { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      email:        { type: DataTypes.STRING,  allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING,  allowNull: false },
      title:        { type: DataTypes.STRING,  allowNull: false },
      firstName:    { type: DataTypes.STRING,  allowNull: false },
      lastName:     { type: DataTypes.STRING,  allowNull: true },
      role:         { type: DataTypes.STRING,  allowNull: false },
      verified:     { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      createdAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt:    { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    {
      sequelize,
      modelName: 'User',
      tableName: 'users',
      timestamps: true,
      defaultScope: {
        attributes: { exclude: ['passwordHash'] },
      },
      scopes: {
        withHash: {
          attributes: { include: ['passwordHash'] },
        },
      },
    }
  );
  return User;
}