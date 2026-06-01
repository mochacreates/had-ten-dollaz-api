import { Controller, Post } from '@nestjs/common';
import { PocService } from './poc.service';

@Controller('poc')
export class PocController {
  constructor(private readonly pocService: PocService) {}

  @Post()
  execute() {
    return this.pocService.execute();
  }
}
