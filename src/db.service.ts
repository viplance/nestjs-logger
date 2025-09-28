// DB layer

import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";

const defaultTable = "logs";

@Injectable()
export class LogDbService {
  private db: { [key: string]: any[] } = {};

  constructor(tables: string[] = [defaultTable]) {
    for (const table of tables) {
      this.db[table] = [];
    }
  }

  public insert(data: any, table = defaultTable): string {
    // generate new random ID
    const randomData = randomBytes(32).toString("hex");
    const id = createHash("sha256").update(randomData).digest("hex");

    this.db[table].push({
      ...data,
      id, // creader unique index
    });

    return id;
  }

  public getMany(table: string): any[] {
    return this.db[table];
  }

  public getOneById(id: string, table = defaultTable): any {
    return this.db[table].find((item) => item.id === id);
  }

  public getManyByProperty(
    field: string,
    value: string,
    table = defaultTable
  ): any[] {
    return this.db[table].filter((item) => item[field] === value);
  }
}
