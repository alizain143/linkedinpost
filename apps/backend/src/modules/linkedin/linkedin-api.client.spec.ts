import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { LinkedInApiClient } from './linkedin-api.client';

describe('LinkedInApiClient', () => {
  let client: LinkedInApiClient;
  const configService = {
    get: jest.fn((key: string, defaultValue?: unknown) => {
      const values: Record<string, unknown> = {
        'linkedin.publishMock': false,
        'linkedin.apiVersion': '202601',
        'linkedin.restBaseUrl': 'https://api.linkedin.com/rest',
      };
      return values[key] ?? defaultValue;
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    global.fetch = jest.fn();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LinkedInApiClient,
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    client = module.get(LinkedInApiClient);
  });

  it('publishes text-only posts without content.media', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn(() => 'urn:li:share:123'),
      },
    });

    await client.publishPost({
      accessToken: 'token',
      memberId: 'member-1',
      commentary: 'Hello world',
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.content).toBeUndefined();
  });

  it('publishes posts with image media in content.media', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      headers: {
        get: jest.fn(() => 'urn:li:share:456'),
      },
    });

    await client.publishPost({
      accessToken: 'token',
      memberId: 'member-1',
      commentary: 'Hello world',
      media: {
        imageUrn: 'urn:li:image:abc',
        altText: 'Quote card',
      },
    });

    const [, init] = (global.fetch as jest.Mock).mock.calls[0];
    const body = JSON.parse(init.body as string);
    expect(body.content).toEqual({
      media: {
        id: 'urn:li:image:abc',
        altText: 'Quote card',
      },
    });
  });

  it('runs mock image upload flow without network', async () => {
    configService.get.mockImplementation((key: string, defaultValue?: unknown) => {
      if (key === 'linkedin.publishMock') return true;
      const values: Record<string, unknown> = {
        'linkedin.apiVersion': '202601',
        'linkedin.restBaseUrl': 'https://api.linkedin.com/rest',
      };
      return values[key] ?? defaultValue;
    });

    const init = await client.initializeImageUpload({
      accessToken: 'token',
      ownerUrn: 'urn:li:person:member-1',
    });
    await client.uploadImageBinary({
      uploadUrl: init.uploadUrl,
      buffer: Buffer.from('png'),
      mimeType: 'image/png',
    });
    const result = await client.publishPost({
      accessToken: 'token',
      memberId: 'member-1',
      commentary: 'With image',
      media: { imageUrn: init.imageUrn, altText: 'Alt' },
    });

    expect(init.imageUrn).toContain('urn:li:image:mock-');
    expect(result.linkedInPostId).toContain('urn:li:share:mock-');
    expect(global.fetch).not.toHaveBeenCalled();
  });
});
