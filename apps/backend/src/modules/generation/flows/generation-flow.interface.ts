export interface GenerationFlow<TInput, TResult> {
  generate(input: TInput): Promise<TResult>;
}
