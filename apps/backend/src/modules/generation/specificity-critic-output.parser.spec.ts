import { SpecificityCriticOutputParser } from './specificity-critic-output.parser';

describe('SpecificityCriticOutputParser', () => {
  const parser = new SpecificityCriticOutputParser();

  it('parses a valid critic response', () => {
    const result = parser.parse(
      JSON.stringify({
        overall: 72,
        passed: false,
        variants: [
          {
            format: 'concise',
            specificity: 80,
            genericness: 20,
            padding: 15,
            passed: true,
            formatOk: true,
          },
          {
            format: 'detailed',
            specificity: 55,
            genericness: 75,
            padding: 40,
            passed: false,
            formatOk: true,
          },
          {
            format: 'pattern_interrupt',
            specificity: 70,
            genericness: 30,
            padding: 20,
            passed: false,
            formatOk: false,
          },
        ],
        hints: ['Detailed: add a concrete example'],
      }),
    );

    expect(result.passed).toBe(false);
    expect(result.hints).toHaveLength(1);
    expect(result.variants[1].genericness).toBe(75);
  });
});
