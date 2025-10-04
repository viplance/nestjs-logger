// DB layer

import { Injectable } from "@nestjs/common";
import { createHash, randomBytes } from "crypto";
import { defaultTable } from "../defaults";

const tables = [defaultTable];

@Injectable()
export class LogDbService {
  private db: { [key: string]: any[] } = {};

  constructor() {
    for (const table of tables) {
      this.db[table] = [];
    }
  }

  public insert(table: string, data: any): string {
    // generate new random ID
    const randomData = randomBytes(32).toString("hex");
    const id = createHash("sha256").update(randomData).digest("hex");

    this.db[table].push({
      ...data,
      id, // creader unique index
    });

    console.log(this.db);

    return id;
  }

  public getMany(table: string): any[] {
    return this.db[table].map((log) => ({
      type: log.type,
      message: log.message,
    }));
  }

  public getOneById(table: string, id: string): any {
    return this.db[table].find((item) => item.id === id);
  }

  public getManyByProperty(table: string, field: string, value: string): any[] {
    return this.db[table].filter((item) => item[field] === value);
  }
}
