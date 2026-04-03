import {
  Controller,
  Post,
  Param,
  Body,
  UseGuards,
  Req,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ImportService } from './import.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tournaments/:tournamentId/import')
@UseGuards(JwtAuthGuard)
export class ImportController {
  constructor(private importService: ImportService) {}

  /**
   * Import players from CSV file
   * Expected format: FirstName,LastName,Email,FIDE ID,Rating
   */
  @Post('players/csv')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_, file, callback) => {
        if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
          callback(null, true);
        } else {
          callback(new Error('Only CSV files are allowed'), false);
        }
      },
    }),
  )
  async importPlayersCsv(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { readFileSync } = require('fs');
    const content = readFileSync(file.path, 'utf-8');
    const { unlinkSync } = require('fs');

    try {
      const result = await this.importService.importPlayersFromCsv(
        req.user.userId,
        tournamentId,
        content,
      );

      // Clean up uploaded file
      unlinkSync(file.path);

      return result;
    } catch (err: any) {
      // Clean up uploaded file on error
      unlinkSync(file.path);
      throw err;
    }
  }

  /**
   * Import players from CSV content (alternative to file upload)
   */
  @Post('players/csv/raw')
  async importPlayersCsvRaw(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() body: { csv: string },
  ) {
    return this.importService.importPlayersFromCsv(
      req.user.userId,
      tournamentId,
      body.csv,
    );
  }

  /**
   * Parse PGN content (for preview before import)
   */
  @Post('pgn/parse')
  async parsePgn(@Body() body: { pgn: string }) {
    return this.importService.parsePgn(body.pgn);
  }

  /**
   * Import results from PGN file
   */
  @Post('results/pgn')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (_, file, callback) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          callback(null, `${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_, file, callback) => {
        if (file.mimetype === 'application/x-chess-pgn' || file.originalname.endsWith('.pgn')) {
          callback(null, true);
        } else {
          callback(new Error('Only PGN files are allowed'), false);
        }
      },
    }),
  )
  async importResultsPgn(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { readFileSync } = require('fs');
    const content = readFileSync(file.path, 'utf-8');
    const { unlinkSync } = require('fs');

    try {
      const result = await this.importService.importResultsFromPgn(tournamentId, content);

      // Clean up uploaded file
      unlinkSync(file.path);

      return result;
    } catch (err: any) {
      // Clean up uploaded file on error
      unlinkSync(file.path);
      throw err;
    }
  }

  /**
   * Import results from PGN content (alternative to file upload)
   */
  @Post('results/pgn/raw')
  async importResultsPgnRaw(
    @Req() req: any,
    @Param('tournamentId') tournamentId: string,
    @Body() body: { pgn: string },
  ) {
    return this.importService.importResultsFromPgn(tournamentId, body.pgn);
  }
}
