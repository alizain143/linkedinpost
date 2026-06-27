export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
}

export interface ImageGenerationResponse {
  imageUrl: string;
}

export interface ImageGenerationProvider {
  generate(
    request: ImageGenerationRequest,
  ): Promise<ImageGenerationResponse>;
}
