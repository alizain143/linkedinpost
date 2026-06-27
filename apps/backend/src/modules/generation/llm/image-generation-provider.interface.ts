export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
}

export interface ImageGenerationProvider {
  generate(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse>;
}
