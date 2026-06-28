export interface ImageGenerationRequest {
  prompt: string;
  width?: number;
  height?: number;
  headlineText?: string;
  styleNotes?: string;
}

export interface ImageGenerationResponse {
  imageBuffer: Buffer;
  mimeType: string;
  model: string;
}

export interface ImageGenerationProvider {
  generate(request: ImageGenerationRequest): Promise<ImageGenerationResponse>;
}
