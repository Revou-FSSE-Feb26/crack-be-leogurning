import {
  Controller,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { extname } from 'path';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { StrictThrottle } from 'src/common/decorators/custom-throttler.decorator';
import { PaymentProofsService } from './payment-proofs.service';
import { CreatePaymentProofDto } from './dto/create-payment-proof.dto';
import { RejectPaymentProofDto } from './dto/reject-payment-proof.dto';

const multerOptions = {
  storage: diskStorage({
    destination: './uploads/payment-proofs',
    filename: (_req, file, cb) => {
      const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  }),
  fileFilter: (_req: any, file: any, cb: any) => {
    if (
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf'
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};

@ApiTags('payment-proofs')
@Controller('payment-proofs')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth('JWT-auth')
export class PaymentProofsController {
  constructor(private readonly paymentProofsService: PaymentProofsService) {}

  @Post()
  @Roles(Role.CLIENT)
  @StrictThrottle()
  @UseInterceptors(FileInterceptor('file', multerOptions))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Upload payment proof',
    description: 'Client uploads a payment proof for an appointment',
  })
  @ApiResponse({ status: 201, description: 'Payment proof uploaded' })
  @ApiResponse({ status: 400, description: 'Invalid file or validation error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Client role required' })
  @ApiResponse({ status: 409, description: 'Payment proof already exists' })
  async create(
    @GetUser('id') userId: string,
    @Body() dto: CreatePaymentProofDto,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.paymentProofsService.create(userId, dto, file);
  }

  @Patch(':id/verify')
  @Roles(Role.ADMIN)
  @StrictThrottle()
  @ApiOperation({
    summary: 'Verify payment proof',
    description: 'Admin verifies a submitted payment proof',
  })
  @ApiResponse({ status: 200, description: 'Payment proof verified' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Payment proof not found' })
  async verify(@Param('id') id: string) {
    return this.paymentProofsService.verify(id);
  }

  @Patch(':id/reject')
  @Roles(Role.ADMIN)
  @StrictThrottle()
  @ApiOperation({
    summary: 'Reject payment proof',
    description: 'Admin rejects a submitted payment proof with reason',
  })
  @ApiResponse({ status: 200, description: 'Payment proof rejected' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  @ApiResponse({ status: 404, description: 'Payment proof not found' })
  async reject(
    @Param('id') id: string,
    @Body() dto: RejectPaymentProofDto,
  ) {
    return this.paymentProofsService.reject(id, dto);
  }
}
