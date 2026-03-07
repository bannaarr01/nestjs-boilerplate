import {
   Res,
   Req,
   Get,
   Post,
   Body,
   Query,
   Param,
   Delete,
   Version,
   HttpStatus,
   Controller,
   UploadedFile,
   StreamableFile,
   UseInterceptors,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiResponse } from '../utils/api.util';
import { AttachmentService } from './attachment.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { GetAttachmentDto } from './dto/get-attachment.dto';
import { ApiVersion } from '../common/enums/api-version.enum';
import { LocalFileQuery } from './types/local-file-query.type';
import { ListAttachmentsDto } from './dto/list-attachments.dto';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { AuthenticatedUser, Public } from 'nest-keycloak-connect';
import { UploadAttachmentDto } from './dto/upload-attachment.dto';
import { AttachmentResponseDto } from './dto/attachment-response.dto';
import { MulterStorageConfig } from '../config/storage/multer-storage.config';
import { ErrorHandlerService } from '../common/services/error-handler.service';
import { ApiOperationAndResponses } from '../common/decorators/api-ops.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';

const DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ATTACHMENT_MAX_FILE_SIZE_BYTES = Number(
   process.env.ATTACHMENT_MAX_FILE_SIZE_BYTES || DEFAULT_MAX_FILE_SIZE_BYTES
);

@ApiTags('Attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentController {
   constructor(
    private readonly attachmentService: AttachmentService,
    private readonly errorHandler: ErrorHandlerService
   ) {}

  @Post()
  @Version(ApiVersion.ONE)
  @UseInterceptors(
     FileInterceptor('file', MulterStorageConfig.createUploadOptions(ATTACHMENT_MAX_FILE_SIZE_BYTES))
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
     schema: {
        type: 'object',
        required: ['file', 'entityType', 'entityId'],
        properties: {
           file: {
              type: 'string',
              format: 'binary'
           },
           entityType: {
              type: 'string',
              example: 'loan_application'
           },
           entityId: {
              type: 'string',
              example: 'app_123456'
           },
           description: {
              type: 'string',
              example: 'Front side of identity card'
           },
           metadata: {
              type: 'object',
              additionalProperties: true,
              example: {
                 source: 'portal',
                 category: 'identity'
              }
           },
           urlExpiresInSeconds: {
              type: 'number',
              example: 3600
           }
        }
     }
  })
  @ApiOperationAndResponses({
     summary: 'Upload attachment',
     description: 'Uploads one file and persists metadata.',
     responseModel: AttachmentResponseDto,
     responseStatus: HttpStatus.CREATED,
     responseDescriptions: {
        [HttpStatus.CREATED]: 'Attachment uploaded successfully',
        [HttpStatus.BAD_REQUEST]: 'Invalid payload or file type'
     }
  })
   async uploadAttachment(
    @UploadedFile() file: Express.Multer.File,
    @Body() uploadDto: UploadAttachmentDto,
    @AuthenticatedUser() currentUser: AuthUser
   ): Promise<ApiResponse<AttachmentResponseDto>> {
      try {
         const data = await this.attachmentService.uploadAttachment(file, uploadDto, currentUser?.sub);
         return new ApiResponse(data, {
            statusCode: HttpStatus.CREATED,
            message: 'Created'
         });
      } catch (error) {
         this.errorHandler.handleControllerError(error, AttachmentController, '.uploadAttachment');
      }
   }

  @Get('entity/:entityType/:entityId')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
     summary: 'List entity attachments',
     description: 'Lists all attachments belonging to an entity.',
     responseModel: AttachmentResponseDto,
     isArray: true
  })
  async listAttachmentsByEntity(
    @Param() params: ListAttachmentsDto,
    @Query('expiresInSeconds') expiresInSeconds?: string
  ): Promise<ApiResponse<AttachmentResponseDto[]>> {
     try {
        const expires = expiresInSeconds ? Number(expiresInSeconds) : undefined;
        const data = await this.attachmentService.listAttachmentsByEntity(params.entityType, params.entityId, expires);
        return new ApiResponse(data);
     } catch (error) {
        this.errorHandler.handleControllerError(error, AttachmentController, '.listAttachmentsByEntity');
     }
  }

  @Get(':id')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
     summary: 'Get attachment by id',
     description: 'Returns attachment metadata plus signed URL.',
     responseModel: AttachmentResponseDto,
     responseDescriptions: {
        [HttpStatus.NOT_FOUND]: 'Attachment not found'
     }
  })
  async getAttachmentById(
    @Param() params: GetAttachmentDto,
    @Query('expiresInSeconds') expiresInSeconds?: string
  ): Promise<ApiResponse<AttachmentResponseDto>> {
     try {
        const expires = expiresInSeconds ? Number(expiresInSeconds) : undefined;
        const data = await this.attachmentService.getAttachmentById(params.id, expires);
        return new ApiResponse(data);
     } catch (error) {
        this.errorHandler.handleControllerError(error, AttachmentController, '.getAttachmentById');
     }
  }

  @Delete(':id')
  @Version(ApiVersion.ONE)
  @ApiOperationAndResponses({
     summary: 'Delete attachment by id',
     description: 'Deletes metadata record and underlying file.',
     responseDescriptions: {
        [HttpStatus.OK]: 'Attachment deleted successfully',
        [HttpStatus.NOT_FOUND]: 'Attachment not found'
     }
  })
  async deleteAttachmentById(@Param() params: GetAttachmentDto): Promise<ApiResponse<null>> {
     try {
        await this.attachmentService.deleteAttachmentById(params.id);
        return new ApiResponse(null, { message: 'Attachment deleted successfully' });
     } catch (error) {
        this.errorHandler.handleControllerError(error, AttachmentController, '.deleteAttachmentById');
     }
  }

  @Public()
  @Get('files/*')
  @Version(ApiVersion.ONE)
  @ApiExcludeEndpoint()
  async getLocalFile(
    @Req() request: Request,
    @Query() query: LocalFileQuery,
    @Res({ passthrough: true }) response: Response
  ): Promise<StreamableFile> {
     try {
        const encodedKey = request.params[0] || '';
        const buffer = await this.attachmentService.getLocalFileBuffer(encodedKey, query);

        response.setHeader('Content-Type', 'application/octet-stream');
        response.setHeader('Content-Length', buffer.byteLength.toString());

        return new StreamableFile(buffer);
     } catch (error) {
        this.errorHandler.handleControllerError(error, AttachmentController, '.getLocalFile');
     }
  }
}
