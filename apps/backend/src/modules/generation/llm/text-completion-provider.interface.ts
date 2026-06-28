import {
  TextCompletionRequest,
  TextCompletionResponse,
} from '../generation.types';

export interface TextCompletionProvider {
  complete(request: TextCompletionRequest): Promise<TextCompletionResponse>;
}
