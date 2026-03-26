import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ScannerService } from './scanner.service';
import { PrismaService } from '../prisma/prisma.service';
import { ScanResult, PassStatus } from '@simsim/types';
import { Scanner } from '@prisma/client';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const SCANNER: Scanner = {
  id: 'scanner-1',
  community_id: 'community-1',
  scanner_code: 'GATE-A',
  device_key: 'key',
  scanner_name: 'Gate A',
  is_active: true,
  location_label: null,
  assigned_user_id: null,
  created_at: new Date(),
};

function makeGuestPass(overrides: Partial<{
  id: string;
  community_id: string;
  status: string;
  valid_from: Date;
  valid_until: Date;
  usage_count: number;
  usage_limit: number;
  qr_token_version: number;
  guest_name: string;
  guest_phone: string;
}> = {}) {
  return {
    id: 'pass-1',
    community_id: 'community-1',
    host_user_id: 'host-1',
    status: PassStatus.Active,
    valid_from: new Date(Date.now() - 1000),
    valid_until: new Date(Date.now() + 3600 * 1000),
    usage_count: 0,
    usage_limit: 1,
    qr_token_version: 1,
    guest_name: 'Alice',
    guest_phone: '+971501111111',
    host_user: { full_name: 'Bob', phone_number: '+971502222222' },
    host_membership: { unit_id: 'unit-1', unit: { unit_code: 'A-101' } },
    ...overrides,
  };
}

// ─── Test setup ───────────────────────────────────────────────────────────────

describe('ScannerService — validatePass (atomic increment)', () => {
  let service: ScannerService;

  const mockPrisma = {
    guestPass: {
      findUnique: jest.fn(),
      updateMany: jest.fn(),
    },
    accessLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  };

  const mockJwt = {
    verify: jest.fn(),
  };

  const mockConfig = {
    get: jest.fn().mockReturnValue('jwt-qr-secret'),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScannerService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ScannerService>(ScannerService);
  });

  it('grants access and atomically increments usage_count', async () => {
    const pass = makeGuestPass();
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 });
    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);
    mockPrisma.guestPass.updateMany.mockResolvedValue({ count: 1 }); // success

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Granted);
    expect(mockPrisma.guestPass.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: pass.id,
          usage_count: { lt: pass.usage_limit },
          status: PassStatus.Active,
          qr_token_version: 1,
        }),
        data: { usage_count: { increment: 1 } },
      }),
    );
  });

  it('denies when atomic increment returns count=0 (limit reached under concurrency)', async () => {
    const pass = makeGuestPass({ usage_count: 1, usage_limit: 1 });
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 });
    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);
    mockPrisma.guestPass.updateMany.mockResolvedValue({ count: 0 }); // concurrent scan already consumed it

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Denied);
    expect(result.denial_reason).toContain('limit');
  });

  it('denies expired pass', async () => {
    const pass = makeGuestPass({
      valid_until: new Date(Date.now() - 1000), // expired
    });
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 });
    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Denied);
    expect(mockPrisma.guestPass.updateMany).not.toHaveBeenCalled();
  });

  it('denies pass from different community', async () => {
    const pass = makeGuestPass({ community_id: 'other-community' });
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 });
    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Denied);
    expect(mockPrisma.guestPass.updateMany).not.toHaveBeenCalled();
  });

  it('denies invalidated pass (stale token version)', async () => {
    const pass = makeGuestPass({ qr_token_version: 2 }); // DB has v=2
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 }); // token has v=1

    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Denied);
    expect(result.denial_reason).toContain('invalidated');
  });

  it('denies on invalid/expired JWT token', async () => {
    mockJwt.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });

    const result = await service.validatePass(SCANNER, 'bad-token');

    expect(result.result).toBe(ScanResult.Denied);
    expect(result.denial_reason).toContain('expired');
  });

  it('denies cancelled pass', async () => {
    const pass = makeGuestPass({ status: 'cancelled' });
    mockJwt.verify.mockReturnValue({ type: 'guest_access', sub: pass.id, v: 1 });
    mockPrisma.guestPass.findUnique.mockResolvedValue(pass);

    const result = await service.validatePass(SCANNER, 'valid-token');

    expect(result.result).toBe(ScanResult.Denied);
  });
});
