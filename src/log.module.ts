import { Module, Global } from "@nestjs/common";
import { LogService } from "./log.service";
import { LogDbService } from "./db.service";

@Global()
@Module({
  providers: [LogService, LogDbService],
  exports: [LogService, LogDbService],
})
export class LogModule {}
