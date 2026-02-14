// Memory DB layer
import { Injectable } from '@nestjs/common';
import { createHash, randomBytes } from 'crypto';
import { defaultTable } from '../defaults';
import { EntitySchema, FindManyOptions } from 'typeorm';

const tables = [defaultTable];

@Injectable()
export class MemoryDbService {
  private db: { [key: string]: any[] } = {};

  constructor() {
    for (const table of tables) {
      this.db[table] = [];
    }
  }

  public insert(entity: EntitySchema, data: any): string {
    const table = this.getTableName(entity);

    // generate new random _id
    const randomData = randomBytes(24).toString('hex');
    const _id = createHash('sha256').update(randomData).digest('hex');

    this.db[table].push({
      ...data,
      _id, // unique index
    });

    return _id;
  }

  public async update(
    entity: EntitySchema,
    condition: any,
    data: any
  ): Promise<string> {
    const table = this.getTableName(entity);
    let index: number | null = null;

    if (typeof condition === 'string') {
      index = this.findIndex(entity, { where: { _id: condition } });
    }

    if (condition?.where) {
      index = this.findIndex(entity, condition);
    }

    if (index !== null) {
      this.db[table][index] = {
        ...this.db[table][index],
        ...data,
      };

      return Promise.resolve(this.db[table][index]._id);
    }

    return Promise.reject();
  }

  public async find(
    entity: EntitySchema,
    options?: {
      select?: string[];
      where?: any;
      order?: { [key: string]: 'ASC' | 'DESC' };
      take?: number;
      skip?: number;
    }
  ): Promise<any[]> {
    const table = this.getTableName(entity);
    let data = [...this.db[table]];

    // filter by search if where contains $or or Like (simplified for memory db)
    // filter by search if where contains $or or Like (simplified for memory db)
    if (options?.where) {
      if (options.where.$or) {
        const search = options.where.$or[0].message.$regex;
        if (search) {
          const regex = new RegExp(search, 'i');
          data = data.filter(
            (item) => regex.test(item.message) || regex.test(item.trace || '')
          );
        }
      } else if (Array.isArray(options.where)) {
        // handle Like constraints
        const searchItem = options.where.find((w: any) => w.message);
        if (searchItem && searchItem.message) {
          let search = '';
          if (typeof searchItem.message === 'string') {
            search = searchItem.message.replace(/%/g, '');
          } else if (searchItem.message.value) {
            // FindOperator
            search = searchItem.message.value.replace(/%/g, '');
          } else if (searchItem.message._value) {
            // FindOperator private
            search = searchItem.message._value.replace(/%/g, '');
          }

          if (search) {
            const regex = new RegExp(search, 'i');
            data = data.filter(
              (item) => regex.test(item.message) || regex.test(item.trace || '')
            );
          }
        }
      }

      // Handle type filtering
      let types: string[] | null = null;
      let typeVal: any;

      if (Array.isArray(options.where)) {
        typeVal = options.where[0]?.type;
      } else {
        typeVal = options.where.type;
      }

      if (typeVal) {
        if (Array.isArray(typeVal)) {
          types = typeVal;
        } else if (typeVal.value && Array.isArray(typeVal.value)) {
          types = typeVal.value;
        } else if (typeVal._value && Array.isArray(typeVal._value)) {
          types = typeVal._value;
        } else if (typeVal.$in && Array.isArray(typeVal.$in)) {
          types = typeVal.$in;
        }
      }

      if (types) {
        data = data.filter((item) => types!.includes(item.type));
      }
    }

    // sort
    if (options?.order) {
      const field = Object.keys(options.order)[0];
      const direction = options.order[field];
      data.sort((a, b) => {
        if (a[field] < b[field]) return direction === 'ASC' ? -1 : 1;
        if (a[field] > b[field]) return direction === 'ASC' ? 1 : -1;
        return 0;
      });
    } else {
      data.sort((a, b) => b.updatedAt - a.updatedAt);
    }

    // pagination
    if (options?.skip !== undefined) {
      data = data.slice(options.skip);
    }
    if (options?.take !== undefined) {
      data = data.slice(0, options.take);
    }

    // mapping (select)
    let mapOptions = (obj: any) => obj; // return the object as is by default

    if (options?.select) {
      mapOptions = (obj: any) => {
        const newObj: any = {};

        for (const key of options.select || []) {
          newObj[key] = obj[key];
        }

        return newObj;
      };
    }

    return Promise.resolve(data.map(mapOptions));
  }

  public async getOneById(entity: EntitySchema, _id: string): Promise<any> {
    const table = this.getTableName(entity);

    return Promise.resolve(this.db[table].find((item) => item._id === _id));
  }

  public async delete(entity: EntitySchema, _id: string): Promise<any> {
    const table = this.getTableName(entity);
    this.db[table] = this.db[table].filter((item) => item._id !== _id);

    return Promise.resolve(_id);
  }

  public findByProperty(
    entity: EntitySchema,
    field: string,
    value: string
  ): any[] {
    const table = this.getTableName(entity);

    return this.db[table].filter((item) => item[field] === value);
  }

  public findOne(
    entity: EntitySchema,
    condition: { where: any }
  ): Promise<any> {
    const table = this.getTableName(entity);

    return Promise.resolve(
      this.db[table].find((item) => this.partialEqual(condition.where, item))
    );
  }

  private findIndex(entity: EntitySchema, condition: { where: any }): number {
    const table = this.getTableName(entity);

    return this.db[table].findIndex((item) =>
      this.partialEqual(condition.where, item)
    );
  }

  private partialEqual(obj1: any, obj2: any) {
    // compare primitive type values
    if (obj1 === obj2) return true;

    // handle null or non-object values
    if (
      obj1 == null ||
      obj2 == null ||
      typeof obj1 !== 'object' ||
      typeof obj2 !== 'object'
    ) {
      return false;
    }

    // compare keys length
    const keys1 = Object.keys(obj1);
    const keys2 = Object.keys(obj2);

    // compare values recursively
    for (const key of keys1) {
      if (!keys2.includes(key)) return false;

      if (!this.partialEqual(obj1[key], obj2[key])) return false;
    }

    return true;
  }

  private getTableName = (entity: EntitySchema) => entity.options.name;
}
