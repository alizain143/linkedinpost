export type MockPrismaService = {
  user: {
    findUnique: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    findFirst: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  workspace: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
  };
  workspaceMember: {
    findUnique: jest.Mock;
    findMany: jest.Mock;
  };
  contentProfile: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    updateMany: jest.Mock;
    delete: jest.Mock;
  };
  contentPillar: {
    deleteMany: jest.Mock;
    createMany: jest.Mock;
  };
  postPackage: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    findUniqueOrThrow: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
    count: jest.Mock;
  };
  postVersion: {
    findFirst: jest.Mock;
    findMany: jest.Mock;
    create: jest.Mock;
    deleteMany: jest.Mock;
  };
  creditTransaction: {
    aggregate: jest.Mock;
    create: jest.Mock;
  };
  $transaction: jest.Mock;
};

export function createMockPrismaService(): MockPrismaService {
  const mock: MockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    workspace: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
    workspaceMember: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    contentProfile: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      delete: jest.fn(),
    },
    contentPillar: {
      deleteMany: jest.fn(),
      createMany: jest.fn(),
    },
    postPackage: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUniqueOrThrow: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    postVersion: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      deleteMany: jest.fn(),
    },
    creditTransaction: {
      aggregate: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn(),
  };

  mock.$transaction.mockImplementation(async (arg: unknown) => {
    if (typeof arg === 'function') {
      return arg(mock);
    }
    return Promise.all(arg as Promise<unknown>[]);
  });

  return mock;
}
