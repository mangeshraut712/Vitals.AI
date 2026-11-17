import { describe, expect, it } from 'vitest';
import { FileUploadSchema } from '../schemas';

describe('FileUploadSchema', () => {
  it('rejects XLSX MIME types because no XLSX ingestion path exists', () => {
    expect(FileUploadSchema.safeParse({
      filename: 'activity.csv',
      mimeType: 'text/csv',
      size: 128,
    }).success).toBe(true);

    expect(FileUploadSchema.safeParse({
      filename: 'inactive.xlsx',
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      size: 128,
    }).success).toBe(false);
  });
});
