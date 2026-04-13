import { DataTypes, Model, Optional } from 'sequelize';
import type { Sequelize } from 'sequelize';

export type RequestType   = 'Equipment' | 'Leave' | 'Resources';
export type RequestStatus = 'Pending' | 'Approved' | 'Rejected';

export interface RequestItem {
  name: string;
  qty:  number;
}

export interface RequestAttributes {
  id:        number;
  type:      RequestType;
  items:     RequestItem[];
  status:    RequestStatus;
  date:      string;
  userId:    number;
  createdAt: Date;
  updatedAt: Date;
}

export interface RequestCreationAttributes
  extends Optional<RequestAttributes, 'id' | 'status' | 'date' | 'createdAt' | 'updatedAt'> {}

export class Request
  extends Model<RequestAttributes, RequestCreationAttributes>
  implements RequestAttributes {
  public id!:        number;
  public type!:      RequestType;
  public items!:     RequestItem[];
  public status!:    RequestStatus;
  public date!:      string;
  public userId!:    number;
  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

export default function (sequelize: Sequelize): typeof Request {
  Request.init(
    {
      id:     { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
      type:   { type: DataTypes.ENUM('Equipment', 'Leave', 'Resources'), allowNull: false },
      items:  {
        type: DataTypes.TEXT,   // store as TEXT so MySQL never mangles it
        allowNull: false,
        // Always serialize to JSON string on save
        set(value: RequestItem[]) {
          this.setDataValue('items', JSON.stringify(value) as any);
        },
        // Always parse back to array on read
        get() {
          const raw = this.getDataValue('items');
          if (!raw) return [];
          if (Array.isArray(raw)) return raw;
          try {
            return JSON.parse(raw as any);
          } catch {
            return [];
          }
        },
      },
      status: { type: DataTypes.ENUM('Pending', 'Approved', 'Rejected'), allowNull: false, defaultValue: 'Pending' },
      date:   { type: DataTypes.DATEONLY, allowNull: false, defaultValue: DataTypes.NOW },
      userId: { type: DataTypes.INTEGER,  allowNull: false, references: { model: 'users', key: 'id' } },
      createdAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
      updatedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
    },
    { sequelize, modelName: 'Request', tableName: 'requests', timestamps: true }
  );
  return Request;
}